import React from 'react';
import { useFonts } from 'expo-font';
import { ImageBackground } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { AuthProvider } from '@/providers/AuthProvider';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  React.useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="camera" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen 
          name="onboarding" 
          options={{
            headerShown: true, 
            headerTitleAlign: 'center',
            headerBackVisible: false,
            title: 'HÄLSOKOLLEN',
            headerTitleStyle: {
              color: 'white',
              fontSize: 30,
              fontWeight: 'bold',
              fontFamily: 'Roboto',              
            },
            headerBackground: () => (
              <ImageBackground
                source={require('@/assets/images/wave.png')}
                style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
                resizeMode="cover"
              />
            ),
          }} 
        />
        <Stack.Screen name="+not-found" />
      </Stack>
    </AuthProvider>
  );
}
