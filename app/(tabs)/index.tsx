import React, { useState } from 'react';
import { Text, View, Image, TouchableOpacity, Alert, BackHandler, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/providers/AuthProvider';
import { router } from 'expo-router';
import { Answers } from '@/utils/types';
import { Button, Typography } from '@/components';
import FullViewModal from '@/components/FullViewModal';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { truncateText } from '@/utils/utils';

export default function HomeScreen() {
  const { user, userAvatar, answers, setAnswers } = useAuth();

  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<Answers | null>(null); 

  const openModal = (event: Answers) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };

  
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
    router.push('/departments');
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

      
      <View className='flex flex-col gap-2 items-start justify-start w-full'>
        <Typography variant='black' weight='400' className='text-[24px] pl-4'>Mina händelser</Typography>
        {answers && answers?.length > 0 ? (
          <>
        {answers.map((answer) => (
          <View key={answer.id} className='bg-white flex-row justify-between w-full py-1 border-b border-t border-black'>
            <View className='items-end justify-center w-[20%]'>
              <MaterialCommunityIcons name="chat-question" size={40} color="black" />
            </View>                
            <View className='flex-col gap-2 items-start justify-start w-[55%]'>            
              <Typography variant='black' weight='700' size='lg'>Fråga besvarad</Typography>            
              <Typography variant='black' weight='400' size='sm'>{new Date(answer.created_at).toLocaleDateString()}</Typography>            
              <Typography variant='black' weight='400' size='md'>{truncateText(answer.answer_txt || '', 25)}</Typography>              
            </View>
            <View className='items-start justify-center w-[20%]'>
              <TouchableOpacity onPress={() => openModal(answer)}>
                <EvilIcons name="chevron-right" size={60} color="black" />
              </TouchableOpacity>
            </View>
          </View>
        ))}        
        </>
      ): (
        <Typography variant='black' weight='400' size='sm' className='italic'>Inga händelser</Typography>
      )}
      </View>
      
      <FullViewModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        event={selectedEvent} 
      />
    </View>
  );
}