import { Platform } from 'react-native';

export async function pickChatImage(): Promise<string | null> {
  const ImagePicker = await import('expo-image-picker');
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.6,
    base64: Platform.OS === 'web',
  });

  if (result.canceled || !result.assets?.[0]) {
    return null;
  }

  const asset = result.assets[0];
  if (asset.base64) {
    const mime = asset.mimeType || 'image/jpeg';
    return `data:${mime};base64,${asset.base64}`;
  }
  return asset.uri;
}
