import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppSelector } from '../store/hooks';
import { getColors, spacing } from '../theme';

type MessageInputProps = {
  disabled?: boolean;
  onSend: (text: string) => boolean;
  onTyping?: () => void;
  onAttach?: () => void;
};

export function MessageInput({ disabled, onSend, onTyping, onAttach }: MessageInputProps) {
  const [text, setText] = useState('');
  const theme = useAppSelector((state) => state.session.theme);
  const colors = getColors(theme);

  const handleSend = () => {
    if (disabled || !text.trim()) return;
    const ok = onSend(text);
    if (ok) setText('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.backgroundTint, borderTopColor: colors.border }]}>
      {onAttach ? (
        <Pressable style={[styles.attach, { backgroundColor: colors.card }]} onPress={onAttach}>
          <Text style={{ color: colors.header, fontWeight: '700' }}>+</Text>
        </Pressable>
      ) : null}
      <TextInput
        style={[
          styles.input,
          { backgroundColor: colors.inputBackground, color: colors.text },
        ]}
        value={text}
        onChangeText={(value) => {
          setText(value);
          onTyping?.();
        }}
        placeholder="Type a message"
        placeholderTextColor={colors.textMuted}
        editable={!disabled}
        multiline
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
      />
      <Pressable
        style={[
          styles.sendButton,
          { backgroundColor: colors.header },
          (disabled || !text.trim()) && styles.sendButtonDisabled,
        ]}
        onPress={handleSend}
        disabled={disabled || !text.trim()}
      >
        <Text style={styles.sendLabel}>Send</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  attach: {
    width: 44,
    height: 44,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  sendButton: {
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
