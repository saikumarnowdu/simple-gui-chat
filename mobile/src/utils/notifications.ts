import { Platform } from 'react-native';

let notificationsModule: typeof import('expo-notifications') | null = null;

async function getNotifications() {
  if (Platform.OS === 'web') {
    return null;
  }
  if (!notificationsModule) {
    notificationsModule = await import('expo-notifications');
    notificationsModule.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
  }
  return notificationsModule;
}

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    return result === 'granted';
  }

  const Notifications = await getNotifications();
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

export async function notifyNewMessage(opts: {
  enabled: boolean;
  title: string;
  body: string;
  appFocused: boolean;
}) {
  if (!opts.enabled || opts.appFocused) {
    return;
  }

  if (Platform.OS === 'web') {
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') {
      return;
    }
    new Notification(opts.title, { body: opts.body });
    return;
  }

  const Notifications = await getNotifications();
  if (!Notifications) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: opts.title,
      body: opts.body,
    },
    trigger: null,
  });
}
