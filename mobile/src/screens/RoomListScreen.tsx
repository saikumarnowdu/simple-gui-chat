import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DEFAULT_ROOMS } from '../config';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setRooms } from '../store/sessionSlice';
import { getColors, spacing } from '../theme';
import type { ChatRoom, ChatRole, UserProfile } from '../types';

type RoomListScreenProps = {
  profile: UserProfile;
  onJoinRoom: (roomId: string, legacyRole?: ChatRole) => void;
  onOpenSettings: () => void;
  onEditProfile: () => void;
};

export function RoomListScreen({
  profile,
  onJoinRoom,
  onOpenSettings,
  onEditProfile,
}: RoomListScreenProps) {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.session.theme);
  const rooms = useAppSelector((state) => state.session.rooms);
  const colors = getColors(theme);
  const [newRoomName, setNewRoomName] = useState('');

  const displayRooms: ChatRoom[] = rooms.length ? rooms : DEFAULT_ROOMS;

  const createLocalRoom = () => {
    const name = newRoomName.trim();
    if (!name) return;
    const room = {
      id: `local-${Date.now().toString(36)}`,
      name,
      memberCount: 0,
    };
    dispatch(setRooms([room, ...displayRooms]));
    setNewRoomName('');
    onJoinRoom(room.id);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={[styles.hero, { backgroundColor: colors.header }]}>
        <Text style={styles.brand}>Rooms</Text>
        <Text style={styles.headline}>Hi, {profile.displayName}</Text>
        <Text style={styles.support}>Join a room, create one, or open Classic Duo.</Text>
        <View style={styles.heroActions}>
          <Pressable onPress={onEditProfile}>
            <Text style={styles.link}>Profile</Text>
          </Pressable>
          <Pressable onPress={onOpenSettings}>
            <Text style={styles.link}>Settings</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={[styles.section, { color: colors.text }]}>Classic roles</Text>
        <View style={styles.row}>
          <Pressable
            style={[styles.chip, { backgroundColor: colors.card }]}
            onPress={() => onJoinRoom('classic', 'gaitonde')}
          >
            <Text style={{ color: colors.text, fontWeight: '700' }}>As Gaitonde</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, { backgroundColor: colors.card }]}
            onPress={() => onJoinRoom('classic', 'bunty')}
          >
            <Text style={{ color: colors.text, fontWeight: '700' }}>As Bunty</Text>
          </Pressable>
        </View>

        <Text style={[styles.section, { color: colors.text }]}>Rooms</Text>
        {displayRooms.map((room) => (
          <Pressable
            key={room.id}
            style={[styles.card, { backgroundColor: colors.card }]}
            onPress={() => onJoinRoom(room.id)}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.roomName, { color: colors.text }]}>{room.name}</Text>
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>
                {room.id === 'bot-lounge' ? 'ChatBot online' : `${room.memberCount} members`}
              </Text>
            </View>
            <Text style={{ color: colors.header, fontWeight: '700' }}>Join</Text>
          </Pressable>
        ))}

        <Text style={[styles.section, { color: colors.text }]}>Create room</Text>
        <View style={styles.createRow}>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
            ]}
            value={newRoomName}
            onChangeText={setNewRoomName}
            placeholder="Room name"
            placeholderTextColor={colors.textMuted}
          />
          <Pressable
            style={[styles.createBtn, { backgroundColor: colors.header }]}
            onPress={createLocalRoom}
          >
            <Text style={{ color: '#fff', fontWeight: '700' }}>Add</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  hero: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  brand: { color: '#fff', fontSize: 28, fontWeight: '800' },
  headline: { color: '#fff', fontSize: 18, marginTop: spacing.sm, fontWeight: '600' },
  support: { color: 'rgba(255,255,255,0.88)', marginTop: spacing.sm, lineHeight: 20 },
  heroActions: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
  link: { color: '#fff', fontWeight: '700' },
  body: { padding: spacing.lg, gap: spacing.sm },
  section: { fontWeight: '700', marginTop: spacing.md, marginBottom: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    flex: 1,
    borderRadius: 10,
    padding: spacing.md,
    alignItems: 'center',
  },
  card: {
    borderRadius: 10,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  roomName: { fontSize: 16, fontWeight: '700' },
  createRow: { flexDirection: 'row', gap: spacing.sm },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  createBtn: {
    borderRadius: 10,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
  },
});
