import { Text, View, TouchableOpacity, TextInput } from 'react-native';
import { Link, useRouter } from 'expo-router'
import { useState } from 'react';
import { supabase } from '@/utils/supabase';


export default function () {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });
    console.log('Welcome back:', data.user?.email)
    if (error) return console.error(error)
    router.push('/(tabs)')
  };


  return (
    <View className="flex-1 items-center justify-center bg-black" >
      <Text className="font-bold text-2xl text-white underline mb-4" >Välkommen!</Text>
      
    <View className='w-full p-4'>
      <TextInput
          placeholder="Email"
          className='bg-white rounded-lg p-4 mb-4 border-gray-300 w-full'
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          secureTextEntry={true}          
          placeholder="Lösenord"
          className='bg-white rounded-lg p-4 border-gray-300 w-full'
          value={password}
          onChangeText={setPassword}
        />
      </View>
      <TouchableOpacity className='mb-4' onPress={handleLogin}>
        <Text className='bg-white rounded py-2 px-4 font-bold text-lg'>Logga in</Text>        
      </TouchableOpacity>
      
        <Text className='text-white'>Har du inget konto?</Text>
        <Link className='text-blue-600' href="/(auth)/signup">Skapa ett konto</Link>
      
    </View>
  );
}