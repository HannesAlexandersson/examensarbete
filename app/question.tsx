import React from 'react';
import OpenAI from "openai";
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { Typography, Button } from '@/components';
import { View, SafeAreaView, TextInput, KeyboardAvoidingView } from 'react-native';
import { useUserStore, useAnswerStore, useQuestionStore } from '@/stores';


export default function Questions() {
  //global states  
  const { id, first_name, last_name } = useUserStore();
  const { fetchAnswers } = useAnswerStore();
  const { setResponse } = useQuestionStore();
  //local states
  const { department, department_id, contactperson } = useLocalSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [ msgTxt, setMsgTxt ] = React.useState('');
  const [message, setMessage] = React.useState({
    department_id: department_id,   
    department: department,
    contactperson: contactperson,
    txt: msgTxt,
    senderName: first_name + ' ' + last_name,
    senderId: id
  });
  //environment variables
  const openai = new OpenAI({
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY,
  });

  //handlers
  const handleSendMessage = async () => {
    if (!msgTxt.trim()) {
      alert('Du måste skriva ett meddelande för att skicka!');
      return;
    }

    setIsLoading(true);

  //update the state before saving
  const updatedMessage = {
    ...message,
    txt: msgTxt 
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
    let responseTxt: string | null = null;
    let answerId: string | null = null;
    try{
      responseTxt = await getOpenAIResponse(msgTxt);
      
      setResponse(responseTxt);
      
    } catch (error) {
      console.error('Error sending message to openAI:', error);
    } finally {
      //save the response to supabase table Answers
      const { data: AnswerData, error: AnswerError } = await supabase
        .from('Answers')
        .insert(
          {
            profile_id: id,
            question_id: questionId,
            answer_txt: responseTxt
          }
        )
        .select();
      if(AnswerError) console.error('Error saving answer:', AnswerError);
      if(AnswerData && AnswerData.length > 0) {
      answerId = AnswerData[0].id;
      }
      //add the event to the Events table
      const {data:Eventdata, error:EventError} = await supabase
      .from('Events')
      .insert(
        {
          profile_id: id,
          event_id: answerId,
          event_type: 'Answer',
          event_name: 'Answer from' + updatedMessage.contactperson,
        }
      );
      if(EventError) console.error('Error saving event:', EventError);

      //update the question table, the column answerd to true
      const { data: UpdateData, error: UpdateError } = await supabase
      .from('Questions')
      .update({ answerd: true })
      .eq('id', questionId)
      .eq('sender_id', id);

      if(UpdateError) console.error('Error updating question:', UpdateError);
    }
  }
  //set the global state with the new data  
  if(id)  {
    await fetchAnswers(id);
  }

  router.back();
};

const getOpenAIResponse = async(userMessage: string) => {  
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a helpful medical proffesional such as a nurse or a doctor. Answer the question as you are talking to a young patient. Keep the answer short and concist."
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      model: "gpt-3.5-turbo", // Choose the right model
    });

    return chatCompletion.choices[0].message.content;
  } catch (error) {
    console.error('Error in OpenAI API call:', error);
    throw error;
  }
}

const handleAbort = () => {
  setMsgTxt('');
  setMessage({
    ...message,
    txt: ''
  });
  router.back();
};

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