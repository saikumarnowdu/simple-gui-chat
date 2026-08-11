import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ConnectionStatus } from './types';
import type { ChatRoom, Presence, RoomMember, ThemeMode, UserProfile } from '../types';

export type SessionState = {
  status: ConnectionStatus;
  presence: Presence;
  error: string | null;
  ingestPerSecond: number;
  flushesPerSecond: number;
  stressRunning: boolean;
  stressTargetRate: number;
  profile: UserProfile | null;
  theme: ThemeMode;
  rooms: ChatRoom[];
  activeRoomId: string | null;
  roomMembers: RoomMember[];
  typingUsers: Record<string, string>;
  botEnabled: boolean;
  notificationsEnabled: boolean;
};

const initialState: SessionState = {
  status: 'disconnected',
  presence: { gaitonde: false, bunty: false },
  error: null,
  ingestPerSecond: 0,
  flushesPerSecond: 0,
  stressRunning: false,
  stressTargetRate: 300,
  profile: null,
  theme: 'light',
  rooms: [],
  activeRoomId: null,
  roomMembers: [],
  typingUsers: {},
  botEnabled: true,
  notificationsEnabled: true,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setStatus(state, action: PayloadAction<ConnectionStatus>) {
      state.status = action.payload;
    },
    setPresence(state, action: PayloadAction<Presence>) {
      state.presence = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
      if (action.payload) {
        state.status = 'error';
      }
    },
    setPerfStats(
      state,
      action: PayloadAction<{ ingestPerSecond: number; flushesPerSecond: number }>,
    ) {
      state.ingestPerSecond = action.payload.ingestPerSecond;
      state.flushesPerSecond = action.payload.flushesPerSecond;
    },
    setStressRunning(state, action: PayloadAction<boolean>) {
      state.stressRunning = action.payload;
    },
    setStressTargetRate(state, action: PayloadAction<number>) {
      state.stressTargetRate = action.payload;
    },
    setProfile(state, action: PayloadAction<UserProfile | null>) {
      state.profile = action.payload;
    },
    setTheme(state, action: PayloadAction<ThemeMode>) {
      state.theme = action.payload;
    },
    setRooms(state, action: PayloadAction<ChatRoom[]>) {
      state.rooms = action.payload;
    },
    setActiveRoomId(state, action: PayloadAction<string | null>) {
      state.activeRoomId = action.payload;
      state.typingUsers = {};
    },
    setRoomMembers(state, action: PayloadAction<RoomMember[]>) {
      state.roomMembers = action.payload;
      const online = {
        gaitonde: action.payload.some((m) => m.userId === 'gaitonde' && m.online),
        bunty: action.payload.some((m) => m.userId === 'bunty' && m.online),
      };
      state.presence = online;
    },
    setTypingUser(
      state,
      action: PayloadAction<{ userId: string; displayName: string; isTyping: boolean }>,
    ) {
      if (action.payload.isTyping) {
        state.typingUsers[action.payload.userId] = action.payload.displayName;
      } else {
        delete state.typingUsers[action.payload.userId];
      }
    },
    setBotEnabled(state, action: PayloadAction<boolean>) {
      state.botEnabled = action.payload;
    },
    setNotificationsEnabled(state, action: PayloadAction<boolean>) {
      state.notificationsEnabled = action.payload;
    },
    resetSession(state) {
      return {
        ...initialState,
        profile: state.profile,
        theme: state.theme,
        botEnabled: state.botEnabled,
        notificationsEnabled: state.notificationsEnabled,
      };
    },
  },
});

export const {
  setStatus,
  setPresence,
  setError,
  setPerfStats,
  setStressRunning,
  setStressTargetRate,
  setProfile,
  setTheme,
  setRooms,
  setActiveRoomId,
  setRoomMembers,
  setTypingUser,
  setBotEnabled,
  setNotificationsEnabled,
  resetSession,
} = sessionSlice.actions;
export const sessionReducer = sessionSlice.reducer;
