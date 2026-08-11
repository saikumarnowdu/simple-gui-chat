import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, spacing } from '../theme';

type MessageInputProps = {
  disabled?: boolean;
  onSend: (text: string) => boolean;
};

export function MessageInput({ disabled, onSend }: MessageInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (disabled || !text.trim()) {
      return;
    }
    const ok = onSend(text);
    if (ok) {
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={setText}
        placeholder="Type a message"
        placeholderTextColor={colors.textMuted}
        editable={!disabled}
        multiline
        onSubmitEditing={handleSend}
        blurOnSubmit={false}
      />
      <Pressable
        style={[styles.sendButton, (disabled || !text.trim()) && styles.sendButtonDisabled]}
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
    backgroundColor: colors.backgroundTint,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    backgroundColor: colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
    color: colors.text,
  },
  sendButton: {
    backgroundColor: colors.header,
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
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
});
