import { useCallback, useEffect, useRef } from 'react';
import { CHAT_WS_URL } from '../config';
import { store } from '../store';
import { useAppDispatch } from '../store/hooks';
import { clearMessages } from '../store/messagesSlice';
import {
  resetSession,
  setError,
  setPresence,
  setStatus,
  setStressRunning,
} from '../store/sessionSlice';
import type { ChatMessage, ChatRole, ServerEvent } from '../types';
import { MessageBatcher } from '../utils/messageBatcher';

export function useChat(role: ChatRole | null) {
  const dispatch = useAppDispatch();
  const socketRef = useRef<WebSocket | null>(null);
  const batcherRef = useRef<MessageBatcher | null>(null);
  const roleRef = useRef(role);
  const stressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stressSeqRef = useRef(0);
  roleRef.current = role;

  const ensureBatcher = useCallback(() => {
    if (!batcherRef.current) {
      batcherRef.current = new MessageBatcher({ dispatch });
      batcherRef.current.start();
    }
    return batcherRef.current;
  }, [dispatch]);

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

  const connect = useCallback(() => {
    const selectedRole = roleRef.current;
    if (!selectedRole) {
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
      if (socketRef.current !== ws) {
        return;
      }
      dispatch(setStatus('connected'));
      ws.send(JSON.stringify({ type: 'join', role: selectedRole }));
    };

    ws.onmessage = (event) => {
      if (socketRef.current !== ws) {
        return;
      }

      let data: ServerEvent;
      try {
        data = JSON.parse(String(event.data));
      } catch {
        return;
      }

      switch (data.type) {
        case 'joined':
          dispatch(setStatus('joined'));
          break;
        case 'presence':
          dispatch(setPresence(data.online));
          break;
        case 'message':
          batcher.enqueue({
            id: data.id,
            from: data.from,
            text: data.text,
            time: data.time,
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
      if (socketRef.current !== ws) {
        return;
      }
      dispatch(setError(`Could not reach chat server at ${CHAT_WS_URL}`));
    };

    ws.onclose = () => {
      if (socketRef.current !== ws) {
        return;
      }
      socketRef.current = null;
      if (store.getState().session.status !== 'error') {
        dispatch(setStatus('disconnected'));
      }
    };
  }, [dispatch, ensureBatcher, stopStress, teardownSocket]);

  useEffect(() => {
    if (!role) {
      stopStress();
      teardownSocket();
      batcherRef.current?.stop();
      batcherRef.current = null;
      dispatch(clearMessages());
      dispatch(resetSession());
      return;
    }

    connect();
    return () => {
      stopStress();
      teardownSocket();
      batcherRef.current?.flush();
    };
  }, [role, connect, dispatch, stopStress, teardownSocket]);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    const ws = socketRef.current;
    if (!trimmed || !ws || ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    ws.send(JSON.stringify({ type: 'message', text: trimmed }));
    return true;
  }, []);

  /**
   * Local high-rate injector used to verify Redux + UI can absorb 200–500 msg/s
   * without depending on network latency.
   */
  const startStress = useCallback(
    (ratePerSecond: number) => {
      stopStress();
      const selectedRole = roleRef.current;
      if (!selectedRole) {
        return;
      }

      const batcher = ensureBatcher();
      const peer: ChatRole = selectedRole === 'gaitonde' ? 'bunty' : 'gaitonde';
      const tickMs = 16;
      const perTick = Math.max(1, Math.round((ratePerSecond * tickMs) / 1000));

      dispatch(setStressRunning(true));
      stressTimerRef.current = setInterval(() => {
        const now = new Date();
        const time = now.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
        const batch: ChatMessage[] = [];
        for (let i = 0; i < perTick; i += 1) {
          stressSeqRef.current += 1;
          const seq = stressSeqRef.current;
          batch.push({
            id: `stress-${seq}`,
            from: seq % 2 === 0 ? selectedRole : peer,
            text: `#${seq} stress @${ratePerSecond}/s`,
            time,
          });
        }
        batcher.enqueueMany(batch);
      }, tickMs);
    },
    [dispatch, ensureBatcher, stopStress],
  );

  return {
    sendMessage,
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
