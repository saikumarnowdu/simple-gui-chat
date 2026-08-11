import { memo, useCallback, useEffect, useRef } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useAppSelector } from '../store/hooks';
import type { ChatMessage, ChatRole } from '../types';
import { colors, spacing } from '../theme';
import { MessageBubble } from './MessageBubble';

type MessageListProps = {
  selfRole: ChatRole;
};

const ESTIMATED_ROW_HEIGHT = 64;

function MessageListComponent({ selfRole }: MessageListProps) {
  const messages = useAppSelector((state) => state.messages.items);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const stickToBottomRef = useRef(true);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!stickToBottomRef.current || messages.length === 0) {
      return;
    }
    if (scrollTimerRef.current) {
      return;
    }
    scrollTimerRef.current = setTimeout(() => {
      scrollTimerRef.current = null;
      if (stickToBottomRef.current) {
        listRef.current?.scrollToEnd({ animated: false });
      }
    }, 50);
  }, [messages.length]);

  useEffect(
    () => () => {
      if (scrollTimerRef.current) {
        clearTimeout(scrollTimerRef.current);
      }
    },
    [],
  );

  const renderItem = useCallback<ListRenderItem<ChatMessage>>(
    ({ item }) => <MessageBubble message={item} selfRole={selfRole} />,
    [selfRole],
  );

  const keyExtractor = useCallback((item: ChatMessage) => item.id, []);

  const getItemLayout = useCallback(
    (_data: ArrayLike<ChatMessage> | null | undefined, index: number) => ({
      length: ESTIMATED_ROW_HEIGHT,
      offset: ESTIMATED_ROW_HEIGHT * index,
      index,
    }),
    [],
  );

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const distanceFromBottom =
      contentSize.height - layoutMeasurement.height - contentOffset.y;
    stickToBottomRef.current = distanceFromBottom < 96;
  }, []);

  return (
    <FlatList
      ref={listRef}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      data={messages}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      getItemLayout={getItemLayout}
      onScroll={onScroll}
      scrollEventThrottle={32}
      initialNumToRender={16}
      maxToRenderPerBatch={12}
      updateCellsBatchingPeriod={50}
      windowSize={7}
      removeClippedSubviews
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No messages yet</Text>
          <Text style={styles.emptyBody}>
            Send a message, open the peer role, or run a stress test (200–500 msg/s).
          </Text>
        </View>
      }
    />
  );
}

export const MessageList = memo(MessageListComponent);

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: spacing.sm,
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
});
