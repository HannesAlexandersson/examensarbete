import React from 'react';
import { router } from 'expo-router';
import { Answers } from '@/utils/types';
import { ScrollView, View } from 'react-native';
import { Typography, Button } from '@/components';
import FullViewModal from '@/components/FullViewModal';
import { useUserStore, useAnswerStore, useQuestionStore } from '@/stores';

export default function QuestionCollection() {
  //global states  
  const { id } = useUserStore();
  const { fetchAnswers, answers } = useAnswerStore();
  const { getQuestions, questions } = useQuestionStore();
  
  //local states  
  const [modalVisible, setModalVisible] = React.useState<boolean>(false);
  const [selectedEvent, setSelectedEvent] = React.useState<Answers | null>(null); 

  React.useEffect(() => {
    if(id){
      getQuestions(id);
      fetchAnswers(id);
    }
  }, []);
  

  const handleFullviewAnswer = (questionId: string) => {
    const answer = answers.find((ans) => ans.question_id === questionId);
  
    if (answer) {
      setSelectedEvent(answer); 
      setModalVisible(true);
    } else {
      console.error('No answer found for this question ID');
    }
  };


  return(
    <ScrollView>
      <View  className="flex-1 items-center justify-start ">
        
        <View className='flex flex-col items-center justify-center px-4 w-full bg-white'>
          <Button variant='blue' size='lg' className='my-4' onPress={() => router.push('/departments')}>
            <Typography variant='white' weight='700' size='md'>Ny fråga till vården</Typography>
          </Button>
        </View>


        {questions?.map((question) => (
          <View key={question.id} className='flex-1 w-full'>
            <View className='flex flex-col items-start justify-start border border-black w-full bg-slate-100 p-4 my-4'>
              <Typography variant='black' size='h3' >{question.msg_text}</Typography>
              <Typography variant='black' size='md' >Från: {question.sender_name}</Typography>
              <Typography variant='black' size='md' >Till:  {question.contact_name}, {question.reciver_name}</Typography>              
              <Typography variant='black' size='md' >Besvarad: {question.answerd ? 'JA' : 'NEJ'}</Typography>
              {question.answerd && (
                <Button variant='blue' size='lg' className='my-4 self-center' onPress={() => handleFullviewAnswer(question.id || '')}>
                  <Typography variant='white' weight='700' size='md'>Visa svar</Typography>
                </Button>
              )}

            </View>
          </View>
        ))}

      <FullViewModal
        isVisible={modalVisible}
        onClose={() => setModalVisible(false)}
        event={selectedEvent} 
      />
      </View>
    </ScrollView>
  );
}