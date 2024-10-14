import React, { useState } from 'react';
import { Text, View, Image, TouchableOpacity } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { router } from 'expo-router';
import { EventSource } from '@/utils/types';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import EvilIcons from '@expo/vector-icons/EvilIcons';

export default function HomeScreen() {
  const { user, userAvatar } = useAuth();
  
  const [events, setEvents] = useState<EventSource[]>([]);


  const handleDiary = () => {
    router.push('/diary');
  }

  const handleQuestion = () => {
    alert('Välj en vårdkontakt för att ställa en fråga');
    router.push('/people');
  }
  
  return (
    <View className="flex-1 items-center justify-start gap-4 bg-slate-100">
      <View className='flex flex-row justify-between items-end w-full px-5 pt-12'>
        <Text className="font-normal font-roboto text-[22px] text-black" >Hej {user?.first_name}!</Text>
        {userAvatar && (
        <View className='flex items-center justify-center'>
          <Image 
            source={{ uri: userAvatar }}
            className="w-11 h-12 rounded-full"
          />
        </View>
        )}
        {!userAvatar && (
          <View className='flex items-center justify-center'>
            <Image 
              source={require('@/assets/images/default_avatar.png')}
              className="w-11 h-12 rounded-full"
            />            
          </View>
        )}
      </View>

      <View className='flex flex-row gap-2 items-start justify-start w-full pl-4 pt-8'>
        <TouchableOpacity className='bg-white border border-black rounded-lg px-2 py-2' onPress={handleDiary}>
          <Text className='text-black font-roboto font-normal text-[14px] uppercase'>Skriv i dagboken</Text>
        </TouchableOpacity>
        <TouchableOpacity className='bg-white border border-black rounded-lg px-2 py-2' onPress={handleQuestion}>
        <Text className='text-black font-roboto font-normal text-[14px] uppercase'>Ny fråga</Text>
        </TouchableOpacity>
      </View>

      <View className='flex flex-col gap-2 items-start justify-start w-full pl-4'>
        <Text className=' text-black font-roboto font-normal text-[24px]'>Mina händelser</Text>
        {events.length > 0 ? (
          <>
        {events.map((event) => (
          <View key={event.id} className='flex flex-row gap-2 items-center justify-start w-full pl-4'>
            <Text className=' text-black font-roboto font-normal text-[14px]'>{event.date}</Text>
            <Text className=' text-black font-roboto font-normal text-[14px]'>{event.title}</Text>
            {event.type === 'diary' && (
              <Ionicons name="book-sharp" size={24} color="black" />
              )}
            {event.type === 'question' && (
              <MaterialCommunityIcons name="chat-question" size={24} color="black" />
              )}
              {event.type === 'medicin' && (
                <FontAwesome5 name="comment-medical" size={24} color="black" />
              )}
              <TouchableOpacity className='flex-1' onPress={() => alert('Visa händelse')}>
                <EvilIcons name="chevron-right" size={24} color="black" />
              </TouchableOpacity>
              <View className='h-px w-[90%] bg-black' />
          </View>
        ))}        
        </>
      ): (
        <Text className=' text-black font-roboto font-normal italic text-[14px]'>Inga händelser</Text>
      )}
      </View>
    </View>
  );
}