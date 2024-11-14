import React, { useState } from 'react';
import { View, TextInput, Image } from 'react-native';
import { Link } from 'expo-router'
import { useAuth } from '@/providers/AuthProvider';
import { Typography, Button } from '@/components';



export default function () {  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth();

  const handleLogin = async () => {
    await signIn(email, password);      
  };

  return (
    <View className="flex-1 items-center justify-between bg-vgrBlue" >
       <Image
        source={require('@/assets/images/vgrLong.png')} 
        className=""  
        style={{ width: 300, height: 150, resizeMode: 'contain' }} 
      />
      
      <View className='flex-1 flex-col items-center justify-center w-full p-4'>
        <Typography weight='700' variant='white'  className="text-2xl mb-4" >
          Välkommen till Hälsokollen
        </Typography>
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
        <Button variant="white" size="md" className='rounded' onPress={handleLogin}>
          <Typography variant='black' size='md' weight='700' className='text-lg' >Logga in</Typography>
        </Button>       

        <Typography variant="white" size="md" className='mt-8'>Glömt lösenord?</Typography>
        <Link className='text-blue-300 underline' href='/(auth)/forget' >Återställ lösenord</Link>
      
        <Typography variant="white" size="md" className='mt-8'>Har du inget konto?</Typography>
        <Link className='text-blue-300 underline' href="/(auth)/signup">Skapa ett konto</Link>
      </View>
    </View>
  );
}