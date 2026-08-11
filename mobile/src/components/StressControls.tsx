import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearMessages } from '../store/messagesSlice';
import { setStressTargetRate } from '../store/sessionSlice';
import { colors, spacing } from '../theme';

type StressControlsProps = {
  onStart: (rate: number) => void;
  onStop: () => void;
};

const RATES = [200, 300, 500] as const;

function StressControlsComponent({ onStart, onStop }: StressControlsProps) {
  const dispatch = useAppDispatch();
  const stressRunning = useAppSelector((state) => state.session.stressRunning);
  const targetRate = useAppSelector((state) => state.session.stressTargetRate);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Stress</Text>
      {RATES.map((rate) => (
        <Pressable
          key={rate}
          style={[styles.chip, targetRate === rate && styles.chipActive]}
          onPress={() => {
            dispatch(setStressTargetRate(rate));
            onStart(rate);
          }}
        >
          <Text style={[styles.chipText, targetRate === rate && styles.chipTextActive]}>
            {rate}/s
          </Text>
        </Pressable>
      ))}
      <Pressable
        style={[styles.chip, stressRunning ? styles.stop : styles.clear]}
        onPress={stressRunning ? onStop : () => dispatch(clearMessages())}
      >
        <Text style={styles.chipTextActive}>{stressRunning ? 'Stop' : 'Clear'}</Text>
      </Pressable>
    </View>
  );
}

export const StressControls = memo(StressControlsComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.headerDark,
  },
  label: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    marginRight: 4,
  },
  chip: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  chipActive: {
    backgroundColor: colors.bubble,
  },
  stop: {
    backgroundColor: colors.danger,
  },
  clear: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  chipText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  chipTextActive: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
});
