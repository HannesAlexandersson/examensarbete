import { View, TextInput, Image } from 'react-native';
import { Link } from 'expo-router'
import React, { useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Typography, Button } from '@/components';





export default  function () {  
  const [firstname, setFirstname] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const { signUp } = useAuth();


  return (
    <View className="flex-1 items-center justify-center  bg-vgrBlue" >
      <Image
        source={require('@/assets/images/vgrLong.png')} 
        className="mb-2"  
        style={{ width: 300, height: 150, resizeMode: 'contain' }} 
      />
      
      <View className='flex-1 items-center justify-center w-full p-4'>
        <Typography variant="white" weight="700" className='text-2xl mb-4'>Skapa konto</Typography>
        <TextInput
            placeholder="Förnamn"
            className='bg-white rounded-lg p-4 mb-4 border-gray-300 w-full text-vgrBlue'
            value={firstname}
            onChangeText={setFirstname}
          />
          <TextInput
            placeholder="Efternamn"
            className='bg-white rounded-lg p-4 mb-4 border-gray-300 w-full text-vgrBlue'
            value={lastname}
            onChangeText={setLastname}
          />
          
          <TextInput
              placeholder="Email"
              className='bg-white rounded-lg p-4 mb-4 border-gray-300 w-full text-vgrBlue'
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              secureTextEntry={true}          
              placeholder="Lösenord"
              className='bg-white rounded-lg p-4 mb-4 border-gray-300 w-full text-vgrBlue'
              value={password}
              onChangeText={setPassword}
            />
          <Button variant='white' size="md" className='mb-4 rounded' onPress={() => signUp(firstname, lastname, email, password)}>
            <Typography variant='black' weight='700' className='text-lg'>Skapa</Typography>        
          </Button>
        
          <Typography variant="white" size="md" className='mt-2'>Har du redan ett konto?</Typography>
          <Link className='text-blue-300 underline' href="/(auth)/">Logga in</Link>
        </View>
      
    </View>
  );
}