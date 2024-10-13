import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View, ImageBackground, ActivityIndicator } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { getOnboardingText, getVersionDescriptions } from '@/utils/querys';
import { OnboardingText, CheckmarkOptions, VersionDescriptions } from '@/utils/types';
import RoundCheckmark from '@/components/Checkmark';


export default function OnboardingScreen() {
  const { user, selectedOption, setSelectedOption } = useAuth();
  const router = useRouter();  

  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState<OnboardingText[]>([]);
  const [versionDescriptions, setVersionDescriptions] = useState<VersionDescriptions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

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
    return <Text>Error fetching data: {error.message}</Text>;
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
      alert('Please select a version.');
      return;
    } 
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
          <View key={item.position} className='flex-1 justify-center items-center px-4'>
            <Text className='text-vgrBlue font-bold text-[17px] text-center uppercase mb-4  font-roboto'>{item.title}</Text>
            <Text className='text-black font-normal text-center leading-5 text-[17px]  font-roboto'>{item.paragraph}</Text>           
          </View>
        ))}
        </View>
      )}

      {currentStep === 2 && (
        <View className="flex-1 justify-center items-center">
          <Text className="font-normal text-xl text-black font-roboto">Välj version av appen</Text>
          <Text className="font-light text-lg text-black font-roboto">Du kan byta version när du vill senare</Text>
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
            <Text className='font-normal italic text-[14px] mb-4 text-center w-[75%] font-roboto' >Versionerna är designade att passa barn mellan 5-18 år</Text>
            <View className='flex flex-col gap-4 items-center justify-center w-[90%]'>
            {versionDescriptions.map((item) => (
              <View key={item.position} className='flex flex-row gap-2 w-full pr-10 items-start justify-start'>
                <Text className='font-normal text-black italic text-[14px] font-roboto'>{item.version}</Text>
                <Text className='font-light text-black italic text-[14px] text-start font-roboto'>{item.paragraph}</Text>
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
      <TouchableOpacity
            className="bg-white rounded-lg px-2 py-2 ml-4"
            onPress={handleBack}
          >
            <Text className="text-vgrBlue text-lg font-bold font-roboto">Avsluta</Text>
        </TouchableOpacity>
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
        <TouchableOpacity
            className="bg-white rounded-lg px-2 py-2 mr-4"
            onPress={handleForward}
          >
            <Text className="text-vgrBlue text-lg font-bold font-roboto">Starta appen</Text>
        </TouchableOpacity>
      </ImageBackground>
      )}

    </View>
  );
}