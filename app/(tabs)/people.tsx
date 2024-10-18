import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Typography, Button } from '@/components';
import { useAuth } from '@/providers/AuthProvider';
import { FontAwesome6, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';


export default function PeopleScreen() {
  const { user } = useAuth();
  console.log(user);
  return (   
    <View className='flex-1 flex-col gap-4 items-center justify-center w-full px-12 bg-white'>

      <Button variant='outlined' size='md' className='border-gray-400 w-full items-center' onPress={() => router.push('/medicin')}>
        <MaterialCommunityIcons name="pill" size={24} color="black" />
        <Typography variant='black' size='lg' weight='400' className='text-center' >Mina Mediciner</Typography>
      </Button>

      <Button variant='outlined' size='md' className='border-gray-400 w-full items-center' onPress={() => router.push('/departments')}>
        <FontAwesome6 name="heart-pulse" size={24} color="black" />
        <Typography variant='black' size='lg' weight='400' className='text-center' >Mina Vårdkontakter</Typography>
      </Button>

      <Button variant='outlined' size='md' className='border-gray-400 w-full items-center' onPress={() => router.push('/diagnosis')}>
        <FontAwesome5 name="book-open" size={24} color="black" />
        <Typography variant='black' size='lg' weight='400' className='text-center' >Min Diagnos</Typography>
      </Button>

      <Button variant='outlined' size='md' className='border-gray-400 w-full items-center' onPress={() => router.push('/question')}>
        <MaterialCommunityIcons name="comment-question" size={24} color="black" />
        <Typography variant='black' size='lg' weight='400' className='text-center' >Skriv en Fråga</Typography>
      </Button>

    </View>    
  );
}