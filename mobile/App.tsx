import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ChatScreen } from './src/screens/ChatScreen';
import { RoleSelectScreen } from './src/screens/RoleSelectScreen';
import type { ChatRole } from './src/types';

export default function App() {
  const [role, setRole] = useState<ChatRole | null>(null);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {role ? (
        <ChatScreen role={role} onBack={() => setRole(null)} />
      ) : (
        <RoleSelectScreen onSelect={setRole} />
      )}
    </SafeAreaProvider>
  );
}
