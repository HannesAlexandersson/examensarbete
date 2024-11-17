import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { FullViewModalProps, QuestionProps } from '@/utils/types';
import { supabase } from '@/utils/supabase';
import Typography from './Typography';



//Modal to show the full view of an event in the users feed
const FullViewModal = ({ isVisible, onClose, event }: FullViewModalProps) => {
  const {user} = useAuth();
  const [question, setQuestion] = useState<QuestionProps | null>(null);

  useEffect(() => {
    if(!event) return;

    //fetch the question that corresponds to the event
    const fetchQuestion = async () => {
      const { data, error } = await supabase
      .from('Questions')
      .select('*')
      .eq('id', event.question_id)
      .single();
      if (error) {
        console.error('Error fetching question:', error);
        return [];
      }
      setQuestion(data);
    };

  fetchQuestion();
  
  }, [event]);
  
  if (!event) return null; 

  return (
    <Modal visible={isVisible} transparent={true} animationType="slide">
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <View style={{ backgroundColor: 'white', padding: 20, borderRadius: 10, width: '80%' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 18 }}>{`Svar till ${user?.first_name} ${user?.last_name}`}</Text>
          <Text style={{ marginVertical: 10 }}>{new Date(event.created_at).toLocaleString()}</Text>
          <Typography variant='black' weight='400' size='sm'>Din fråga:</Typography>
          <Typography variant='black' weight='300' size='sm' className='italic mb-1'>{question?.msg_text}</Typography>
          <Typography variant='black' weight='400' size='sm'>Svar:</Typography>
          
          <Typography variant='black' weight='400' size='md' >{event.answer_txt}</Typography>

          <Typography variant='black' weight='400' size='sm' className='mt-2'>Från: {question?.contact_name}</Typography>
         
        {/*Ready to integrate with different kind of events on production after presentation school */}

        {/*   {event.event_type === 'Own_added_medicins' && (
            <Text>
              Medicin: {event.details.medicin_namn}{'\n'}
              Ordination: {event.details.ordination}{'\n'}
              Doktor: {event.details.doktor_namn}
            </Text>
          )}

          {event.event_type === 'diary_posts' && (
            <Text>{event.details.diary_text}</Text>
          )}

          {event.event_type === 'Procedures' && (
            <Text>
              {event.details.procedure_name}{'\n'}
              {event.details.procedure_description}
            </Text>
          )} */}

         
          <TouchableOpacity onPress={onClose}>
            <Text style={{ color: 'blue', textAlign: 'right', marginTop: 10 }}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default FullViewModal;