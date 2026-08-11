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
import { getColors, spacing } from '../theme';
import type { ChatMessage } from '../types';
import { MessageBubble } from './MessageBubble';

type MessageListProps = {
  selfId: string;
};

const ESTIMATED_ROW_HEIGHT = 72;

function MessageListComponent({ selfId }: MessageListProps) {
  const messages = useAppSelector((state) => state.messages.items);
  const theme = useAppSelector((state) => state.session.theme);
  const colors = getColors(theme);
  const listRef = useRef<FlatList<ChatMessage>>(null);
  const stickToBottomRef = useRef(true);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!stickToBottomRef.current || messages.length === 0) return;
    if (scrollTimerRef.current) return;
    scrollTimerRef.current = setTimeout(() => {
      scrollTimerRef.current = null;
      if (stickToBottomRef.current) {
        listRef.current?.scrollToEnd({ animated: false });
      }
    }, 50);
  }, [messages.length]);

  useEffect(
    () => () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    },
    [],
  );

  const renderItem = useCallback<ListRenderItem<ChatMessage>>(
    ({ item }) => <MessageBubble message={item} selfId={selfId} />,
    [selfId],
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
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No messages yet</Text>
          <Text style={[styles.emptyBody, { color: colors.textMuted }]}>
            Chat, share a photo, try @bot /help, or run a stress test.
          </Text>
        </View>
      }
    />
  );
}

export const MessageList = memo(MessageListComponent);

const styles = StyleSheet.create({
  list: { flex: 1 },
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
    fontSize: 16,
    fontWeight: '700',
  },
  emptyBody: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
});
