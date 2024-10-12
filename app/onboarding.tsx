import { Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';

export default function OnboardingScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const handleForward = async() => {
    // set the first_time to false so the user will not be redirected to the onboarding screen again and redirect to tabs
    const { data, error } = await supabase.from('profiles').update({ first_time: false }).eq('id', user?.id);
    if (error) return console.error(error);    
    router.push('/(tabs)')
  }
  return (
    <View className="flex-1 items-center justify-center bg-white" >
      <Text className="font-bold text-2xl text-black" >Onboarding Screen</Text>
      <TouchableOpacity className='bg-black rounded-lg px-4 py-2' onPress={handleForward}>
        <Text className='text-white font-bold text-3xl'>Gå vidare</Text>
      </TouchableOpacity>
    </View>
  );
}