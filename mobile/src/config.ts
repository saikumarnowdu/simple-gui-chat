import { Platform } from 'react-native';

const host =
  process.env.EXPO_PUBLIC_CHAT_HOST ||
  (Platform.OS === 'android' ? '10.0.2.2' : 'localhost');

const port = process.env.EXPO_PUBLIC_CHAT_PORT || '6001';

export const CHAT_WS_URL = `ws://${host}:${port}`;

export const ROLE_META = {
  gaitonde: {
    id: 'gaitonde' as const,
    displayName: 'Gaitonde',
    peerName: 'Bunty',
    subtitle: 'Classic server role',
  },
  bunty: {
    id: 'bunty' as const,
    displayName: 'Bunty',
    peerName: 'Gaitonde',
    subtitle: 'Classic client role',
  },
};

export const DEFAULT_ROOMS = [
  { id: 'classic', name: 'Classic Duo', memberCount: 0 },
  { id: 'general', name: 'General', memberCount: 0 },
  { id: 'bot-lounge', name: 'Bot Lounge', memberCount: 1 },
];
