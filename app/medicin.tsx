import React, { useEffect } from 'react';
import { Button, Typography } from '@/components';
import { router } from 'expo-router';
import { View, ScrollView, Modal, TouchableOpacity } from 'react-native';
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
    medicin_namn: '',
    ordination: '',
    utskrivare: '',
    avdelning: '', 
    fritext: '',     
  });
  const [addMedicinModalvisible, setAddMedicinModalVisible] = React.useState(false);
  const [selectedMedicin, setSelectedMedicin] = React.useState<OwnAddedMedicinProps | null>(null);
  

  //set the states with the users medicins on mount
  useEffect(() => {
    setMedicins(user?.medicins || []);
    setOwnMedicins(user?.own_medicins || []); 
  }, [user]);

  const addMedicin = async (newMedicin: OwnAddedMedicinProps) => {
    try {
      const {data, error} = await supabase
        .from('Own_added_medicins')
        .insert(
          {
            medicin_namn: newMedicin.medicin_namn,
            ordination: newMedicin.ordination,
            avd_namn: newMedicin.avdelning,
            doktor_namn: newMedicin.utskrivare,
            user_id: user?.id,
            fritext: newMedicin.fritext,
          }
        )
        .select();

      if (error) {
        throw error;
      } else if(data && data.length > 0){        
        //update the local state with the new medicin
        setOwnMedicins([...ownMedicins, data[0]]);
        //update the global user object with the new medicin
        if (user) {
          const newlyAddedMedicin = data[0];
          user.own_medicins = [...ownMedicins, newlyAddedMedicin];
        }        
      }
    } catch (error) {
      console.error(error);
    }
  }  
 
  const handleDelete = async (medicin: OwnAddedMedicinProps | null) => {    
    
    //delete the medicin from the supabase table
    const {data, error} = await supabase
      .from('Own_added_medicins')
      .delete()
      .eq('id', medicin?.id);

      if(error) {
        console.error(error);
        return;
      }

      //remove the medicin from the local state     
      setOwnMedicins(ownMedicins.filter((m) => m.id !== medicin?.id));
      
      //remove the medicin from the global userobject
      if (user) {      
        user.own_medicins = user.own_medicins?.filter((m) => m.id !== medicin?.id);
           
      }
    alert('Medicin borttagen!');
    //clear the states
    setSelectedMedicin(null);
    setNewMedicin({
      namn: '',
      medicin_namn: '',
      ordination: '',
      utskrivare: '',
      avdelning: '',
      fritext: '',
    });
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
          <Button variant='white' size='md' className='' onPress={() => handleDelete(selectedMedicin)}>
            <Typography variant='blue' size='sm' weight='400' className='text-center' >Ta bort vald medicin</Typography>
          </Button>
        </View>


        <View className='w-full px-4'>
          <View>
            <Typography variant='black' size='lg' weight='700' className='text-white my-2'>Mediciner du lagt till själv:</Typography>
          </View>
          {ownMedicins && (
            ownMedicins.map((medicin, index) => (
              <TouchableOpacity key={index} onPress={() => setSelectedMedicin(medicin)}>
                <View className={selectedMedicin?.medicin_namn === medicin.medicin_namn ? `flex-col items-center justify-between w-full px-4 py-2 my-1 rounded bg-black border  border-purple-700` :`flex-col items-center justify-between w-full px-4 py-2 my-1 rounded bg-white`} >
                  <Typography variant='black' size='lg' weight='700' className={selectedMedicin?.medicin_namn === medicin.medicin_namn ? `text-white mb-2` :`mb-2 `}>{medicin.medicin_namn}</Typography>
                  <Typography variant='black' size='sm' weight='400' className={selectedMedicin?.medicin_namn === medicin.medicin_namn ? `text-white items-start w-full pl-1 mb-2` : `items-start w-full pl-1 mb-2`}>{medicin.ordination}</Typography>
                  <View className='flex-col gap-2 items-start justify-between w-full'>
                    <Typography variant='black' size='sm' weight='400' className={selectedMedicin?.medicin_namn === medicin.medicin_namn ? `italic text-white`:`italic`}>Ordinerat av {medicin.doktor_namn}</Typography>
                    <Typography variant='black' size='sm' weight='400' className={selectedMedicin?.medicin_namn === medicin.medicin_namn ? `italic text-white`:`italic`}>från {medicin.avd_namn}</Typography>
                    <Typography variant='blue' size='sm' weight='400' className={selectedMedicin?.medicin_namn === medicin.medicin_namn ? `italic text-white mt-2`:`italic mt-2`}>{medicin.fritext}</Typography>
                  </View>
                </View>
              </TouchableOpacity>
            )))}
          <View>
            <Typography variant='black' size='lg' weight='700' className='text-white my-2'>Mediciner vården lagt till:</Typography>
          </View>
          {medicins && (
            medicins.map((medicin, index) => (
              <View key={index} className='flex-col gap-2 items-center justify-between w-full px-4 py-2 my-1 rounded bg-white'>
                <Typography variant='black' size='lg' weight='700' className=''>{medicin.name}</Typography>
                <Typography variant='black' size='md' weight='400' className='italic'>{medicin.ordination}</Typography>
                <View className='flex-col gap-2 items-start justify-between w-full'>
                  <Typography variant='black' size='md' weight='400' className='italic'>{medicin.utskrivare_name}</Typography>
                  <Typography variant='black' size='md' weight='400' className='italic'>{medicin.ordinationName}</Typography>
                </View>
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
            value={newMedicin.medicin_namn || ''}
            onChangeText={text => setNewMedicin({...newMedicin, medicin_namn: text})}
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
          <TextInput
            placeholder='Din egen kommentar'
            style={{ borderColor: 'gray', borderWidth: 1, marginTop: 10, padding: 4, height: 40 }}           
            value={newMedicin.fritext || ''}
            multiline={true}
            onChangeText={text => setNewMedicin({...newMedicin, fritext: text})}
          />
          <Button variant='blue' size='md' className=' w-full items-center mt-4' onPress={() => {
            addMedicin(newMedicin)           
            setAddMedicinModalVisible(false)
            }}>
            <Typography variant='white' size='lg' weight='400' className='text-center' >Lägg till medicin</Typography>
          </Button>
          <Button variant='blue' size='md' className=' w-full items-center mt-2 mb-4' onPress={() => {
            setNewMedicin({
              namn: '',
              medicin_namn: '',
              ordination: '',
              utskrivare: '',
              avdelning: '',
              fritext: '',
            })
            setAddMedicinModalVisible(false)            
            }}>
            <Typography variant='white' size='lg' weight='400' className='text-center' >Avbryt</Typography>
          </Button>
          </View>
          </View>
        </Modal>

        
      </View>
    </ScrollView>
  );
}