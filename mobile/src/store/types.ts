import type { ChatMessage, ChatRole, Presence } from '../types';

export type ConnectionStatus =
  | 'connecting'
  | 'connected'
  | 'joined'
  | 'disconnected'
  | 'error';

export type { ChatMessage, ChatRole, Presence };
