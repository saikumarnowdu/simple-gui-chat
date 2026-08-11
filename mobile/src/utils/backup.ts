import { Platform } from 'react-native';
import type { BackupPayload } from './persistence';

/**
 * Export backup JSON via web download or native share sheet.
 */
export async function exportBackupFile(backup: BackupPayload) {
  const json = JSON.stringify(backup, null, 2);
  const filename = `simple-gui-chat-backup-${Date.now()}.json`;

  if (Platform.OS === 'web') {
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
    return { ok: true as const, filename };
  }

  const FileSystem = await import('expo-file-system/legacy');
  const Sharing = await import('expo-sharing');
  const path = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(path, json);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, {
      mimeType: 'application/json',
      dialogTitle: 'Export chat backup',
    });
  }
  return { ok: true as const, filename, path };
}

export async function importBackupFromPicker(): Promise<BackupPayload> {
  if (Platform.OS === 'web') {
    const file = await new Promise<File>((resolve, reject) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';
      input.onchange = () => {
        const chosen = input.files?.[0];
        if (!chosen) reject(new Error('No file selected'));
        else resolve(chosen);
      };
      input.click();
    });
    const text = await file.text();
    return JSON.parse(text) as BackupPayload;
  }

  const DocumentPicker = await import('expo-document-picker');
  const FileSystem = await import('expo-file-system/legacy');
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.[0]?.uri) {
    throw new Error('Restore cancelled');
  }
  const text = await FileSystem.readAsStringAsync(result.assets[0].uri);
  return JSON.parse(text) as BackupPayload;
}
