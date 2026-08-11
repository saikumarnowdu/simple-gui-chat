import { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useAppSelector } from '../store/hooks';
import { getColors, spacing } from '../theme';
import type { ChatMessage } from '../types';

type MessageBubbleProps = {
  message: ChatMessage;
  selfId: string;
};

function receiptLabel(status?: string) {
  if (status === 'read') return '✓✓';
  if (status === 'delivered') return '✓✓';
  if (status === 'sent') return '✓';
  if (status === 'pending') return '·';
  return '';
}

function MessageBubbleComponent({ message, selfId }: MessageBubbleProps) {
  const theme = useAppSelector((state) => state.session.theme);
  const colors = getColors(theme);
  const isMine = message.from === selfId;
  const isBot = message.from === 'bot';

  return (
    <View style={[styles.row, isMine ? styles.rowMine : styles.rowTheirs]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isMine ? colors.bubble : colors.incoming,
          },
        ]}
      >
        {!isMine ? (
          <Text style={[styles.author, { color: isBot ? colors.header : colors.textMuted }]}>
            {message.fromName || message.from}
          </Text>
        ) : null}
        {message.mediaUri ? (
          <Image source={{ uri: message.mediaUri }} style={styles.image} />
        ) : null}
        {message.text ? (
          <Text style={[styles.text, { color: colors.text }]} numberOfLines={8}>
            {message.text}
          </Text>
        ) : null}
        <View style={styles.meta}>
          <Text style={[styles.time, { color: colors.textMuted }]}>{message.time}</Text>
          {isMine ? (
            <Text
              style={[
                styles.receipt,
                {
                  color: message.status === 'read' ? colors.receiptRead : colors.receipt,
                },
              ]}
            >
              {receiptLabel(message.status)}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function propsAreEqual(prev: MessageBubbleProps, next: MessageBubbleProps) {
  return (
    prev.selfId === next.selfId &&
    prev.message.id === next.message.id &&
    prev.message.text === next.message.text &&
    prev.message.from === next.message.from &&
    prev.message.time === next.message.time &&
    prev.message.mediaUri === next.message.mediaUri &&
    prev.message.status === next.message.status
  );
}

export const MessageBubble = memo(MessageBubbleComponent, propsAreEqual);

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.sm,
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
  author: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  image: {
    width: 180,
    height: 140,
    borderRadius: 6,
    marginBottom: 6,
  },
  text: {
    fontSize: 15,
    lineHeight: 20,
  },
  meta: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  time: {
    fontSize: 10,
  },
  receipt: {
    fontSize: 11,
    fontWeight: '700',
  },
});
