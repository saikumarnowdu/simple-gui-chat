import { useCallback, useEffect, useRef, useState } from 'react';
import { CHAT_WS_URL } from '../config';
import type { ChatMessage, ChatRole, Presence, ServerEvent } from '../types';

type ConnectionStatus = 'connecting' | 'connected' | 'joined' | 'disconnected' | 'error';

const EMPTY_PRESENCE: Presence = { gaitonde: false, bunty: false };

export function useChat(role: ChatRole | null) {
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [presence, setPresence] = useState<Presence>(EMPTY_PRESENCE);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const roleRef = useRef(role);
  roleRef.current = role;

  const disconnect = useCallback(() => {
    socketRef.current?.close();
    socketRef.current = null;
    setStatus('disconnected');
  }, []);

  const connect = useCallback(() => {
    const selectedRole = roleRef.current;
    if (!selectedRole) {
      return;
    }

    disconnect();
    setError(null);
    setStatus('connecting');

    const ws = new WebSocket(CHAT_WS_URL);
    socketRef.current = ws;

    ws.onopen = () => {
      setStatus('connected');
      ws.send(JSON.stringify({ type: 'join', role: selectedRole }));
    };

    ws.onmessage = (event) => {
      let data: ServerEvent;
      try {
        data = JSON.parse(String(event.data));
      } catch {
        return;
      }

      switch (data.type) {
        case 'joined':
          setStatus('joined');
          break;
        case 'presence':
          setPresence(data.online);
          break;
        case 'message':
          setMessages((prev) => {
            if (prev.some((m) => m.id === data.id)) {
              return prev;
            }
            return [
              ...prev,
              {
                id: data.id,
                from: data.from,
                text: data.text,
                time: data.time,
              },
            ];
          });
          break;
        case 'error':
          setError(data.message);
          setStatus('error');
          break;
        default:
          break;
      }
    };

    ws.onerror = () => {
      setError(`Could not reach chat server at ${CHAT_WS_URL}`);
      setStatus('error');
    };

    ws.onclose = () => {
      setStatus((current) => (current === 'error' ? current : 'disconnected'));
      socketRef.current = null;
    };
  }, [disconnect]);

  useEffect(() => {
    if (!role) {
      disconnect();
      setMessages([]);
      setPresence(EMPTY_PRESENCE);
      setError(null);
      return;
    }

    connect();
    return () => disconnect();
  }, [role, connect, disconnect]);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    const ws = socketRef.current;
    if (!trimmed || !ws || ws.readyState !== WebSocket.OPEN) {
      return false;
    }
    ws.send(JSON.stringify({ type: 'message', text: trimmed }));
    return true;
  }, []);

  return {
    status,
    messages,
    presence,
    error,
    sendMessage,
    reconnect: connect,
    clearError: () => setError(null),
  };
}
