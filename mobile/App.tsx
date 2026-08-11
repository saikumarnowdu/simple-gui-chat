import { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ChatScreen } from './src/screens/ChatScreen';
import { RoleSelectScreen } from './src/screens/RoleSelectScreen';
import { store } from './src/store';
import type { ChatRole } from './src/types';

export default function App() {
  const [role, setRole] = useState<ChatRole | null>(null);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {role ? (
          <ChatScreen role={role} onBack={() => setRole(null)} />
        ) : (
          <RoleSelectScreen onSelect={setRole} />
        )}
      </SafeAreaProvider>
    </Provider>
  );
}
