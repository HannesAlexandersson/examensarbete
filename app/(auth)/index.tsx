import { Text, View, TouchableOpacity, TextInput, Image } from 'react-native';
import { Link } from 'expo-router'
import { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import React from 'react';


export default function () {
  /* const router = useRouter(); */
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');


  const { signIn } = useAuth();

  return (
    <View className="flex-1 items-center justify-between bg-vgrBlue" >
       <Image
        source={require('@/assets/images/vgrLong.png')} 
        className=""  
        style={{ width: 300, height: 150, resizeMode: 'contain' }} 
      />
      
    <View className='flex-1 flex-col items-center justify-center w-full p-4'>
      <Text className="font-bold text-2xl text-white mb-4" >Välkommen till Hälsokollen</Text>
      <TextInput
          placeholder="Email"
          className='bg-white rounded-lg p-4 mb-4 border-gray-300 w-full'
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          secureTextEntry={true}          
          placeholder="Lösenord"
          className='bg-white rounded-lg p-4 mb-4 border-gray-300 w-full'
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity className='mb-4' onPress={() => signIn(email, password)}>
          <Text className='bg-white rounded py-2 px-4 font-bold text-lg'>Logga in</Text>        
        </TouchableOpacity>
      
        <Text className='text-white'>Har du inget konto?</Text>
        <Link className='text-blue-300 underline' href="/(auth)/signup">Skapa ett konto</Link>
      </View>
      
      
    </View>
  );
}