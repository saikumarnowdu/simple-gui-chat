import { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { clearMessages } from '../store/messagesSlice';
import { setStressTargetRate } from '../store/sessionSlice';
import { getColors, spacing } from '../theme';

type StressControlsProps = {
  onStart: (rate: number) => void;
  onStop: () => void;
};

const RATES = [200, 300, 500] as const;

function StressControlsComponent({ onStart, onStop }: StressControlsProps) {
  const dispatch = useAppDispatch();
  const stressRunning = useAppSelector((state) => state.session.stressRunning);
  const targetRate = useAppSelector((state) => state.session.stressTargetRate);
  const theme = useAppSelector((state) => state.session.theme);
  const colors = getColors(theme);

  return (
    <View style={[styles.container, { backgroundColor: colors.headerDark }]}>
      <Text style={styles.label}>Stress</Text>
      {RATES.map((rate) => (
        <Pressable
          key={rate}
          style={[
            styles.chip,
            { backgroundColor: 'rgba(255,255,255,0.12)' },
            targetRate === rate && { backgroundColor: colors.bubble },
          ]}
          onPress={() => {
            dispatch(setStressTargetRate(rate));
            onStart(rate);
          }}
        >
          <Text style={styles.chipText}>{rate}/s</Text>
        </Pressable>
      ))}
      <Pressable
        style={[
          styles.chip,
          { backgroundColor: stressRunning ? colors.danger : 'rgba(255,255,255,0.2)' },
        ]}
        onPress={stressRunning ? onStop : () => dispatch(clearMessages())}
      >
        <Text style={styles.chipText}>{stressRunning ? 'Stop' : 'Clear'}</Text>
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
  },
  chipText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});
