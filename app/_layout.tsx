import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const [checkingAuth, setCheckingAuth] = useState(true);
  const router = useRouter();
  const segments = useSegments(); 

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('token');

      const currentRoute = segments.join('/');
      const isOnLoginScreen = currentRoute === 'login';

      if (!token && !isOnLoginScreen) {
        router.replace('/login');
      }

      setCheckingAuth(false);
    };

    checkAuth();
  }, [segments]);

  if (!loaded || checkingAuth) {
    return <ActivityIndicator style={{ marginTop: 50 }} />;
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
