import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatMessage, ThemeMode, UserProfile } from '../types';

const PROFILE_KEY = 'sgc.profile';
const THEME_KEY = 'sgc.theme';
const SETTINGS_KEY = 'sgc.settings';
const messagesKey = (roomId: string) => `sgc.messages.${roomId}`;

export async function loadProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

export async function saveProfile(profile: UserProfile) {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export async function loadTheme(): Promise<ThemeMode> {
  const value = await AsyncStorage.getItem(THEME_KEY);
  return value === 'dark' ? 'dark' : 'light';
}

export async function saveTheme(theme: ThemeMode) {
  await AsyncStorage.setItem(THEME_KEY, theme);
}

export async function loadSettings(): Promise<{
  botEnabled: boolean;
  notificationsEnabled: boolean;
}> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    return { botEnabled: true, notificationsEnabled: true };
  }
  try {
    return JSON.parse(raw);
  } catch {
    return { botEnabled: true, notificationsEnabled: true };
  }
}

export async function saveSettings(settings: {
  botEnabled: boolean;
  notificationsEnabled: boolean;
}) {
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export async function loadRoomMessages(roomId: string): Promise<ChatMessage[]> {
  const raw = await AsyncStorage.getItem(messagesKey(roomId));
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function saveRoomMessages(roomId: string, messages: ChatMessage[]) {
  await AsyncStorage.setItem(messagesKey(roomId), JSON.stringify(messages.slice(-2500)));
}

export async function listPersistedRoomIds(): Promise<string[]> {
  const keys = await AsyncStorage.getAllKeys();
  return keys
    .filter((key) => key.startsWith('sgc.messages.'))
    .map((key) => key.replace('sgc.messages.', ''));
}

export type BackupPayload = {
  version: 1;
  exportedAt: string;
  profile: UserProfile | null;
  theme: ThemeMode;
  settings: { botEnabled: boolean; notificationsEnabled: boolean };
  rooms: Record<string, ChatMessage[]>;
};

export async function createBackup(): Promise<BackupPayload> {
  const [profile, theme, settings, roomIds] = await Promise.all([
    loadProfile(),
    loadTheme(),
    loadSettings(),
    listPersistedRoomIds(),
  ]);
  const rooms: Record<string, ChatMessage[]> = {};
  for (const roomId of roomIds) {
    rooms[roomId] = await loadRoomMessages(roomId);
  }
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile,
    theme,
    settings,
    rooms,
  };
}

export async function restoreBackup(payload: BackupPayload) {
  if (!payload || payload.version !== 1) {
    throw new Error('Unsupported backup format');
  }
  if (payload.profile) {
    await saveProfile(payload.profile);
  }
  if (payload.theme) {
    await saveTheme(payload.theme);
  }
  if (payload.settings) {
    await saveSettings(payload.settings);
  }
  for (const [roomId, messages] of Object.entries(payload.rooms || {})) {
    await saveRoomMessages(roomId, messages);
  }
}
