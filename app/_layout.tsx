import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler'; 
import React from 'react';
import { useFonts } from 'expo-font';
import { ImageBackground, View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-reanimated';
import { AuthProvider } from '@/providers/AuthProvider';
import Toast from 'react-native-toast-message';
import { showNotification } from '@/utils/utils';


// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  
  const [loaded] = useFonts({    
    Roboto: require('../assets/fonts//Roboto/Roboto-Regular.ttf'),
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
    <GestureHandlerRootView style={{ flex: 1 }}>
    <AuthProvider>
    <Toast />
      <Stack>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="camera" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="edit" options={{ headerShown: false }} />
        <Stack.Screen name="album" options={{ 
          presentation: 'modal',
          headerShown: true,
          title: 'ALBUM',
          headerTitleAlign: 'center',
          headerBackVisible: false,
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
        <Stack.Screen name="medicin"  options={{ headerShown: false, presentation: 'modal' }}  />
        <Stack.Screen name="departments"  options={{ headerShown: false }}  />
        <Stack.Screen name="question"  options={{ headerShown: false }}  />
        <Stack.Screen name="diagnosis"  options={{ headerShown: false }}  />
        <Stack.Screen name="procedures" options={{ headerShown: false }}  />
        <Stack.Screen name="question-collection"  options={{ 
          headerShown: true,
          headerTitleAlign: 'center',
          headerBackVisible: false,
          title: 'Skickade frågor',
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
      </Stack>
    </AuthProvider>
    </GestureHandlerRootView>
  );
}
