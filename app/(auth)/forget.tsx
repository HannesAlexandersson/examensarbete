import React, { useState } from "react";
import { View, TextInput, Image, KeyboardAvoidingView, ScrollView } from 'react-native';
import { Link } from 'expo-router'
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { Typography, Button } from '@/components';



export default function (){
  const { user } = useAuth();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function forget() {
    setLoading(true);
    const { data, error } = await supabase.auth.resetPasswordForEmail(
      email
    );
    if (!error) {
      setLoading(false);
      alert("Kolla din email för att återställa ditt lösenord");
    }
    if (error) {
      setLoading(false);
      alert(error.message);
    }
  }

  return(
    <KeyboardAvoidingView behavior="height" enabled className="flex-1">
      <View className="flex-1 items-center justify-between bg-vgrBlue" >
       <Image
        source={require('@/assets/images/vgrLong.png')} 
        className=""  
        style={{ width: 300, height: 150, resizeMode: 'contain' }} 
      />
      <ScrollView>
        <View className="px-4">
            <Typography
              variant="white"
              size="h2"
              weight='700'
              className="self-center p-8"            
            >
              Glömt lösenord?
            </Typography>
            <Typography variant="white" size="md" weight="400" className="self-center">Fyll i din mail för att få återställnings instruktioner</Typography>
            <TextInput
              className='bg-white rounded-lg p-2 mt-4 border-gray-300 w-full text-vgrBlue'             
              placeholder="Fyll i din email här"
              value={email}
              autoCapitalize="none"              
              autoCorrect={false}
              keyboardType="email-address"
              onChangeText={(text) => setEmail(text)}
            />
             
            <Button 
              variant='white' 
              size="md" 
              className='my-4 rounded items-center justify-center'             
              onPress={() => {
                forget();
              }}
              
            >
              {loading ? (
                <Typography variant='black' weight='700' className='text-lg'>
                  Laddar...
                </Typography>
              ) : (
                <Typography variant='black' weight='700' className='text-lg'>
                  Skicka
                </Typography>
              )}   
            </Button>

            <View className="flex-col items-center justify-center mt-4" >
              <Typography variant="white" size="md">Har du redan konto?</Typography>
              <Link              
                href="/(auth)/"                
              >
                <Typography
                  size="md"
                  weight="700"
                  className="ml-2 text-blue-300 underline"
                >
                  Logga in här
                </Typography>
              </Link>
            </View>            
          </View>
        </ScrollView>  
      </View>    
    </KeyboardAvoidingView>
  );
}