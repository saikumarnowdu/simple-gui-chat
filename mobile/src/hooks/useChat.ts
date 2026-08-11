import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { CHAT_WS_URL } from '../config';
import { store } from '../store';
import { useAppDispatch } from '../store/hooks';
import {
  appendMessages,
  clearMessages,
  replaceMessages,
  updateMessageStatus,
} from '../store/messagesSlice';
import {
  resetSession,
  setActiveRoomId,
  setError,
  setPresence,
  setRoomMembers,
  setRooms,
  setStatus,
  setStressRunning,
  setTypingUser,
} from '../store/sessionSlice';
import type { ChatMessage, ChatRole, ServerEvent, UserProfile } from '../types';
import { BOT_DISPLAY_NAME, BOT_USER_ID, localBotReply } from '../utils/bot';
import { MessageBatcher } from '../utils/messageBatcher';
import { notifyNewMessage } from '../utils/notifications';
import { loadRoomMessages, saveRoomMessages } from '../utils/persistence';

function nowTime() {
  return new Date().toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function useChat(options: {
  profile: UserProfile | null;
  roomId: string | null;
  /** Legacy classic role mode */
  legacyRole?: ChatRole | null;
}) {
  const { profile, roomId, legacyRole = null } = options;
  const dispatch = useAppDispatch();
  const socketRef = useRef<WebSocket | null>(null);
  const batcherRef = useRef<MessageBatcher | null>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stressSeqRef = useRef(0);
  const appFocusedRef = useRef(true);
  const roomIdRef = useRef(roomId);
  const profileRef = useRef(profile);
  roomIdRef.current = roomId;
  profileRef.current = profile;

  const ensureBatcher = useCallback(() => {
    if (!batcherRef.current) {
      batcherRef.current = new MessageBatcher({ dispatch });
      batcherRef.current.start();
    }
    return batcherRef.current;
  }, [dispatch]);

  const schedulePersist = useCallback(() => {
    if (!roomIdRef.current) return;
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      const activeRoom = roomIdRef.current;
      if (!activeRoom) return;
      const messages = store.getState().messages.items;
      void saveRoomMessages(activeRoom, messages);
    }, 400);
  }, []);

  const stopStress = useCallback(() => {
    if (stressTimerRef.current) {
      clearInterval(stressTimerRef.current);
      stressTimerRef.current = null;
    }
    dispatch(setStressRunning(false));
  }, [dispatch]);

  const teardownSocket = useCallback(() => {
    const ws = socketRef.current;
    socketRef.current = null;
    if (ws) {
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;
      ws.close();
    }
  }, []);

  const handleIncomingMessage = useCallback(
    (message: ChatMessage) => {
      const batcher = ensureBatcher();
      batcher.enqueue(message);
      schedulePersist();

      const state = store.getState();
      const selfId = state.session.profile?.userId;
      if (message.from && message.from !== selfId) {
        void notifyNewMessage({
          enabled: state.session.notificationsEnabled,
          title: message.fromName || message.from,
          body: message.text || 'Sent a photo',
          appFocused: appFocusedRef.current,
        });

        // Auto-ack delivered/read when focused.
        const ws = socketRef.current;
        if (ws && ws.readyState === WebSocket.OPEN && message.roomId) {
          ws.send(
            JSON.stringify({
              type: 'receipt',
              messageId: message.id,
              status: appFocusedRef.current ? 'read' : 'delivered',
            }),
          );
        }
      }
    },
    [ensureBatcher, schedulePersist],
  );

  const connect = useCallback(() => {
    const activeProfile = profileRef.current;
    const activeRoom = roomIdRef.current;
    if (!activeProfile || !activeRoom) {
      return;
    }

    stopStress();
    teardownSocket();
    dispatch(setError(null));
    dispatch(setStatus('connecting'));

    const batcher = ensureBatcher();
    const ws = new WebSocket(CHAT_WS_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      if (socketRef.current !== ws) return;
      dispatch(setStatus('connected'));

      if (legacyRole) {
        ws.send(JSON.stringify({ type: 'join', role: legacyRole }));
      } else {
        ws.send(
          JSON.stringify({
            type: 'auth',
            userId: activeProfile.userId,
            displayName: activeProfile.displayName,
            avatarId: activeProfile.avatarId,
          }),
        );
      }
    };

    ws.onmessage = (event) => {
      if (socketRef.current !== ws) return;
      let data: ServerEvent;
      try {
        data = JSON.parse(String(event.data));
      } catch {
        return;
      }

      switch (data.type) {
        case 'authenticated':
          ws.send(JSON.stringify({ type: 'join_room', roomId: activeRoom }));
          break;
        case 'joined':
          dispatch(setStatus('joined'));
          dispatch(setActiveRoomId(data.roomId || activeRoom));
          break;
        case 'rooms':
          dispatch(setRooms(data.rooms));
          break;
        case 'room_joined':
          dispatch(setStatus('joined'));
          dispatch(setActiveRoomId(data.room.id));
          dispatch(setRoomMembers(data.members));
          break;
        case 'presence':
          if (data.members) {
            dispatch(setRoomMembers(data.members));
          } else if (data.online) {
            dispatch(setPresence(data.online));
          }
          break;
        case 'typing':
          if (data.userId !== activeProfile.userId) {
            dispatch(
              setTypingUser({
                userId: data.userId,
                displayName: data.displayName,
                isTyping: data.isTyping,
              }),
            );
          }
          break;
        case 'receipt':
          dispatch(
            updateMessageStatus({
              messageId: data.messageId,
              status: data.status,
            }),
          );
          schedulePersist();
          break;
        case 'message':
          handleIncomingMessage({
            id: data.id,
            from: data.from,
            fromName: data.fromName,
            avatarId: data.avatarId,
            text: data.text,
            time: data.time,
            roomId: data.roomId,
            mediaUri: data.mediaUri,
            status: data.status,
          });
          break;
        case 'error':
          dispatch(setError(data.message));
          break;
        default:
          break;
      }
    };

    ws.onerror = () => {
      if (socketRef.current !== ws) return;
      dispatch(setError(`Could not reach chat server at ${CHAT_WS_URL}`));
    };

    ws.onclose = () => {
      if (socketRef.current !== ws) return;
      socketRef.current = null;
      if (store.getState().session.status !== 'error') {
        dispatch(setStatus('disconnected'));
      }
    };
  }, [
    dispatch,
    ensureBatcher,
    handleIncomingMessage,
    legacyRole,
    schedulePersist,
    stopStress,
    teardownSocket,
  ]);

  useEffect(() => {
    const onAppState = (next: AppStateStatus) => {
      appFocusedRef.current = next === 'active';
    };
    const sub = AppState.addEventListener('change', onAppState);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!profile || !roomId) {
      stopStress();
      teardownSocket();
      batcherRef.current?.flush();
      return;
    }

    let cancelled = false;
    (async () => {
      dispatch(clearMessages());
      dispatch(setActiveRoomId(roomId));
      const cached = await loadRoomMessages(roomId);
      if (!cancelled && cached.length) {
        dispatch(replaceMessages(cached));
      }
      connect();
    })();

    return () => {
      cancelled = true;
      stopStress();
      teardownSocket();
      batcherRef.current?.flush();
      if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    };
  }, [profile, roomId, connect, dispatch, stopStress, teardownSocket]);

  const sendMessage = useCallback(
    (text: string, mediaUri?: string | null) => {
      const trimmed = text.trim();
      if (!trimmed && !mediaUri) return false;

      const state = store.getState();
      const activeRoom = roomIdRef.current;
      const activeProfile = profileRef.current;
      if (!activeRoom || !activeProfile) return false;

      const ws = socketRef.current;
      const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const optimistic: ChatMessage = {
        id: localId,
        from: activeProfile.userId,
        fromName: activeProfile.displayName,
        avatarId: activeProfile.avatarId,
        text: trimmed,
        mediaUri: mediaUri || null,
        time: nowTime(),
        roomId: activeRoom,
        status: 'pending',
      };

      // Always show locally for snappy UI + offline-ish bot lounge fallback.
      ensureBatcher().enqueue(optimistic);
      schedulePersist();

      if (ws && ws.readyState === WebSocket.OPEN && state.session.status === 'joined') {
        ws.send(
          JSON.stringify({
            type: 'message',
            id: localId,
            text: trimmed,
            mediaUri: mediaUri || null,
          }),
        );
      } else if (
        state.session.botEnabled &&
        (activeRoom === 'bot-lounge' || trimmed.startsWith('/') || trimmed.includes('@bot'))
      ) {
        setTimeout(() => {
          handleIncomingMessage({
            id: `bot-${Date.now()}`,
            from: BOT_USER_ID,
            fromName: BOT_DISPLAY_NAME,
            avatarId: 'bot',
            text: localBotReply(trimmed || 'photo'),
            time: nowTime(),
            roomId: activeRoom,
            status: 'delivered',
          });
        }, 300);
      }

      return true;
    },
    [ensureBatcher, handleIncomingMessage, schedulePersist],
  );

  const sendTyping = useCallback((isTyping: boolean) => {
    const ws = socketRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'typing', isTyping }));
  }, []);

  const notifyTyping = useCallback(() => {
    sendTyping(true);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => sendTyping(false), 1200);
  }, [sendTyping]);

  const startStress = useCallback(
    (ratePerSecond: number) => {
      stopStress();
      const activeProfile = profileRef.current;
      const activeRoom = roomIdRef.current;
      if (!activeProfile || !activeRoom) return;

      const batcher = ensureBatcher();
      const tickMs = 16;
      const perTick = Math.max(1, Math.round((ratePerSecond * tickMs) / 1000));
      dispatch(setStressRunning(true));
      stressTimerRef.current = setInterval(() => {
        const batch: ChatMessage[] = [];
        for (let i = 0; i < perTick; i += 1) {
          stressSeqRef.current += 1;
          const seq = stressSeqRef.current;
          batch.push({
            id: `stress-${seq}`,
            from: seq % 2 === 0 ? activeProfile.userId : 'peer',
            fromName: seq % 2 === 0 ? activeProfile.displayName : 'Peer',
            text: `#${seq} stress @${ratePerSecond}/s`,
            time: nowTime(),
            roomId: activeRoom,
            status: 'delivered',
          });
        }
        batcher.enqueueMany(batch);
        schedulePersist();
      }, tickMs);
    },
    [dispatch, ensureBatcher, schedulePersist, stopStress],
  );

  return {
    sendMessage,
    notifyTyping,
    reconnect: connect,
    clearError: () => {
      dispatch(setError(null));
      if (socketRef.current?.readyState === WebSocket.OPEN) {
        dispatch(setStatus('joined'));
      } else {
        dispatch(setStatus('disconnected'));
      }
    },
    startStress,
    stopStress,
  };
}
