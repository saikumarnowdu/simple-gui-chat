import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setProfile } from '../store/sessionSlice';
import { AVATAR_OPTIONS, getColors, spacing } from '../theme';
import type { UserProfile } from '../types';
import { saveProfile } from '../utils/persistence';

type AuthScreenProps = {
  onContinue: (profile: UserProfile) => void;
};

function makeUserId(displayName: string) {
  const slug = displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return `${slug || 'user'}-${Math.random().toString(36).slice(2, 7)}`;
}

export function AuthScreen({ onContinue }: AuthScreenProps) {
  const dispatch = useAppDispatch();
  const existing = useAppSelector((state) => state.session.profile);
  const theme = useAppSelector((state) => state.session.theme);
  const colors = getColors(theme);
  const [displayName, setDisplayName] = useState(existing?.displayName || '');
  const [avatarId, setAvatarId] = useState(existing?.avatarId || '1');

  const canContinue = useMemo(() => displayName.trim().length >= 2, [displayName]);

  const handleContinue = async () => {
    if (!canContinue) return;
    const profile: UserProfile = {
      userId: existing?.userId || makeUserId(displayName.trim()),
      displayName: displayName.trim().slice(0, 32),
      avatarId,
    };
    dispatch(setProfile(profile));
    await saveProfile(profile);
    onContinue(profile);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.hero, { backgroundColor: colors.header }]}>
        <Text style={styles.brand}>Simple GUI Chat</Text>
        <Text style={styles.headline}>Create your profile</Text>
        <Text style={styles.support}>Pick a name and avatar to join multi-user rooms.</Text>
      </View>

      <View style={styles.body}>
        <Text style={[styles.label, { color: colors.text }]}>Display name</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
          ]}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="e.g. Sai"
          placeholderTextColor={colors.textMuted}
          maxLength={32}
        />

        <Text style={[styles.label, { color: colors.text, marginTop: spacing.lg }]}>Avatar</Text>
        <View style={styles.avatars}>
          {AVATAR_OPTIONS.map((avatar) => {
            const selected = avatar.id === avatarId;
            return (
              <Pressable
                key={avatar.id}
                onPress={() => setAvatarId(avatar.id)}
                style={[
                  styles.avatarWrap,
                  selected && { borderColor: colors.header, borderWidth: 2 },
                ]}
              >
                <Image source={avatar.source} style={styles.avatar} />
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[
            styles.cta,
            { backgroundColor: colors.header },
            !canContinue && styles.ctaDisabled,
          ]}
          disabled={!canContinue}
          onPress={handleContinue}
        >
          <Text style={styles.ctaText}>Continue</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  hero: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl * 1.2,
  },
  brand: { color: '#fff', fontSize: 28, fontWeight: '800' },
  headline: { color: '#fff', fontSize: 18, marginTop: spacing.md, fontWeight: '600' },
  support: { color: 'rgba(255,255,255,0.88)', fontSize: 15, marginTop: spacing.sm, lineHeight: 22 },
  body: { padding: spacing.lg },
  label: { fontSize: 14, fontWeight: '700', marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  avatars: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  avatarWrap: {
    borderRadius: 28,
    padding: 2,
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  cta: {
    marginTop: spacing.xl,
    borderRadius: 10,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
