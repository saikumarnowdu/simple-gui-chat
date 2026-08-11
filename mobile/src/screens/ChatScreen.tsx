import { useEffect, useRef } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChatHeader } from '../components/ChatHeader';
import { MessageBubble } from '../components/MessageBubble';
import { MessageInput } from '../components/MessageInput';
import { ROLE_META } from '../config';
import { useChat } from '../hooks/useChat';
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
  const { status, messages, presence, error, sendMessage, reconnect, clearError } = useChat(role);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    if (messages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages.length]);

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

      {error ? (
        <Pressable style={styles.errorBox} onPress={clearError}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.errorHint}>Tap to dismiss</Text>
        </Pressable>
      ) : null}

      <FlatList
        ref={listRef}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <MessageBubble message={item} selfRole={role} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptyBody}>
              Open the other role on another device or emulator to start chatting.
            </Text>
          </View>
        }
      />

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
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: spacing.md,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: 80,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyBody: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  inputSafe: {
    backgroundColor: colors.backgroundTint,
  },
});
