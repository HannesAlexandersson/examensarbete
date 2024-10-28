import { View, Image, ScrollView } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import React from 'react';
import { Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Typography, Button } from '@/components';


export default function AccountScreen() {
  const { user, signOut, userAge, userAvatar } = useAuth();
  
  

  const handleEditAccount = () => {
    router.push('/edit');
  }
  return (
    <ScrollView>
      <View className="flex-1 items-center justify-start gap-4 bg-white">
        <View className='flex flex-row justify-between items-center w-full px-5 pt-8 pb-3 bg-slate-100'>
          <View className='w-1/2 flex flex-col items-start justify-center pl-4'>
            <Typography variant='black' weight='400' size='xl' className='mb-4'>{user?.first_name} {userAge && (<>, {userAge}år</>)}</Typography>          
            <Typography variant='black' weight='400' size='md' className=''>{user?.description}</Typography>
          
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
            <Button variant='outlined' size='sm' className='items-center flex-row bg-transparent' onPress={handleEditAccount}>          
              <Typography variant='black' size='sm' weight='400' className='text-center mr-1' >Ändra</Typography>
              <Entypo name="pencil" size={14} color="black" />
            </Button>
          </View>
        </View>
        <View className='flex flex-col gap-2 items-center justify-center w-full px-12 bg-white'>

          <Button variant='outlined' size='md' className='border-gray-400 w-full items-center' onPress={() => router.push('/diary')} >
            <MaterialCommunityIcons name="book-edit" size={24} color="black" />
            <Typography variant='black' size='lg' weight='400' className='text-center' >Min dagbok</Typography>
          </Button>
          
          <Button variant='outlined' size='md' className='border-gray-400 w-full items-center' onPress={() => router.push('/question-collection')}>
            <MaterialCommunityIcons name="chat-question" size={24} color="black" />
            <Typography variant='black' size='lg' weight='400' className='text-center' >Mina frågor</Typography>
          </Button>
          
          <Button variant='outlined' size='md' className='border-gray-400 w-full items-center' onPress={() => router.push('/album')}>
            <MaterialCommunityIcons name="image-album" size={24} color="black" />
            <Typography variant='black' size='lg' weight='400' className='text-center' >Mina album</Typography>
          </Button>
          
        </View>

        <Button variant='blue' size='md' className='mb-8' onPress={signOut}>
          <Typography variant='white' weight='700' className=' text-3xl'>Logga ut</Typography>
        </Button>
      </View>
    </ScrollView>
  );
}