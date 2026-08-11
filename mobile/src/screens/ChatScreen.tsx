import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatHeader } from '../components/ChatHeader';
import { MessageInput } from '../components/MessageInput';
import { MessageList } from '../components/MessageList';
import { PerfHud } from '../components/PerfHud';
import { StressControls } from '../components/StressControls';
import { ROLE_META } from '../config';
import { useChat } from '../hooks/useChat';
import { useAppSelector } from '../store/hooks';
import type { ChatRole } from '../types';
import { colors, spacing } from '../theme';

type ChatScreenProps = {
  role: ChatRole;
  onBack: () => void;
};

const AVATARS = {
  gaitonde: require('../../assets/avatars/1.png'),
  bunty: require('../../assets/avatars/2.png'),
};

export function ChatScreen({ role, onBack }: ChatScreenProps) {
  const peerRole = role === 'gaitonde' ? 'bunty' : 'gaitonde';
  const peerMeta = ROLE_META[peerRole];
  const { sendMessage, reconnect, clearError, startStress, stopStress } = useChat(role);

  const status = useAppSelector((state) => state.session.status);
  const presence = useAppSelector((state) => state.session.presence);
  const error = useAppSelector((state) => state.session.error);

  const peerOnline = presence[peerRole];
  const canSend = status === 'joined';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ChatHeader
        name={peerMeta.displayName}
        online={peerOnline}
        avatar={AVATARS[peerRole]}
        onBack={onBack}
      />

      <View style={styles.banner}>
        <Text style={styles.bannerText}>
          You are {ROLE_META[role].displayName} ·{' '}
          {status === 'joined'
            ? peerOnline
              ? 'peer online'
              : 'waiting for peer'
            : status}
        </Text>
        {(status === 'disconnected' || status === 'error') && (
          <Pressable onPress={reconnect}>
            <Text style={styles.reconnect}>Reconnect</Text>
          </Pressable>
        )}
      </View>

      <PerfHud />
      <StressControls onStart={startStress} onStop={stopStress} />

      {error ? (
        <Pressable style={styles.errorBox} onPress={clearError}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>Tap to dismiss</Text>
        </Pressable>
      ) : null}

      <MessageList selfRole={role} />

      <SafeAreaView edges={['bottom']} style={styles.inputSafe}>
        <MessageInput disabled={!canSend} onSend={sendMessage} />
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  banner: {
    backgroundColor: colors.headerDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bannerText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    flex: 1,
  },
  reconnect: {
    color: colors.online,
    fontWeight: '700',
    fontSize: 12,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#FECACA',
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
  },
  errorHint: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 4,
  },
  inputSafe: {
    backgroundColor: colors.backgroundTint,
  },
});
