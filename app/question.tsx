import React from 'react';
import axios from 'axios';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/utils/supabase';
import { Typography, Button } from '@/components';
import { View, SafeAreaView, TextInput, KeyboardAvoidingView } from 'react-native';
import { QuestionProps } from '@/utils/types';

export default function Questions() {
  const { user, setResponse, response } = useAuth();
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
    if (!msgTxt.trim()) {
      alert('Du måste skriva ett meddelande för att skicka!');
      return;
    }

    setIsLoading(true);

    //update the state before saving
  const updatedMessage = {
    ...message,
    txt: msgTxt // ensure message.txt is updated with the latest input value
  };

  const { data: QuestionData, error: QuestionError } = await supabase
    .from('Questions')
    .insert(
      {
        sender_id: updatedMessage.senderId,
        reciver_id: updatedMessage.department_id,
        msg_text: updatedMessage.txt,        
        reciver_name: updatedMessage.department,
        contact_name: updatedMessage.contactperson,
        sender_name: updatedMessage.senderName,
      }
    )
    .select();

  if(QuestionError) {
    console.error('Error sending message:', QuestionError);
  }else if (QuestionData && QuestionData.length > 0) {
    const questionId = QuestionData[0].id;//use this when saving the openAI response to supabase
    
    //clear the states
    setIsLoading(false);
    setMsgTxt('');
    setMessage({
      ...message,
      txt: ''
    });

    try{
      const { data } = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful medical proffesional such as a nurse or a doctor. Answer the question as you are talking to a young patient. Keep the answer short and concist.'
            },
            {
              role: 'user',
              content: updatedMessage.txt
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.EXPO_OPENAI_API_KEY}`,
          },
        }
      );
      
      setResponse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error sending message to openAI:', error);
    } finally {
      //save the response to supabase table Answers
      const { data: AnswerData, error: AnswerError } = await supabase
        .from('Answers')
        .insert(
          {
            profile_id: user?.id,
            question_id: questionId,
            answer_text: response
          }
      );
      if(AnswerError) console.error('Error saving answer:', AnswerError);
    }
  }


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
//EXPO_OPENAI_API_KEY
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