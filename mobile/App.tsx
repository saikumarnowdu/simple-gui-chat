import { useEffect, useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthScreen } from './src/screens/AuthScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { RoomListScreen } from './src/screens/RoomListScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { store } from './src/store';
import { useAppDispatch, useAppSelector } from './src/store/hooks';
import {
  setBotEnabled,
  setNotificationsEnabled,
  setProfile,
  setTheme,
} from './src/store/sessionSlice';
import { DEFAULT_ROOMS } from './src/config';
import type { ChatRole } from './src/types';
import { loadProfile, loadSettings, loadTheme } from './src/utils/persistence';

type ChatRoute = {
  name: 'chat';
  roomId: string;
  roomName: string;
  legacyRole?: ChatRole | null;
};

type Route =
  | { name: 'boot' }
  | { name: 'auth' }
  | { name: 'rooms' }
  | { name: 'settings'; returnTo: Exclude<Route, { name: 'boot' | 'settings' }> }
  | ChatRoute;

function AppNavigator() {
  const dispatch = useAppDispatch();
  const profile = useAppSelector((state) => state.session.profile);
  const theme = useAppSelector((state) => state.session.theme);
  const rooms = useAppSelector((state) => state.session.rooms);
  const [route, setRoute] = useState<Route>({ name: 'boot' });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [savedProfile, savedTheme, settings] = await Promise.all([
        loadProfile(),
        loadTheme(),
        loadSettings(),
      ]);
      if (cancelled) return;
      if (savedProfile) dispatch(setProfile(savedProfile));
      dispatch(setTheme(savedTheme));
      dispatch(setBotEnabled(settings.botEnabled));
      dispatch(setNotificationsEnabled(settings.notificationsEnabled));
      setRoute(savedProfile ? { name: 'rooms' } : { name: 'auth' });
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch]);

  const roomNameLookup = useMemo(() => {
    const all = rooms.length ? rooms : DEFAULT_ROOMS;
    return Object.fromEntries(all.map((room) => [room.id, room.name]));
  }, [rooms]);

  if (route.name === 'boot') {
    return null;
  }

  if (route.name === 'auth' || !profile) {
    return (
      <>
        <StatusBar style="light" />
        <AuthScreen onContinue={() => setRoute({ name: 'rooms' })} />
      </>
    );
  }

  if (route.name === 'settings') {
    return (
      <>
        <StatusBar style="light" />
        <SettingsScreen onBack={() => setRoute(route.returnTo)} />
      </>
    );
  }

  if (route.name === 'chat') {
    return (
      <>
        <StatusBar style="light" />
        <ChatScreen
          profile={profile}
          roomId={route.roomId}
          roomName={route.roomName}
          legacyRole={route.legacyRole}
          onBack={() => setRoute({ name: 'rooms' })}
          onOpenSettings={() => setRoute({ name: 'settings', returnTo: route })}
        />
      </>
    );
  }

  return (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'light'} />
      <RoomListScreen
        profile={profile}
        onEditProfile={() => setRoute({ name: 'auth' })}
        onOpenSettings={() => setRoute({ name: 'settings', returnTo: { name: 'rooms' } })}
        onJoinRoom={(roomId, legacyRole) => {
          setRoute({
            name: 'chat',
            roomId,
            roomName: roomNameLookup[roomId] || roomId,
            legacyRole: legacyRole || null,
          });
        }}
      />
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <AppNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}
