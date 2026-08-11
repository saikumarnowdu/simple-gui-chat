import { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppSelector } from '../store/hooks';
import { avatarSource, getColors, spacing } from '../theme';

type ChatHeaderProps = {
  title: string;
  subtitle: string;
  avatarId?: string;
  onBack: () => void;
  onOpenSettings?: () => void;
};

function ChatHeaderComponent({
  title,
  subtitle,
  avatarId,
  onBack,
  onOpenSettings,
}: ChatHeaderProps) {
  const theme = useAppSelector((state) => state.session.theme);
  const colors = getColors(theme);

  return (
    <View style={[styles.header, { backgroundColor: colors.header }]}>
      <Pressable onPress={onBack} hitSlop={12} style={styles.backButton} accessibilityRole="button">
        <Image
          source={require('../../assets/avatars/3.png')}
          style={styles.backIcon}
          tintColor={colors.white}
        />
      </Pressable>

      <Image source={avatarSource(avatarId)} style={styles.avatar} />

      <View style={styles.identity}>
        <Text style={styles.name}>{title}</Text>
        <Text style={styles.status}>{subtitle}</Text>
      </View>

      <View style={styles.actions}>
        <Image
          source={require('../../assets/avatars/video.png')}
          style={styles.actionIcon}
          tintColor={colors.white}
        />
        <Image
          source={require('../../assets/avatars/phone.png')}
          style={styles.phoneIcon}
          tintColor={colors.white}
        />
        {onOpenSettings ? (
          <Pressable onPress={onOpenSettings} hitSlop={8}>
            <Ionicons name="settings-outline" size={18} color={colors.white} />
          </Pressable>
        ) : (
          <Ionicons name="ellipsis-vertical" size={18} color={colors.white} />
        )}
      </View>
    </View>
  );
}

export const ChatHeader = memo(ChatHeaderComponent);

const styles = StyleSheet.create({
  header: {
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
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
  },
  identity: {
    flex: 1,
  },
  name: {
    color: '#fff',
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
  },
  phoneIcon: {
    width: 26,
    height: 22,
  },
});
