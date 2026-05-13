import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import FlashMessage from 'react-native-flash-message';
import { useAuthStore } from '../src/store/authStore';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../src/utils/theme';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function AuthGuard() {
  const { user, isLoading, loadFromStorage } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/feed');
    }
  }, [user, isLoading, segments]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  return null;
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" backgroundColor={Colors.bg} />
      <AuthGuard />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="content/[id]" options={{ presentation: 'card', headerShown: true, headerStyle: { backgroundColor: Colors.surface }, headerTintColor: Colors.textPrimary }} />
        <Stack.Screen name="leaderboard" options={{ presentation: 'card', headerShown: true, title: 'Section Leaderboard', headerStyle: { backgroundColor: Colors.surface }, headerTintColor: Colors.textPrimary }} />
        <Stack.Screen name="feedback" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="support" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="about" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="regulations" options={{ presentation: 'card', headerShown: false }} />
        <Stack.Screen name="create-content" options={{ presentation: 'card', headerShown: false }} />
      </Stack>
      <FlashMessage position="top" />
    </QueryClientProvider>
  );
}
