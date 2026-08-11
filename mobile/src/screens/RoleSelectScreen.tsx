import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ROLE_META } from '../config';
import type { ChatRole } from '../types';
import { colors, spacing } from '../theme';

type RoleSelectScreenProps = {
  onSelect: (role: ChatRole) => void;
};

const ROLES: Array<{
  role: ChatRole;
  avatar: number;
}> = [
  { role: 'gaitonde', avatar: require('../../assets/avatars/1.png') },
  { role: 'bunty', avatar: require('../../assets/avatars/2.png') },
];

export function RoleSelectScreen({ onSelect }: RoleSelectScreenProps) {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.hero}>
        <Text style={styles.brand}>Simple GUI Chat</Text>
        <Text style={styles.headline}>Pick a chat identity</Text>
        <Text style={styles.support}>
          Same two-person chat as the Java Swing app — Gaitonde on the server side, Bunty on the
          client side.
        </Text>
      </View>

      <View style={styles.list}>
        {ROLES.map(({ role, avatar }) => {
          const meta = ROLE_META[role];
          return (
            <Pressable
              key={role}
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => onSelect(role)}
            >
              <Image source={avatar} style={styles.avatar} />
              <View style={styles.copy}>
                <Text style={styles.name}>{meta.displayName}</Text>
                <Text style={styles.subtitle}>{meta.subtitle}</Text>
              </View>
              <Text style={styles.cta}>Open</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  hero: {
    backgroundColor: colors.header,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl * 1.4,
  },
  brand: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  headline: {
    color: colors.white,
    fontSize: 18,
    marginTop: spacing.md,
    fontWeight: '600',
  },
  support: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 15,
    lineHeight: 22,
    marginTop: spacing.sm,
    maxWidth: 360,
  },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  copy: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },
  cta: {
    color: colors.header,
    fontWeight: '700',
    fontSize: 14,
  },
});
