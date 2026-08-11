import { StyleSheet, Text, View } from 'react-native';
import type { ChatMessage, ChatRole } from '../types';
import { colors, spacing } from '../theme';

type MessageBubbleProps = {
  message: ChatMessage;
  selfRole: ChatRole;
};

export function MessageBubble({ message, selfRole }: MessageBubbleProps) {
  const isMine = message.from === selfRole;

  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={styles.text}>{message.text}</Text>
        <Text style={[styles.time, isMine ? styles.timeMine : styles.timeTheirs]}>
          {message.time}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
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
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
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
    fontSize: 16,
    lineHeight: 22,
  },
  time: {
    marginTop: spacing.xs,
    fontSize: 11,
    alignSelf: 'flex-end',
  },
  timeMine: {
    color: 'rgba(17, 27, 33, 0.65)',
  },
  timeTheirs: {
    color: colors.textMuted,
  },
});
