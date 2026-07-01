import { Tabs, Redirect } from 'expo-router';
import { useAuth } from '../../src/auth/AuthContext';
import { useRegisterPushNotifications } from '../../src/push/notifications';
import { colors } from '../../src/theme';

export default function AppLayout() {
  const { token, loading } = useAuth();
  useRegisterPushNotifications(token);

  if (!loading && !token) {
    return <Redirect href="/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.navy },
        headerTintColor: colors.white,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.white, borderTopColor: colors.border },
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home', tabBarLabel: 'Home' }} />
      <Tabs.Screen name="capture" options={{ title: 'Capture', tabBarLabel: 'Capture' }} />
      <Tabs.Screen name="workspace" options={{ title: 'Workspace', tabBarLabel: 'Workspace' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings', tabBarLabel: 'Settings' }} />
    </Tabs>
  );
}
