import React, { useState } from 'react';
import { Text, View, Image, TouchableOpacity, Alert, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/providers/AuthProvider';
import { router } from 'expo-router';
import { EventSource } from '@/utils/types';
import { Button, Typography } from '@/components';
import Ionicons from '@expo/vector-icons/Ionicons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import EvilIcons from '@expo/vector-icons/EvilIcons';

export default function HomeScreen() {
  const { user, userAvatar } = useAuth();  
  const [events, setEvents] = useState<EventSource[]>([]);

  // handle back button behavior
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (user?.first_time === false) {
          // Show alert when back button is pressed
          Alert.alert(
            "VARNING! Du försöker återgå till processer du redan slutfört!",
            "Du har redan slutfört onboarding processen, försöker du stänga av appen?",
            [
              {
                text: "Nej, ta mig tillbaka till appen",
                onPress: () => null, //do nothing IE stay on the home screen
                style: "cancel"
              },
              {
                text: "Ja, stäng av appen",
                onPress: () => BackHandler.exitApp() //close the app
              }
            ],
            { cancelable: false }
          );
          return true; 
        }
        return false;
      };
      
      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      };
    }, [user])
  );



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
        <Button variant='outlined' size='sm' onPress={handleDiary}>
          <Typography variant='black' weight='400' size='sm' className='uppercase'>Skriv i dagboken</Typography>
        </Button>
        <Button variant='outlined' size='sm' onPress={handleQuestion}>
          <Typography variant='black' weight='400' size='sm' className='uppercase'>Ny fråga</Typography>
        </Button>
      </View>

      <View className='flex flex-col gap-2 items-start justify-start w-full pl-4'>
        <Typography variant='black' weight='400' className='text-[24px]'>Mina händelser</Typography>
        {events.length > 0 ? (
          <>
        {events.map((event) => (
          <View key={event.id} className='flex flex-row gap-2 items-center justify-start w-full pl-4'>
            <Typography variant='black' weight='400' size='sm'>{event.date}</Typography>
            <Typography variant='black' weight='400' size='sm'>{event.title}</Typography>
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
        <Typography variant='black' weight='400' size='sm' className='italic'>Inga händelser</Typography>
      )}
      </View>
    </View>
  );
}