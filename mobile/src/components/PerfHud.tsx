import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppSelector } from '../store/hooks';
import { MAX_MESSAGES } from '../store/messagesSlice';
import { getColors, spacing } from '../theme';

function PerfHudComponent() {
  const messageCount = useAppSelector((state) => state.messages.items.length);
  const totalReceived = useAppSelector((state) => state.messages.totalReceived);
  const lastBatchSize = useAppSelector((state) => state.messages.lastBatchSize);
  const ingestPerSecond = useAppSelector((state) => state.session.ingestPerSecond);
  const flushesPerSecond = useAppSelector((state) => state.session.flushesPerSecond);
  const stressRunning = useAppSelector((state) => state.session.stressRunning);
  const theme = useAppSelector((state) => state.session.theme);
  const colors = getColors(theme);

  return (
    <View style={[styles.container, { backgroundColor: 'rgba(0,0,0,0.55)' }]} pointerEvents="none">
      <Text style={[styles.line, { color: colors.white }]}>
        store {messageCount}/{MAX_MESSAGES} · total {totalReceived}
      </Text>
      <Text style={[styles.line, { color: colors.white }]}>
        ingest {ingestPerSecond}/s · flushes {flushesPerSecond}/s · batch {lastBatchSize}
        {stressRunning ? ' · STRESS' : ''}
      </Text>
    </View>
  );
}

export const PerfHud = memo(PerfHudComponent);

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  line: {
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
});
