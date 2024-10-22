import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Typography, Button } from '@/components';
import { View, ScrollView, Modal, TextInput, TouchableOpacity } from 'react-native';
import { supabase } from '@/utils/supabase';
import { DiagnosisProps } from '@/utils/types';

export default function Diagnosis() {
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = React.useState<boolean>(false);
  const [diagnosis, setDiagnoses] = React.useState<DiagnosisProps[] | null>([]);
  const [newDiagnosis, setNewDiagnoses] = React.useState<DiagnosisProps>({
    name: '',
    description: '',
    id: '',
  });  
  const [isActive, setIsActive] = React.useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = React.useState<DiagnosisProps | null>(null);
  const [isFullviewModalVisible, setIsFullviewModalVisible] = React.useState<boolean>(false);

  React.useEffect(() => {
    fetchDiagnosis();
  }, []);

  const fetchDiagnosis = async () => {
    const { data: diagnosisData, error: diagnosisError } = await supabase
    .from('Diagnosis')
    .select('*')
    .eq('user_id', user?.id);

    if (diagnosisError) {
      console.error('Error fetching diagnosis:', diagnosisError);
    } else {
      setDiagnoses(diagnosisData);
    }
  }

  const handleAddDiagnosis = async() => {
    try{
      if(newDiagnosis.name === '' || newDiagnosis.description === ''){
        throw new Error('All fields must be filled');
      }

      //save the new diagnosis to supabase
      const { data, error } = await supabase
      .from('Diagnosis')
      .insert      
      (
        {
          name: newDiagnosis.name,
          description: newDiagnosis.description,
          user_id: user?.id,
        }
      )
      .select();

      if (error) {
        console.error('Error adding contact:', error);
        return;
      }
     //add the new diagnosis to the list of diagnoses
      setDiagnoses((prevDiagnoses) => (prevDiagnoses ? [...prevDiagnoses, newDiagnosis] : [newDiagnosis]));
      setNewDiagnoses({ name: '', description: '', id: '' });
    } catch (error) {
      console.error('Error adding diagnosis:', error);
    }
   
    setModalVisible(false);
  };

  const handleAbort = () => {
    setIsActive(false);
    setNewDiagnoses({ name: '', description: '', id: '' });
    setModalVisible(false);
  };

  const handleFocus = () => {
    setIsActive(true); //so when a input field is active we set the state to true
  };
  const handleBlur = () => {
    setIsActive(false); //and when the user is done with the input field we set the state to false wich makes the cursor go to the start based on the selection prop
  };

  //open the fullview modal on press for the selected contact
  const handleSelectedDiagnosis = (diagnosis: DiagnosisProps) => {
    setSelectedDiagnosis(diagnosis); 
    setIsFullviewModalVisible(true); 
  };

  const handleRemoveDiagnosis = async (diagnosis: DiagnosisProps) => {
    if(!diagnosis){
      return
    };

    try {
      const { error } = await supabase
        .from('Diagnosis')
        .delete()
        .eq('id', diagnosis.id);

      if (error) {
        console.error('Error removing diagnosis:', error);
        return;
      }

      alert('Diagnos borttagen!');  
      //refresh the page so the new contact is displayed
      fetchDiagnosis();
    } catch (error) {
      console.error('Error removing diagnosis:', error);
    }

    setIsFullviewModalVisible(false);
  };
  return(
    <ScrollView className='bg-vgrBlue'>
      <View className='flex-1 items-center justify-center pt-12 px-4'>
        <View className='flex-col items-center justify-center py-4'>
          <Typography variant='white' size='h1' weight='700' >Min Diagnos</Typography>
        </View>

        <View className='flex-row gap-1'>
          <Button variant='white' size='md' className='' onPress={() =>  setModalVisible(true)}>           
            <Typography variant='blue' size='sm' weight='400' className='text-center' >Lägg till Diagnos</Typography>
          </Button>          
        </View>

        <Modal visible={modalVisible} transparent={true} animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View className="flex-1 justify-center items-center bg-vgrBlue bg-opacity-50">
            <View className="bg-white p-6 w-4/5 rounded-lg">
              <Typography variant="black" size="h3" weight="700">Lägg till diagnos</Typography>
              <TextInput
                placeholder="Vad heter sjudomen?"
                value={newDiagnosis?.name || ''}
                autoFocus={true}
                onChangeText={(text) => setNewDiagnoses({ ...newDiagnosis, name: text })}              
                className="border border-gray-400 mt-4 p-2"
                onFocus={handleFocus} //set focus state when user uses the input field
                onBlur={handleBlur} //reset focus state when user is done using the input field
                selection={isActive ? undefined : { start: 0 }}
              />
              <TextInput
                placeholder='Beskriv vad det innebär för dig'
                value={newDiagnosis?.description || ''}
                multiline={true}
                autoFocus={true}
                onChangeText={(text) => setNewDiagnoses({ ...newDiagnosis, description: text })}
                className="border border-gray-400 mt-4 p-2"
                onFocus={handleFocus} //set focus state when user uses the input field
                onBlur={handleBlur} //reset focus state when user is done using the input field
                selection={isActive ? undefined : { start: 0 }}
              />

              <Button variant="blue" size="md" className="w-full mt-4" onPress={handleAddDiagnosis}>
                <Typography variant="white" size="lg" weight="400" className="text-center">Lägg till diagnos</Typography>
              </Button>
              <Button variant="blue" size="md" className="w-full mt-4" onPress={handleAbort}>
                <Typography variant="white" size="lg" weight="400" className="text-center">Avbryt</Typography>
              </Button>
            </View>
          </View>
        </Modal>

        <ScrollView className='flex-1 w-full'>
          {diagnosis && (
            diagnosis.map((diagnosis, index) => (
            <TouchableOpacity key={index} onPress={() => handleSelectedDiagnosis(diagnosis)}>
              <View className='flex-col items-center justify-center py-4 px-6 min-w-full bg-white rounded-lg mt-8'>
                <Typography variant='blue' size='h2' weight='700' >{diagnosis.name}</Typography>
                <Typography variant='blue' size='md' weight='400' >{diagnosis.description}</Typography>
              </View>
            </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Fullview modal */}
        <Modal visible={isFullviewModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsFullviewModalVisible(false)}>
          <View className="flex-1 justify-center items-center bg-vgrBlue bg-opacity-50">
            <View className="bg-white p-6 w-4/5 rounded-lg">
              <Typography variant="black" size="h3" weight="700">Diagnos</Typography>
              <Typography variant="blue" size="h2" weight="700">{selectedDiagnosis?.name}</Typography>
              <Typography variant="blue" size="md" weight="400">{selectedDiagnosis?.description}</Typography>
              <Button
                variant='blue'
                size='md'
                className="mt-4 rounded"
                onPress={() => handleRemoveDiagnosis(selectedDiagnosis as DiagnosisProps)}
              >
                <Typography className="text-white text-center">Ta Bort Diagnos</Typography>
              </Button>
              <Button variant="blue" size="md" className="w-full mt-4" onPress={() => setIsFullviewModalVisible(false)}>
                <Typography variant="white" size="lg" weight="400" className="text-center">Stäng</Typography>
              </Button>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}