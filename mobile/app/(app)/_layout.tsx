import { Tabs, Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { useAuth } from '../../src/auth/AuthContext';
import { OfflineCaptureProvider } from '../../src/offline/OfflineCaptureContext';
import { useRegisterPushNotifications } from '../../src/push/notifications';
import { colors } from '../../src/theme';

type TabIconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: TabIconName, activeName: TabIconName = name) {
  return ({ color, size, focused }: { color: string; size: number; focused: boolean }) => (
    <Ionicons name={focused ? activeName : name} color={color} size={size} />
  );
}

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
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
        tabBarStyle: {
          height: 64,
          paddingTop: 6,
          paddingBottom: 7,
          backgroundColor: colors.white,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Today's Brief",
          tabBarLabel: 'Home',
          headerShown: false,
          tabBarIcon: tabIcon('home-outline', 'home'),
        }}
      />
      <Tabs.Screen
        name="capture"
        options={{
          title: 'Capture',
          tabBarLabel: 'Capture',
          tabBarIcon: tabIcon('add-circle-outline', 'add-circle'),
        }}
      />
      <Tabs.Screen
        name="workspace"
        options={{
          title: 'Inbox',
          tabBarLabel: 'Inbox',
          tabBarIcon: tabIcon('file-tray-outline', 'file-tray'),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarLabel: 'More',
          tabBarIcon: tabIcon('menu-outline', 'menu'),
        }}
      />
    </Tabs>
    </OfflineCaptureProvider>
  );
}
