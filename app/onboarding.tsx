import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View, ImageBackground, ActivityIndicator, Alert, BackHandler } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getOnboardingText, getVersionDescriptions } from '@/utils/querys';
import { OnboardingText, CheckmarkOptions, VersionDescriptions } from '@/utils/types';
import { Button, Typography, RoundCheckmark } from '@/components';


export default function OnboardingScreen() {
  const { user, selectedOption, setSelectedOption } = useAuth();
  const router = useRouter();  

  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingText[]>([]);
  const [versionDescriptions, setVersionDescriptions] = useState<VersionDescriptions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  //if the user backtracks, we dont want them to see the onboarding again
  useEffect(() => {
    // Check if the user has already completed onboarding
    if (user?.first_time === false) {
      // confirmation dialog
      Alert.alert(
        "VARNING! Du försöker återgå till processer du redan slutfört!", 
        "Du har redan slutfört onboarding processen, försöker du stänga av appen?", 
        [
          {
            text: "Nej, ta mig tillbaka till appen",
            onPress: () => router.push('/(tabs)'), // If the user selects "No", send them to the home screen
            style: "cancel"
          },
          {
            text: "Ja, stäng av appen",
            onPress: () => BackHandler.exitApp() // Close the app if they select "Yes"
          }
        ],
        { cancelable: false }
      );
    }
  }, [user, router]);
  
  //Fetch the textdata from the CMS
  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getOnboardingText;
        setOnboardingData(data);
        const versionData = await getVersionDescriptions;
        setVersionDescriptions(versionData);
      } catch (err) {
        if (err instanceof Error){
          setError(err);
        }else {
          setError(new Error('An unknown error occurred'));
        }        
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return <Typography variant='blue' weight='700' size='h1'>Error fetching data: {error.message}</Typography>;
  }
 
  //handle the "in component" navigation
  const handleNext = () => {
    if (currentStep === 2) {
      setCurrentStep(currentStep - 1);
    } else {
      setCurrentStep(currentStep + 1); 
    }
  };

  //let the user back out of the onboarding
  const handleBack = () => {    
    router.back(); 
  };

  const options: CheckmarkOptions[] = [
    { id: 1, label: 'Version 1' },
    { id: 2, label: 'Version 2' },
    { id: 3, label: 'Version 3' },
  ];

  const handleSelectOption = (option: number) => {
    setSelectedOption(option);
  };

  const handleForward = async() => {   
    if (selectedOption === null) {
      alert('Välj en version för att fortsätta');
      return;
    } 
    //update the user profile with the selected version and set first_time to false
    const { data, error } = await supabase.from('profiles')
    .update({ first_time: false, selected_version: selectedOption })
    .eq('id', user?.id);

    if (error) return console.error(error);
  
    router.push('/(tabs)');
  };


  return (
    <View className="flex-1 justify-between ">
      
      {currentStep === 1 && (
        <View className="flex-1 justify-center items-center">
          {onboardingData.map((item) => (
          <View key={item.position} className='flex-1 justify-center items-start px-4'>
            <Typography variant='blue' weight='700' className='text-[17px] text-start uppercase mt-4'>{item.title}</Typography>
            <Typography variant='black' weight='400' className='text-start leading-5 text-[17px] mt-4'>{item.paragraph}</Typography>           
          </View>
        ))}
        </View>
      )}

      {currentStep === 2 && (
        <View className="flex-1 justify-center items-center">
          <Typography variant='black' weight='500' size='lg'>Välj version av appen</Typography>
          <Typography variant='black' weight='300'  className="text-lg">Du kan byta version när du vill senare</Typography>
          {options.map(option => (
            <RoundCheckmark
              key={option.id}
              label={option.label}
              isSelected={selectedOption === option.id}
              onPress={() => handleSelectOption(option.id)}
            />
          ))}
          <View className="my-4 h-px w-[90%] bg-vgrBlue " />
          <View className='flex flex-col items-center justify-center w-[90%]'>
            <Typography variant='black' weight='400' size='sm' className='italic mb-4 text-center w-[75%]' >Versionerna är designade att passa barn mellan 5-18 år</Typography>
            <View className='flex flex-col gap-4 items-center justify-center w-[90%] mb-1'>
            {versionDescriptions.map((item) => (
              <View key={item.position} className='flex flex-row gap-2 w-full pr-10 items-start justify-start'>
                <Typography variant='black' weight='400' size='sm' className='italic'>{item.version}</Typography>
                <Typography  variant='black' weight='300' size='sm' className='italic text-start'>{item.paragraph}</Typography>
              </View>
            ))}            
            </View>
          </View>
        </View>
      )}
    {currentStep === 1 && (
      <ImageBackground
      source={require('@/assets/images/wave.png')} 
      style={{ width: '100%', height: 75 }} 
      resizeMode="cover"
      className="flex flex-row items-center " 
    >
      <Button
        variant='white' size='sm'
        className="ml-4"
        onPress={handleBack}
      >
        <Typography variant='blue' weight='700' className="text-lg">Avsluta</Typography>
      </Button>
      <Text className="text-white text-xl font-bold flex-1 text-center font-roboto">{currentStep}/2 sidor</Text>
      <TouchableOpacity onPress={handleNext} className='flex-row items-center mr-4'>
        <Ionicons name="arrow-forward-circle" size={50} color="white" />
      </TouchableOpacity>
    </ImageBackground>
      )}
      {currentStep === 2 && (
        <ImageBackground
        source={require('@/assets/images/wave.png')} 
        style={{ width: '100%', height: 75 }} 
        resizeMode="cover"
        className="flex flex-row items-center " 
      >
        <TouchableOpacity onPress={handleNext} className='flex-row items-center ml-2'>
          <Ionicons name="arrow-back-circle-sharp" size={50} color="white" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold flex-1 text-center font-roboto">{currentStep}/2 sidor</Text>
        <Button
          variant='white'
          size='sm'
          className="mr-4"
          onPress={handleForward}
        >
          <Typography variant='blue' weight='700' className="text-lg">Starta appen</Typography>
        </Button>
      </ImageBackground>
      )}

    </View>
  );
}