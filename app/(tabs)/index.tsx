import React, { useEffect, useState } from 'react';
import { Text, View, Image, TouchableOpacity, Alert, BackHandler, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '@/providers/AuthProvider';
import { router } from 'expo-router';
import { Answers, AccountVersion } from '@/utils/types';
import { Button, Typography } from '@/components';
import FullViewModal from '@/components/FullViewModal';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import EvilIcons from '@expo/vector-icons/EvilIcons';
import { truncateText } from '@/utils/utils';
import { getAccountVersion } from '@/utils/querys';
import { useUserStore } from '@/stores/authStore';


export default function HomeScreen() {
  const { user, answers, setAnswers } = useAuth();
  const { userAvatar } = useUserStore();




  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = useState<Answers | null>(null);

  const [version, setVersion] = useState<AccountVersion[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const openModal = (event: Answers) => {
    setSelectedEvent(event);
    setModalVisible(true);
  };


  //get the version from the cms 
  useEffect(() => {
    if(!user)return;

    let version;
    switch (user.selected_version) {
      case 1:
        version = 'Version 1';
        break;
      case 2:
        version = 'Version 2';
        break;
      case 3:
        version = 'Version 3';
        break;
      default:
        version = 'Version 3';
        break;
    }
  const fetchData = async () => {
    try{
        const data = await getAccountVersion(version);
        setVersion(data);
      } catch (err) {
        if (err instanceof Error){
        setError(err);     
        } else {
        setError(new Error('An unknown error occurred'));
        }        
      } finally {
      setLoading(false);
    }
  }
  fetchData();
  }, []);

  
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

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return <Typography variant='blue' weight='700' size='h1'>Något gick fel när vi skulle hämta data från servern: {error.message}</Typography>;
  }
 
  return (
    <View className="flex-1 items-center justify-start gap-4 bg-slate-100">
      <View className='flex flex-row justify-between items-end w-full px-5 pt-12'>
        {version ?   (
          <Typography variant='black' weight='400' size='lg' className="font-normal text-[22px]" >{version?.[0]?.welcomeText} {user?.first_name}!</Typography>
        ) : (
          <Typography variant='black' weight='400' size='lg' className="font-normal text-[22px]" >Välkommen {user?.first_name}!</Typography>
        )}
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
          <Typography variant='black' weight='400' size='sm' className='uppercase'>
          {version ? (
            `${version?.[0]?.diaryButtonText}`
          ) : (
            'Skriv i dagboken'
          )}
          </Typography>
        </Button>
        <Button variant='outlined' size='sm' onPress={handleQuestion}>
          <Typography variant='black' weight='400' size='sm' className='uppercase'>
          {version ? (
            `${version?.[0]?.questionButtonText}`
          ) : (
            'Ny fråga'
          )}
          </Typography>
        </Button>
      </View>

      
      <View className='flex flex-col gap-2 items-start justify-start w-full'>
        <Typography variant='black' weight='400' className='text-[24px] pl-4'>Mina händelser</Typography>
        {answers && answers?.length > 0 ? (
          <>
        {answers.map((answer) => (
        <TouchableOpacity key={answer.id} onPress={() => openModal(answer)}>
          <View className='bg-white flex-row justify-between w-full py-1 my-1 border-b border-t border-black'>
            <View className='items-end justify-center w-[20%]'>
              <MaterialCommunityIcons name="chat-question" size={40} color="black" />
            </View>                
            <View className='flex-col gap-2 items-start justify-start w-[55%]'>            
              <Typography variant='black' weight='700' size='lg'>
              {version ? (
                `${version?.[0]?.questionText}`
              ) : ( 'Fråga besvarad'
              )}
              </Typography>            
              <Typography variant='black' weight='400' size='sm'>{new Date(answer.created_at).toLocaleDateString()}</Typography>            
              <Typography variant='black' weight='400' size='md'>{truncateText(answer.answer_txt || '', 25)}</Typography>              
            </View>
            <View className='items-start justify-center w-[20%]'>
              
                <EvilIcons name="chevron-right" size={60} color="black" />
            </View>
          </View>
        </TouchableOpacity>
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