import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatHeader } from '../components/ChatHeader';
import { MessageInput } from '../components/MessageInput';
import { MessageList } from '../components/MessageList';
import { PerfHud } from '../components/PerfHud';
import { StressControls } from '../components/StressControls';
import { useChat } from '../hooks/useChat';
import { useAppSelector } from '../store/hooks';
import { getColors, spacing } from '../theme';
import type { ChatRole, UserProfile } from '../types';
import { pickChatImage } from '../utils/media';

type ChatScreenProps = {
  profile: UserProfile;
  roomId: string;
  roomName: string;
  legacyRole?: ChatRole | null;
  onBack: () => void;
  onOpenSettings: () => void;
};

export function ChatScreen({
  profile,
  roomId,
  roomName,
  legacyRole = null,
  onBack,
  onOpenSettings,
}: ChatScreenProps) {
  const { sendMessage, notifyTyping, reconnect, clearError, startStress, stopStress } = useChat({
    profile,
    roomId,
    legacyRole,
  });

  const status = useAppSelector((state) => state.session.status);
  const roomMembers = useAppSelector((state) => state.session.roomMembers);
  const typingUsers = useAppSelector((state) => state.session.typingUsers);
  const error = useAppSelector((state) => state.session.error);
  const theme = useAppSelector((state) => state.session.theme);
  const colors = getColors(theme);

  const others = roomMembers.filter((m) => m.userId !== profile.userId);
  const onlineCount = others.filter((m) => m.online).length;
  const typingNames = Object.values(typingUsers);
  const subtitle = typingNames.length
    ? `${typingNames.join(', ')} typing…`
    : others.length
      ? `${onlineCount}/${others.length} online`
      : status === 'joined'
        ? 'Connected'
        : status;

  const headerAvatar =
    others.find((m) => m.userId === 'bot')?.avatarId ||
    others[0]?.avatarId ||
    (legacyRole === 'gaitonde' ? '2' : legacyRole === 'bunty' ? '1' : profile.avatarId);

  const canSend = status === 'joined' || roomId === 'bot-lounge' || roomId.startsWith('local-');

  const onAttach = async () => {
    const uri = await pickChatImage();
    if (uri) {
      sendMessage('', uri);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
      <ChatHeader
        title={roomName}
        subtitle={subtitle}
        avatarId={headerAvatar}
        onBack={onBack}
        onOpenSettings={onOpenSettings}
      />

      <View style={[styles.banner, { backgroundColor: colors.headerDark }]}>
        <Text style={styles.bannerText}>
          {profile.displayName} · {roomName} · {status}
        </Text>
        {(status === 'disconnected' || status === 'error') && (
          <Pressable onPress={reconnect}>
            <Text style={[styles.reconnect, { color: colors.online }]}>Reconnect</Text>
          </Pressable>
        )}
      </View>

      <PerfHud />
      <StressControls onStart={startStress} onStop={stopStress} />

      {error ? (
        <Pressable style={styles.errorBox} onPress={clearError}>
          <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          <Text style={[styles.errorHint, { color: colors.textMuted }]}>Tap to dismiss</Text>
        </Pressable>
      ) : null}

      <MessageList selfId={profile.userId} />

      <SafeAreaView edges={['bottom']} style={{ backgroundColor: colors.backgroundTint }}>
        <MessageInput
          disabled={!canSend}
          onSend={sendMessage}
          onTyping={notifyTyping}
          onAttach={onAttach}
        />
      </SafeAreaView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  banner: {
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
    fontWeight: '700',
    fontSize: 12,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    padding: spacing.md,
  },
  errorText: { fontSize: 13 },
  errorHint: { fontSize: 11, marginTop: 4 },
});
