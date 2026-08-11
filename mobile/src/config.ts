import { Platform } from 'react-native';

/**
 * Android emulator reaches the host machine via 10.0.2.2.
 * iOS simulator and web use localhost. Physical devices should set EXPO_PUBLIC_CHAT_HOST.
 */
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
    subtitle: 'Server role (original Java Server.java)',
  },
  bunty: {
    id: 'bunty' as const,
    displayName: 'Bunty',
    peerName: 'Gaitonde',
    subtitle: 'Client role (original Java Client.java)',
  },
};
