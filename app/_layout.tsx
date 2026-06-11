import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/store/auth';
import { useSocketStore } from '../src/store/socket';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '../src/theme';

export default function RootLayout() {
  const { hydrate, isHydrated, user } = useAuthStore();

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (user) {
      useSocketStore.getState().connect();
    } else {
      useSocketStore.getState().disconnect();
    }
  }, [user]);

  if (!isHydrated) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        {!user ? (
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        ) : (
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        )}
        <Stack.Screen name="product/[slug]" options={{ headerShown: false }} />
        <Stack.Screen name="checkout/index" options={{ headerShown: false }} />
        <Stack.Screen name="orders/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="wishlist/index" options={{ headerShown: false }} />
        <Stack.Screen name="review/index" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="change-password/index" options={{ headerShown: false }} />
        <Stack.Screen name="address/index" options={{ headerShown: false, presentation: 'modal' }} />
      </Stack>
    </>
  );
}
