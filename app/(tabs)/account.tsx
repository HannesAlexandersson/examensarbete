import { Text, TouchableOpacity, View, Image } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import React, { useEffect, useState } from 'react';
import Entypo from '@expo/vector-icons/Entypo';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { router } from 'expo-router';


export default function AccountScreen() {
  const { user, signOut, userAge, userAvatar } = useAuth();
  
  const handleQuestions = () => {
    alert('Välj en vårdkontakt för att ställa en fråga');
    router.push('/people');
  }

  const handleEditAccount = () => {
    router.push('/edit');
  }
  return (
    <View className="flex-1 items-center justify-start gap-4 bg-white">
      <View className='flex flex-row justify-between items-center w-full px-5 pt-12 pb-3 bg-slate-100'>
        <View className='w-1/2 flex flex-col items-center justify-start'>
          <Text className="font-normal font-roboto text-[22px] text-black" >{user?.first_name} {userAge && (<>, {userAge}år</>)}</Text>
          <Text className="font-normal font-roboto text-[16px] text-black" >{user?.description}</Text>
        </View>
        <View className='w-1/2 flex flex-col gap-2 items-center justify-center'>
          {userAvatar && (
            <View className='flex items-center justify-center'>
              <Image 
                source={{ uri: userAvatar }}
                className="w-16 h-20 rounded-full"
              />
            </View>
          )}
          {!userAvatar && (
            <View className='flex items-center justify-center'>
              <Image 
                source={require('@/assets/images/default_avatar.png')}
                className="w-16 h-20 rounded-full"
              />            
            </View>
          )}
          <TouchableOpacity className='flex flex-row gap-1 items-center justify-center border border-black rounded p-1' onPress={handleEditAccount}>
            <Text className="font-normal font-roboto text-[14px] text-black" >Ändra</Text>
            <Entypo name="pencil" size={14} color="black" />
          </TouchableOpacity>
        </View>
      </View>
      <View className='flex flex-col gap-2 items-center justify-center w-full px-12 bg-white'>
        <TouchableOpacity className='bg-white border border-gray-400 w-full  rounded-lg px-4 py-2 items-center' onPress={() => router.push('/diary')}>
          <Ionicons name="book-outline" size={24} color="black" />
          <Text className='text-black font-normal font-roboto text-xl text-center'>Min dagbok</Text>
        </TouchableOpacity>
          <TouchableOpacity className='bg-white border border-gray-400 w-full  rounded-lg px-4 py-2 items-center' onPress={handleQuestions}>
          <MaterialCommunityIcons name="chat-question-outline" size={24} color="black" />
        <Text className='text-black font-normal font-roboto text-xl text-center'>Mina frågor</Text>
        </TouchableOpacity>
        
      </View>
      <TouchableOpacity className='bg-black rounded-lg px-4 py-2' onPress={signOut}>
        <Text className='text-white font-bold text-3xl'>Logga ut</Text>
      </TouchableOpacity>
    </View>
  );
}