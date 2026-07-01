import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { registerPushToken } from '../api/client';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export type PushRegistrationState =
  | 'unsupported'
  | 'idle'
  | 'requesting'
  | 'registered'
  | 'denied'
  | 'error';

async function ensureAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Simplifi',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

export async function requestPushPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false;

  await ensureAndroidChannel();

  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  const granted = await requestPushPermissions();
  if (!granted) return null;

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}

export async function registerDevicePushToken(sessionToken: string): Promise<{
  ok: boolean;
  error?: string;
  persisted?: boolean;
}> {
  const pushToken = await getExpoPushToken();
  if (!pushToken) {
    return { ok: false, error: 'Push notifications unavailable on this device.' };
  }

  const res = await registerPushToken(sessionToken, pushToken);
  if (!res.ok) {
    return { ok: false, error: res.error ?? 'Could not register push token.' };
  }

  return { ok: true, persisted: res.persisted };
}

export function useRegisterPushNotifications(sessionToken: string | null) {
  const [state, setState] = useState<PushRegistrationState>('idle');
  const [message, setMessage] = useState('');

  const register = useCallback(async () => {
    if (!sessionToken) return;
    if (!Device.isDevice) {
      setState('unsupported');
      setMessage('Push requires a physical device (not a simulator).');
      return;
    }

    setState('requesting');
    setMessage('');
    const result = await registerDevicePushToken(sessionToken);
    if (!result.ok) {
      const denied = result.error?.toLowerCase().includes('permission');
      setState(denied ? 'denied' : 'error');
      setMessage(result.error ?? 'Registration failed.');
      return;
    }
    setState('registered');
    setMessage(result.persisted ? 'Push alerts enabled.' : 'Push token saved (dev cache).');
  }, [sessionToken]);

  useEffect(() => {
    if (sessionToken) {
      void register();
    }
  }, [sessionToken, register]);

  return { state, message, register };
}
