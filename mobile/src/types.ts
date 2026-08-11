export type ChatRole = 'gaitonde' | 'bunty';

export type ChatMessage = {
  id: string;
  from: ChatRole;
  text: string;
  time: string;
};

export type Presence = {
  gaitonde: boolean;
  bunty: boolean;
};

export type ServerEvent =
  | { type: 'welcome'; message: string }
  | { type: 'joined'; role: ChatRole; peer: ChatRole }
  | { type: 'presence'; online: Presence }
  | { type: 'message'; id: string; from: ChatRole; text: string; time: string }
  | { type: 'error'; message: string };
