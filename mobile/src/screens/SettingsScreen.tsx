import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearMessages, replaceMessages } from '../store/messagesSlice';
import {
  setBotEnabled,
  setNotificationsEnabled,
  setProfile,
  setTheme,
} from '../store/sessionSlice';
import { getColors, spacing } from '../theme';
import { exportBackupFile, importBackupFromPicker } from '../utils/backup';
import { ensureNotificationPermission } from '../utils/notifications';
import {
  createBackup,
  loadRoomMessages,
  restoreBackup,
  saveSettings,
  saveTheme,
} from '../utils/persistence';

type SettingsScreenProps = {
  onBack: () => void;
};

export function SettingsScreen({ onBack }: SettingsScreenProps) {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.session.theme);
  const botEnabled = useAppSelector((state) => state.session.botEnabled);
  const notificationsEnabled = useAppSelector((state) => state.session.notificationsEnabled);
  const activeRoomId = useAppSelector((state) => state.session.activeRoomId);
  const colors = getColors(theme);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const toggleTheme = async (value: boolean) => {
    const next = value ? 'dark' : 'light';
    dispatch(setTheme(next));
    await saveTheme(next);
  };

  const toggleBot = async (value: boolean) => {
    dispatch(setBotEnabled(value));
    await saveSettings({ botEnabled: value, notificationsEnabled });
  };

  const toggleNotifications = async (value: boolean) => {
    if (value) {
      const ok = await ensureNotificationPermission();
      if (!ok) {
        setStatus('Notification permission denied');
        return;
      }
    }
    dispatch(setNotificationsEnabled(value));
    await saveSettings({ botEnabled, notificationsEnabled: value });
  };

  const onBackup = async () => {
    try {
      setBusy(true);
      const backup = await createBackup();
      const result = await exportBackupFile(backup);
      setStatus(`Backup exported: ${result.filename}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Backup failed');
    } finally {
      setBusy(false);
    }
  };

  const onRestore = async () => {
    try {
      setBusy(true);
      const payload = await importBackupFromPicker();
      await restoreBackup(payload);
      if (payload.profile) dispatch(setProfile(payload.profile));
      if (payload.theme) dispatch(setTheme(payload.theme));
      if (payload.settings) {
        dispatch(setBotEnabled(payload.settings.botEnabled));
        dispatch(setNotificationsEnabled(payload.settings.notificationsEnabled));
      }
      if (activeRoomId && payload.rooms?.[activeRoomId]) {
        dispatch(replaceMessages(payload.rooms[activeRoomId]));
      } else if (activeRoomId) {
        const cached = await loadRoomMessages(activeRoomId);
        dispatch(replaceMessages(cached));
      }
      setStatus('Backup restored');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Restore failed');
    } finally {
      setBusy(false);
    }
  };

  const onClear = () => {
    if (Platform.OS !== 'web') {
      // Native confirm is optional; keep one-tap clear for web/dev.
    }
    dispatch(clearMessages());
    setStatus('Messages cleared');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.header }]}>
        <Pressable onPress={onBack}>
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.body}>
        <View style={[styles.row, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>Dark mode</Text>
          <Switch value={theme === 'dark'} onValueChange={toggleTheme} />
        </View>

        <View style={[styles.row, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>Chat bot</Text>
          <Switch value={botEnabled} onValueChange={toggleBot} />
        </View>

        <View style={[styles.row, { backgroundColor: colors.card }]}>
          <Text style={[styles.label, { color: colors.text }]}>Notifications</Text>
          <Switch value={notificationsEnabled} onValueChange={toggleNotifications} />
        </View>

        <Pressable
          style={[styles.button, { backgroundColor: colors.header }]}
          onPress={onBackup}
          disabled={busy}
        >
          <Text style={styles.buttonText}>Backup chat</Text>
        </Pressable>
        <Pressable
          style={[styles.button, { backgroundColor: colors.headerDark }]}
          onPress={onRestore}
          disabled={busy}
        >
          <Text style={styles.buttonText}>Restore backup</Text>
        </Pressable>
        <Pressable
          style={[styles.button, { backgroundColor: colors.danger }]}
          onPress={onClear}
          disabled={busy}
        >
          <Text style={styles.buttonText}>Clear current messages</Text>
        </Pressable>

        {status ? <Text style={{ color: colors.textMuted, marginTop: spacing.md }}>{status}</Text> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  back: { color: '#fff', fontWeight: '700' },
  title: { color: '#fff', fontSize: 18, fontWeight: '800' },
  body: { padding: spacing.lg, gap: spacing.sm },
  row: {
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { fontSize: 16, fontWeight: '600' },
  button: {
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: { color: '#fff', fontWeight: '700' },
});
