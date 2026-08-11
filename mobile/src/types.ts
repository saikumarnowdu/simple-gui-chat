export type ChatRole = 'gaitonde' | 'bunty';

export type ReceiptStatus = 'pending' | 'sent' | 'delivered' | 'read';

export type ChatMessage = {
  id: string;
  from: string;
  fromName?: string;
  avatarId?: string;
  text: string;
  time: string;
  roomId?: string;
  mediaUri?: string | null;
  status?: ReceiptStatus;
};

export type Presence = {
  gaitonde: boolean;
  bunty: boolean;
};

export type RoomMember = {
  userId: string;
  displayName: string;
  avatarId: string;
  online: boolean;
};

export type ChatRoom = {
  id: string;
  name: string;
  memberCount: number;
};

export type UserProfile = {
  userId: string;
  displayName: string;
  avatarId: string;
};

export type ThemeMode = 'light' | 'dark';

export type ServerEvent =
  | { type: 'welcome'; message: string; botId?: string }
  | { type: 'authenticated'; user: UserProfile }
  | { type: 'joined'; role: ChatRole; peer: ChatRole; roomId?: string; user?: UserProfile }
  | { type: 'rooms'; rooms: ChatRoom[] }
  | { type: 'room_joined'; room: ChatRoom; members: RoomMember[] }
  | { type: 'room_left' }
  | { type: 'presence'; online?: Presence; roomId?: string; members?: RoomMember[] }
  | {
      type: 'message';
      id: string;
      from: string;
      fromName?: string;
      avatarId?: string;
      text: string;
      time: string;
      roomId?: string;
      mediaUri?: string | null;
      status?: ReceiptStatus;
    }
  | {
      type: 'typing';
      roomId: string;
      userId: string;
      displayName: string;
      isTyping: boolean;
    }
  | {
      type: 'receipt';
      roomId: string;
      messageId: string;
      status: 'delivered' | 'read';
      by: string;
    }
  | { type: 'error'; message: string };
