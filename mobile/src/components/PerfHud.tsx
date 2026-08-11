import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppSelector } from '../store/hooks';
import { MAX_MESSAGES } from '../store/messagesSlice';
import { colors, spacing } from '../theme';

/**
 * Lightweight HUD subscribed only to perf counters — does not re-render on
 * every message append beyond the 1 Hz stats tick + length changes.
 */
function PerfHudComponent() {
  const messageCount = useAppSelector((state) => state.messages.items.length);
  const totalReceived = useAppSelector((state) => state.messages.totalReceived);
  const lastBatchSize = useAppSelector((state) => state.messages.lastBatchSize);
  const ingestPerSecond = useAppSelector((state) => state.session.ingestPerSecond);
  const flushesPerSecond = useAppSelector((state) => state.session.flushesPerSecond);
  const stressRunning = useAppSelector((state) => state.session.stressRunning);

  return (
    <View style={styles.container} pointerEvents="none">
      <Text style={styles.line}>
        store {messageCount}/{MAX_MESSAGES} · total {totalReceived}
      </Text>
      <Text style={styles.line}>
        ingest {ingestPerSecond}/s · flushes {flushesPerSecond}/s · batch {lastBatchSize}
        {stressRunning ? ' · STRESS' : ''}
      </Text>
    </View>
  );
}

export const PerfHud = memo(PerfHudComponent);

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  line: {
    color: colors.white,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
});
