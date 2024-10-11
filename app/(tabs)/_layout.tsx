import { router, Tabs } from 'expo-router';
import React from 'react';
import { View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabLayout() {
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#000',
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',      
          tabBarIcon: ({ focused }) => <Ionicons name={focused ? "home-sharp" : "home-outline"} size={24} color="black" />   
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',      
          tabBarIcon: ({ focused }) => <Ionicons name={focused ? "settings" : "settings-outline"} size={24} color="black" />   
        }}
      />
      <Tabs.Screen
        name="diary"
        options={{
          title: '',      
          tabBarIcon: () => 
          <View className="absolute">
            <Ionicons name="add-circle" size={75} color="black" />   
          </View>,
        }}
      />
      <Tabs.Screen
        name="people"
        options={{
          title: 'People',      
          tabBarIcon: ({ focused }) => <Ionicons name={focused ? "people-sharp" : "people-outline"} size={24} color="black" />   
        }}
      />
       <Tabs.Screen
        name="empty"
        options={{
          title: 'Camera',      
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
