import React from 'react';
import { Stack } from 'expo-router';
import { ImageBackground } from 'react-native';


export default function AuthLayout() {
  
  return (
    
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />         
        <Stack.Screen name="signup" options={{ headerShown: false, presentation: "modal" }} />
      </Stack>
    
  );
}
