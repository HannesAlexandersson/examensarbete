import React, { useEffect } from 'react';
import { Button, Typography } from '@/components';
import { View, ScrollView, SafeAreaView, Modal } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/utils/supabase';
import { OwnAddedMedicinProps, MedicinProps } from '@/utils/types';

export default function Medicin() {
  const { user, fetchMedicins } = useAuth();
  const [medicins, setMedicins] = React.useState<MedicinProps[]>([]);
  const [ownMedicins, setOwnMedicins] = React.useState<OwnAddedMedicinProps[]>([]);
  const [newMedicin, setNewMedicin] = React.useState<OwnAddedMedicinProps>({
    namn: '',
    ordination: '',
    utskrivare: '',
    avdelning: '',  
  });
  const [addMedicinModalvisible, setAddMedicinModalVisible] = React.useState(false);
  const [selectedMedicin, setSelectedMedicin] = React.useState(null);

  //set the states with the users medicins on mount
  useEffect(() => {
    setMedicins(user?.medicins || []);
    setOwnMedicins(user?.own_medicins || []); 
  }, [user]);

  /* const handleMedicinSelect = (medicin) => {
    setSelectedMedicin(medicin);
  }; */

 

  const addMedicin = async (newMedicin: OwnAddedMedicinProps) => {
    try {
      const {data, error} = await supabase
        .from('medicins')
        .insert(
          {
            medicin_namn: newMedicin.namn,
            ordination: newMedicin.ordination,
            avd_namn: newMedicin.avdelning,
            doktor_namn: newMedicin.utskrivare,
            user_id: user?.id,
          }
        );

      if (error) {
        throw error;
      }

      setOwnMedicins([...ownMedicins, newMedicin]);
    } catch (error) {
      console.error(error);
    }
  }
  
  return(
    <ScrollView className='bg-vgrBlue w-full'>
      <View className='flex-1 items-center justify-center pt-12 px-4'>
        <View className='flex-col items-center justify-center py-4'>
          <Typography variant='black' size='h1' weight='700' className='text-white'>Mina Mediciner</Typography>
          <Typography variant='white' size='md' weight='400' className='text-white'>Här kan du se dina ordinationer.</Typography>
        </View>

        <View className='flex-row gap-1'>
          <Button variant='white' size='md' className='' onPress={() => {
            setAddMedicinModalVisible(true)
            alert('OBS! Kom ihåg att om du lägger till mediciner själv att alltid kontrollera med din läkare så att doseringen blir korrekt!')
            }}>
            <Typography variant='blue' size='sm' weight='400' className='text-center' >Lägg till medicin</Typography>
          </Button>
          <Button variant='white' size='md' className='' onPress={() => console.log('medicin borttagen!')}>
            <Typography variant='blue' size='sm' weight='400' className='text-center' >Ta bort vald medicin</Typography>
          </Button>
        </View>


        <View>
          <View>
            <Typography variant='black' size='lg' weight='700' className='text-white mt-2'>Mediciner du lagt till själv:</Typography>
          </View>
          {ownMedicins && (
            ownMedicins.map((medicin, index) => (
              <View key={index} className='flex-col gap-4 items-center justify-between w-full px-4 py-2 border-b border-gray-200'>
                <Typography variant='black' size='lg' weight='400' className='text-white'>{medicin.namn}</Typography>
                <Typography variant='black' size='lg' weight='400' className='text-white'>{medicin.ordination}</Typography>
                <Typography variant='black' size='lg' weight='400' className='text-white'>{medicin.utskrivare}</Typography>
                <Typography variant='black' size='lg' weight='400' className='text-white'>{medicin.avdelning}</Typography>
              </View>
            )))}
          <View>
            <Typography variant='black' size='lg' weight='700' className='text-white my-2'>Mediciner vården lagt till in:</Typography>
          </View>
          {medicins && (
            medicins.map((medicin, index) => (
              <View key={index} className='flex-col gap-2 items-center justify-between w-full px-4 py-2 rounded bg-white'>
                <Typography variant='black' size='lg' weight='700' className=''>{medicin.name}</Typography>
                <Typography variant='black' size='md' weight='400' className='italic'>{medicin.ordination}</Typography>
                <View className='flex-row gap-2 items-center justify-between w-full'>
                  <Typography variant='black' size='md' weight='400' className='italic'>{medicin.ordinationName}</Typography>
                  <Typography variant='black' size='md' weight='400' className='italic'>{medicin.utskrivare_name}</Typography>
                </View>
                <Typography variant='black' size='sm' weight='300' className='text-gray-400 '>Klicka för mer information</Typography>
              </View>
            )))}
        </View>

        {/* Modal for adding medicin */}
        <Modal
          visible={addMedicinModalvisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setAddMedicinModalVisible(false)}
        >
        <View className="flex-1 justify-center items-center bg-vgrBlue bg-opacity-50">
        <View className="flex-col bg-white w-4/5 p-6 rounded-lg">
          <Typography variant='black' size='h3' weight='700'>Lägg till medicin</Typography>
          <TextInput
            placeholder='Läkemedelsnamn'
            style={{ borderColor: 'gray', borderWidth: 1, marginTop: 10, padding: 4, height: 40 }}            
            value={newMedicin.namn}
            onChangeText={text => setNewMedicin({...newMedicin, namn: text})}
          />
          <TextInput
            placeholder='Dosering'
            style={{ borderColor: 'gray', borderWidth: 1, marginTop: 10, padding: 4, height: 40 }}           
            value={newMedicin.ordination}
            onChangeText={text => setNewMedicin({...newMedicin, ordination: text})}
          />
          <TextInput
            placeholder='Läkare som ordinerat medicinen'
            style={{ borderColor: 'gray', borderWidth: 1, marginTop: 10, padding: 4, height: 40 }}           
            value={newMedicin.utskrivare}
            onChangeText={text => setNewMedicin({...newMedicin, utskrivare: text})}
          />
          <TextInput
            placeholder='Vilken avdelning/mottagning som ordinerat medicinen'
            style={{ borderColor: 'gray', borderWidth: 1, marginTop: 10, padding: 4, height: 40 }}           
            value={newMedicin.avdelning}
            onChangeText={text => setNewMedicin({...newMedicin, avdelning: text})}
          />
          <Button variant='blue' size='md' className=' w-full items-center mt-4' onPress={() => {
            console.log('medicin tillagd!')           
            setAddMedicinModalVisible(false)
            }}>
            <Typography variant='white' size='lg' weight='400' className='text-center' >Lägg till medicin</Typography>
          </Button>
          <Button variant='blue' size='md' className=' w-full items-center mt-2 mb-4' onPress={() => {
            setNewMedicin({
              namn: '',
              ordination: '',
              utskrivare: '',
              avdelning: '',  
            })
            setAddMedicinModalVisible(false)            
            }}>
            <Typography variant='white' size='lg' weight='400' className='text-center' >Avbryt</Typography>
          </Button>
          </View>
          </View>
        </Modal>

        {/* <View className='flex-col gap-4 items-center justify-center bg-white'>
          {medicins && (
          medicins.map((medicin, index) => (
            <View key={index} className='flex-row gap-4 items-center justify-between w-full px-4 py-2 border-b border-gray-200'>
              <Typography variant='black' size='lg' weight='400'>{medicin.name}</Typography>
              <Typography variant='black' size='lg' weight='400'>{medicin.dosage}</Typography>
            </View>
          )))}
        </View> */}
      </View>
    </ScrollView>
  );
}