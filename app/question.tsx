import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/utils/supabase';
import { Typography, Button } from '@/components';
import { View, SafeAreaView, TextInput, KeyboardAvoidingView } from 'react-native';

export default function Questions() {
  const { user } = useAuth();
  const { department, department_id, contactperson, staff_id } = useLocalSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [ msgTxt, setMsgTxt ] = React.useState('');
  const [message, setMessage] = React.useState({
    department_id: department_id,   
    department: department,
    contactperson: contactperson,
    txt: msgTxt,
    senderName: user?.first_name + ' ' + user?.last_name,
    senderId: user?.id
  });

  //save message to supabase
  const handleSendMessage = async () => {
    setIsLoading(true);

    const { data: QuestionData, error: QuestionError } = await supabase
    .from('Questions')
    .insert(
      {
        sender_id: message.senderId,
        reciver_id: message.department_id,
        msg_text: message.txt,        
        reciver_name: message.department,
        contact_name: message.contactperson,
        sender_name: message.senderName,
      }
    );

  if(QuestionError) {
    console.error('Error sending message:', QuestionError);
  } else {
    alert('Meddelandet skickat!');
  }

  setIsLoading(false);
  setMsgTxt('');
  setMessage({
    ...message,
    txt: ''
  });
  router.back();
};

const handleAbort = () => {
  setMsgTxt('');
  setMessage({
    ...message,
    txt: ''
  });
  router.back();
};
console.log(message.txt)
  return(
    <SafeAreaView className='bg-vgrBlue flex-1 '>
      <View className='items-center justify-center flex-col px-4 pt-12'>
        <Typography variant='white' size='h1' weight='700' >Skriv meddelande</Typography>
      </View>
      <View className='flex-col px-4'>
        <Typography variant='white' size='md' weight='700' >TILL:</Typography>
        <View className='bg-white flex-col rounded px-4 py-2'>
          <Typography variant='black' size='md' weight='400' >{department}</Typography>
        </View>
      </View>
      <View className='flex-col px-4 mt-4'>
        <Typography variant='white' size='md' weight='700' >KONTAKTPERSON:</Typography>
        <View className='bg-white flex-col rounded px-4 py-2'>
          <Typography variant='black' size='md' weight='400' >{contactperson}</Typography>
        </View>
      </View>
      <KeyboardAvoidingView behavior='padding' className='flex-1'>
        <View className='flex-col px-4 mt-6'>
          <Typography variant='white' size='md' weight='700' >MEDDELANDE:</Typography>
          <View className='bg-white flex-col rounded px-4 py-2'>
            <TextInput
              style={{ height: 100 }}
              placeholder="Skriv din fråga här..."
              multiline={true}
              value={msgTxt}
              onChangeText={setMsgTxt}
            />
          </View>
        </View>

        <View className='flex-row px-6 mt-12 items-center justify-between'>
          <Button variant='black' size='lg' onPress={handleAbort}>
            <Typography variant='white' size='lg' weight='700' >AVBRYT</Typography>
          </Button>
          {isLoading ? (
            <Button variant='black' size='lg' className='bg-gray-400'>
              <Typography variant='black' size='lg' weight='700'>Skickar...</Typography>
            </Button>
          ) : (
            <Button variant='white' size='lg' onPress={handleSendMessage}>
              <Typography variant='blue' size='lg' weight='700'>SKICKA</Typography>
            </Button>
          )}
        </View>
      </KeyboardAvoidingView>
     
    </SafeAreaView>
  );
}