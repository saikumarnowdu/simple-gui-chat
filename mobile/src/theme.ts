import type { ThemeMode } from './types';

const light = {
  header: '#075E54',
  headerDark: '#054C44',
  bubble: '#25D366',
  bubbleSoft: '#DCF8C6',
  incoming: '#FFFFFF',
  background: '#ECE5DD',
  backgroundTint: '#E5DDD5',
  inputBackground: '#FFFFFF',
  text: '#111B21',
  textMuted: '#667781',
  white: '#FFFFFF',
  danger: '#E53935',
  online: '#4ADE80',
  offline: '#94A3B8',
  border: '#D1D7DB',
  card: '#FFFFFF',
  receipt: '#667781',
  receiptRead: '#53BDEB',
};

const dark = {
  header: '#1F2C34',
  headerDark: '#0B141A',
  bubble: '#005C4B',
  bubbleSoft: '#005C4B',
  incoming: '#202C33',
  background: '#0B141A',
  backgroundTint: '#1F2C34',
  inputBackground: '#2A3942',
  text: '#E9EDEF',
  textMuted: '#8696A0',
  white: '#FFFFFF',
  danger: '#EF5350',
  online: '#4ADE80',
  offline: '#8696A0',
  border: '#2A3942',
  card: '#202C33',
  receipt: '#8696A0',
  receiptRead: '#53BDEB',
};

export type ThemeColors = typeof light;

export function getColors(mode: ThemeMode): ThemeColors {
  return mode === 'dark' ? dark : light;
}

/** @deprecated Prefer getColors(mode) for dark-mode support. */
export const colors = light;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
};

export const AVATAR_OPTIONS = [
  { id: '1', label: 'Gaitonde', source: require('../assets/avatars/1.png') },
  { id: '2', label: 'Bunty', source: require('../assets/avatars/2.png') },
  { id: 'gaitonde', label: 'Gaitonde photo', source: require('../assets/avatars/gaitonde.jpeg') },
  { id: 'bunty', label: 'Bunty photo', source: require('../assets/avatars/bunty.jpeg') },
] as const;

export function avatarSource(avatarId?: string) {
  const found = AVATAR_OPTIONS.find((a) => a.id === avatarId);
  return found?.source ?? AVATAR_OPTIONS[0].source;
}
