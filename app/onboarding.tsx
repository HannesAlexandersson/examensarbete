import React, { useState } from 'react';
import { Text, TouchableOpacity, View, ImageBackground } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function OnboardingScreen() {
  const [currentStep, setCurrentStep] = useState(1);


  const { user } = useAuth();
  const router = useRouter();



  const handleForward = async() => {
    // set the first_time to false so the user will not be redirected to the onboarding screen again and redirect to tabs
    const { data, error } = await supabase.from('profiles').update({ first_time: false }).eq('id', user?.id);
    if (error) return console.error(error);    
    router.push('/(tabs)')
  }

  const handleNext = () => {
    if (currentStep === 2) {
      setCurrentStep(currentStep - 1);
    } else {
      setCurrentStep(currentStep + 1); 
    }
  };
  return (
    <View className="flex-1 justify-between ">
      
      {currentStep === 1 && (
        <View className="flex-1 justify-center items-center">
          <Text className="font-bold text-2xl text-black">Onboarding Screen</Text>
          
        </View>
      )}

      {currentStep === 2 && (
        <View className="flex-1 justify-center items-center">
          <Text className="font-bold text-2xl text-black">Onboarding Step 2</Text>
         
        </View>
      )}
    {currentStep === 1 && (
      <ImageBackground
      source={require('@/assets/images/wave.png')} 
      style={{ width: '100%', height: 75 }} 
      resizeMode="cover"
      className="flex flex-row items-center " 
    >
      <Text className="text-white text-xl font-bold flex-1 text-center ">{currentStep}/2 sidor</Text>
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
        <Text className="text-white text-xl font-bold flex-1 text-center ">{currentStep}/2 sidor</Text>
        <TouchableOpacity
            className="bg-white rounded-lg px-2 py-2 mr-4"
            onPress={handleForward}
          >
            <Text className="text-vgrBlue text-lg font-bold">Starta appen</Text>
        </TouchableOpacity>
      </ImageBackground>
      )}

    </View>
  );
}