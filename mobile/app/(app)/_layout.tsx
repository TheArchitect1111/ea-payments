import { Tabs, Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../../src/auth/AuthContext';
import { OfflineCaptureProvider } from '../../src/offline/OfflineCaptureContext';
import { useRegisterPushNotifications } from '../../src/push/notifications';
import { colors } from '../../src/theme';

export default function AppLayout() {
  const { token, loading } = useAuth();
  useRegisterPushNotifications(token);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.navy }}>
        <ActivityIndicator color={colors.gold} size="large" />
      </View>
    );
  }

  if (!token) {
    return <Redirect href="/login" />;
  }

  return (
    <OfflineCaptureProvider token={token}>
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
    </OfflineCaptureProvider>
  );
}
