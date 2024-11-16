import React from 'react';
import { Button, Typography } from '@/components';
import { View, ScrollView, Modal, TouchableOpacity, Linking, Alert } from 'react-native';
import { TextInput } from 'react-native-gesture-handler';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/utils/supabase';
import { OwnAddedMedicinProps, MedicinProps } from '@/utils/types';
import { useMedicineStore, useUserStore } from '@/stores';

export default function Medicin() {
  //global states
  const { user } = useAuth();  
  const { 
    user_own_medicins,
    user_medicins,
    fetchMedicins,
    enrichMedicins,
    setUserOwnMedicins,
    setUserMedicins
   } = useMedicineStore();
  const { id } = useUserStore();
   
  //local states  
  const [newMedicin, setNewMedicin] = React.useState<OwnAddedMedicinProps>({
    namn: '',
    medicin_namn: '',
    ordination: '',
    utskrivare: '',
    avdelning: '', 
    fritext: '',     
  });
  const [addMedicinModalvisible, setAddMedicinModalVisible] = React.useState(false);
  const [selectedMedicin, setSelectedMedicin] = React.useState<OwnAddedMedicinProps | MedicinProps | null>(null);
   
  
  //handlers
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
        //update the zustand store/global state with the new medicin
        setUserOwnMedicins([...user_own_medicins, data[0]]);
        alert('Medicin tillagd. OBS!! Kom ihåg att om du lägger till mediciner själv att alltid kontrollera med din läkare så att doseringen blir korrekt!');        

        const {data:Eventdata, error:EventError} = await supabase
          .from('Events')
          .insert(
            {
              profile_id: user?.id,
              event_type: 'Own_added_medicins',
              event_name: `Ny medicin tillagd: ${newMedicin.medicin_namn}`,
              event_id: data[0].id
            }
          )
          .select();
        if(EventError) console.error('Error saving event', EventError);

        console.log('event added:', Eventdata);
      }
    } catch (error) {
      console.error(error);
    } finally {
      //reset the state
      setNewMedicin({
        namn: '',
        medicin_namn: '',
        ordination: '',
        utskrivare: '',
        avdelning: '',
        fritext: '',
      });
      //refrech the medicins
      const userId = id;
      if (userId) {
        await fetchMedicins(userId);
        await enrichMedicins();
      }
    }
  }  
  
  const handleDelete = async (medicin: MedicinProps |  OwnAddedMedicinProps | null) => {
    if (!medicin) {
      Alert.alert("Ingen medicin vald!", "Välj en medicin att ta bort.");
      return;
    }

    const tableName = 'name' in medicin ? 'medicins' : 'Own_added_medicins';
    const medicinId = medicin.id;

    const { error } = await supabase
    .from(tableName)
    .delete()
    .eq('id', medicinId);

  if (error) {
    console.error(error);
    return;
  }

  if ('name' in medicin) {
    //get current state and filter
    const currentMedicins = useMedicineStore.getState().user_medicins;
    const updatedMedicins = currentMedicins.filter((m) => m.id !== medicinId);
    //update store
    setUserMedicins(updatedMedicins);
  } else {
    //get current state and filter
    const currentOwnMedicins = useMedicineStore.getState().user_own_medicins;
    const updatedOwnMedicins = currentOwnMedicins.filter((m) => m.id !== medicinId);
    //update store
    setUserOwnMedicins(updatedOwnMedicins);
  }; 

  alert('Medicin borttagen!');
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
  
const handleOpenFass = (medicin: MedicinProps | OwnAddedMedicinProps | null) => {
  if (!medicin) {
    Alert.alert("Ingen medicin vald!", "Välj en medicin att söka i Fass.");
    return;
  }

  const drugName = 
  (medicin as OwnAddedMedicinProps).medicin_namn ?? 
  (medicin as MedicinProps).name;

  if (!drugName) {
    Alert.alert("Ingen medicin vald!", "Välj en medicin för att öppna Fass.");
    return;
  }

  const searchQuery = encodeURIComponent(drugName);
  const fassUrl = `https://www.fass.se/LIF/startpage?userType=2&query=${searchQuery}`;

  Linking.openURL(fassUrl).catch((err) =>
    Alert.alert("Error", "Kunde inte öppna Fass...")
  );
};

  //'disguingish' between the medicintypes of the selected medicin
  const handleSelectMedicinUnified = (medicin: OwnAddedMedicinProps | MedicinProps) => {  
    setSelectedMedicin(medicin);   
  };

  //typeguards
  const isOwnAddedMedicin = (medicin: OwnAddedMedicinProps | MedicinProps | null): medicin is OwnAddedMedicinProps => {
    if(!medicin) return false;
    return (medicin as OwnAddedMedicinProps).medicin_namn !== undefined;
  };
  const ismedicin = (medicin: OwnAddedMedicinProps | MedicinProps | null): medicin is MedicinProps => {
    if(!medicin) return false;
    return (medicin as MedicinProps).name !== undefined;
  };

  return(
    <ScrollView className='bg-vgrBlue w-full'>
      <View className='flex-1 items-center justify-center pt-12 px-4'>
        <View className='flex-col items-center justify-center py-4'>
          <Typography variant='black' size='h1' weight='700' className='text-white'>Mina Mediciner</Typography>
          <Typography variant='white' size='md' weight='400' className='text-white'>Här kan du se dina ordinationer.</Typography>
        </View>

        <View className='flex-col gap-2'>
          <View className='flex-row gap-1'>
            <Button variant='white' size='lg' className='' onPress={() => { setAddMedicinModalVisible(true); }}>
              <Typography variant='blue' size='md' weight='700' className='text-center' >Lägg till medicin</Typography>
            </Button>
            <Button variant='white' size='lg' className='' onPress={() => handleDelete(selectedMedicin)}>
              <Typography variant='blue' size='md' weight='700' className='text-center' >Ta bort medicin</Typography>
            </Button>
          </View>
          <View className='flex-row gap-1 items-stretch justify-center'>
            <Button variant='white' size='lg' className='' onPress={() => { handleOpenFass(selectedMedicin); } }>                   
              <Typography variant='blue' size='md' weight='700' className='text-center' >Öppna fass</Typography>
            </Button>
          </View>
        </View>


        <View className='w-full px-4 mb-4'>
          <View>
            <Typography variant='black' size='lg' weight='700' className='text-white my-2'>Mediciner du lagt till själv:</Typography>
          </View>
          {user_own_medicins && (
            user_own_medicins.map((medicin, index) => (
              <TouchableOpacity key={index} onPress={() => handleSelectMedicinUnified(medicin)}>
                <View className={isOwnAddedMedicin(selectedMedicin) && 
                  selectedMedicin?.medicin_namn === medicin.medicin_namn ? 
                  `flex-col items-center justify-between w-full px-4 py-2 my-1 rounded bg-black border  border-purple-700`
                   :
                  `flex-col items-center justify-between w-full px-4 py-2 my-1 rounded bg-white`
                  } >
                  <Typography variant='black' size='lg' weight='700' className={isOwnAddedMedicin(selectedMedicin) && selectedMedicin?.medicin_namn === medicin.medicin_namn ? `text-white mb-2` :`mb-2 `}>{medicin.medicin_namn}</Typography>
                  <Typography variant='black' size='sm' weight='400' className={isOwnAddedMedicin(selectedMedicin) && selectedMedicin?.medicin_namn === medicin.medicin_namn ? `text-white items-start w-full pl-1 mb-2` : `items-start w-full pl-1 mb-2`}>{medicin.ordination}</Typography>
                  <View className='flex-col items-start justify-between w-full mt-4'>                  
                    <Typography variant='black' size='sm' weight='400' className={isOwnAddedMedicin(selectedMedicin) && selectedMedicin?.medicin_namn === medicin.medicin_namn ? ` text-white`:``}>Ordinerat av: {medicin.doktor_namn}</Typography>
                  
                    <Typography variant='black' size='sm' weight='400' className={isOwnAddedMedicin(selectedMedicin) && selectedMedicin?.medicin_namn === medicin.medicin_namn ? ` text-white`:``}>från: {medicin.avd_namn}</Typography>
                    <Typography variant='blue' size='sm' weight='700' className={isOwnAddedMedicin(selectedMedicin) && selectedMedicin?.medicin_namn === medicin.medicin_namn ? `italic text-white mt-2`:`italic mt-2`}>Mina tankar:</Typography>
                    <Typography variant='blue' size='sm' weight='400' className={isOwnAddedMedicin(selectedMedicin) && selectedMedicin?.medicin_namn === medicin.medicin_namn ? `italic text-white`:`italic`}>{medicin.fritext}</Typography>
                  </View>
                </View>
              </TouchableOpacity>
            )))}
          <View>
            <Typography variant='black' size='lg' weight='700' className='text-white my-4'>Mediciner vården lagt till:</Typography>
          </View>
         
          <View className='flex-col w-full'>
            {user_medicins && (
              user_medicins.map((medicin, index) => (
                <TouchableOpacity key={index} onPress={() => handleSelectMedicinUnified(medicin)}>
                <View className={ismedicin(selectedMedicin) && selectedMedicin?.name === medicin.name ? `flex-col items-center justify-between w-full px-4 py-2 my-2 rounded bg-black border  border-purple-700` :`flex-col items-center justify-between w-full px-4 py-2 my-1 rounded bg-white`}>
                  <Typography variant='black' size='lg' weight='700' className={ismedicin(selectedMedicin) && selectedMedicin?.name === medicin.name ? `text-white`:`text-black`}>{medicin.name}</Typography>
                  <View className='flex-col items-start justify-between w-full mt-4'>
                    <Typography variant='black' size='md' weight='400' className={ismedicin(selectedMedicin) && selectedMedicin?.name === medicin.name ? `text-white italic items-start mb-2`: `italic items-start text-black mb-2`}>{medicin.ordination}</Typography>
                    <Typography variant='black' size='md' weight='500' className={ismedicin(selectedMedicin) && selectedMedicin?.name === medicin.name ? ` text-white`: ` text-black`}>{medicin.utskrivare_name}</Typography>
                    <Typography variant='black' size='md' weight='400' className={ismedicin(selectedMedicin) && selectedMedicin?.name === medicin.name ? ` text-white`: ` text-black`}>{medicin.ordinationName}</Typography>
                  </View>
                </View>
                </TouchableOpacity>
              )))}
          </View>
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