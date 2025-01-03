import { router, Tabs } from 'expo-router';
import React from 'react';
import { View, ImageBackground } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useAuth } from '@/providers/AuthProvider';

export default function TabLayout() {
  const { user } = useAuth();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#000',
        headerShown: true,
        headerTitleAlign: 'center',
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
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Hem',          
          tabBarIcon: ({ focused }) => <Ionicons name={focused ? "home-sharp" : "home-outline"} size={24} color="black" />   
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Konto',          
          tabBarIcon: ({ focused }) => <Ionicons name={focused ? "settings" : "settings-outline"} size={24} color="black" />   
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: '',   
          headerTitle: `Min dagbok`,          
          tabBarIcon: () => 
          <View className="absolute">
            <Ionicons name="add-circle" size={75} color="#005b89" />   
          </View>
        }}        
      />
      <Tabs.Screen
        name="people"
        options={{
          title: 'Vården',      
          tabBarIcon: ({ focused }) => <Ionicons name={focused ? "medkit" : "medkit-outline"} size={24} color="black" />   
        }}
      />
       <Tabs.Screen
        name="empty"
        options={{
          title: 'Kamera',      
          tabBarIcon: ({ focused }) => <Ionicons name={focused ? "camera-sharp" : "camera-outline"} size={24} color="black" />   
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/camera');
          },
        }}
      />
    </Tabs>
  );
}
