import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { ChatMessage, ChatRole } from '../types';
import { colors, spacing } from '../theme';

type MessageBubbleProps = {
  message: ChatMessage;
  selfRole: ChatRole;
};

function MessageBubbleComponent({ message, selfRole }: MessageBubbleProps) {
  const isMine = message.from === selfRole;

  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={styles.text} numberOfLines={6}>
          {message.text}
        </Text>
        <Text style={[styles.time, isMine ? styles.timeMine : styles.timeTheirs]}>
          {message.time}
        </Text>
      </View>
    </View>
  );
}

function propsAreEqual(prev: MessageBubbleProps, next: MessageBubbleProps) {
  return (
    prev.selfRole === next.selfRole &&
    prev.message.id === next.message.id &&
    prev.message.text === next.message.text &&
    prev.message.from === next.message.from &&
    prev.message.time === next.message.time
  );
}

/** Memoized bubble — avoids re-rendering unchanged rows when batches append. */
export const MessageBubble = memo(MessageBubbleComponent, propsAreEqual);

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    // Approximate fixed row budget helps list recycling feel stable.
    minHeight: 56,
  },
  rowMine: {
    alignItems: 'flex-end',
  },
  rowTheirs: {
    alignItems: 'flex-start',
  },
  bubble: {
    maxWidth: '78%',
    borderRadius: 8,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  bubbleMine: {
    backgroundColor: colors.bubble,
  },
  bubbleTheirs: {
    backgroundColor: colors.incoming,
  },
  text: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 20,
  },
  time: {
    marginTop: 2,
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  timeMine: {
    color: 'rgba(17, 27, 33, 0.65)',
  },
  timeTheirs: {
    color: colors.textMuted,
  },
});
