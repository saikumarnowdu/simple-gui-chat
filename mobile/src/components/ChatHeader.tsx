import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

type ChatHeaderProps = {
  name: string;
  online: boolean;
  avatar: number;
  onBack: () => void;
};

export function ChatHeader({ name, online, avatar, onBack }: ChatHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.backButton} accessibilityRole="button">
        <Image source={require('../../assets/avatars/3.png')} style={styles.backIcon} />
      </Pressable>

      <Image source={avatar} style={styles.avatar} />

      <View style={styles.identity}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.status}>{online ? 'Active Now' : 'Offline'}</Text>
      </View>

      <View style={styles.actions}>
        <Image source={require('../../assets/avatars/video.png')} style={styles.actionIcon} />
        <Image source={require('../../assets/avatars/phone.png')} style={styles.phoneIcon} />
        <Ionicons name="ellipsis-vertical" size={18} color={colors.white} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.header,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  backIcon: {
    width: 22,
    height: 22,
    tintColor: colors.white,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.headerDark,
  },
  identity: {
    flex: 1,
  },
  name: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  status: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingRight: spacing.xs,
  },
  actionIcon: {
    width: 24,
    height: 24,
    tintColor: colors.white,
  },
  phoneIcon: {
    width: 26,
    height: 22,
    tintColor: colors.white,
  },
});
