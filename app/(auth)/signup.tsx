import { Text, View, TouchableOpacity, TextInput } from 'react-native';
import { Link, useRouter } from 'expo-router'
import React, { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';





export default  function () {
  const router = useRouter();
  
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

const { signUp } = useAuth();


  return (
    <View className="flex-1 items-center justify-center  bg-black" >
      <Text className="font-bold text-2xl text-white underline mb-4" >Skapa konto</Text>
      
    <View className='w-full p-4'>
    <TextInput
        placeholder="Förnamn"
        className='bg-white rounded-lg p-4 mb-4 border-gray-300 w-full'
        value={firstname}
        onChangeText={setFirstname}
      />
      <TextInput
        placeholder="Efternamn"
        className='bg-white rounded-lg p-4 mb-4 border-gray-300 w-full'
        value={lastname}
        onChangeText={setLastname}
      />
       
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
      <TouchableOpacity className='mb-4' onPress={() => signUp(firstname, lastname, email, password)}>
        <Text className='bg-white rounded py-2 px-4 font-bold text-lg'>Skapa</Text>        
      </TouchableOpacity>
      
        <Text className='text-white'>Har du redan ett konto?</Text>
        <Link className='text-blue-600' href="/(auth)/">Logga in</Link>
      
    </View>
  );
}