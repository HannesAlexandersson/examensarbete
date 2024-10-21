import React from "react";
import { supabase } from "@/utils/supabase";
import { Typography, Button } from "@/components";
import { useAuth } from "@/providers/AuthProvider";
import { ScrollView, TouchableOpacity, View, TouchableWithoutFeedback, Modal, TextInput } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';
import { ProcedureProps } from "@/utils/types";

export default function ProceduresScreen() {
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = React.useState<boolean>(false);
  const [toolTipVisible, setToolTipVisible] = React.useState<boolean>(false);
  const [procedureTitle, setProcedureTitle ] = React.useState<string>('');
  const [procedureTxt, setProcedureTxt ] = React.useState<string>('');
  const [procedures, setProcedures] = React.useState<ProcedureProps[]>([]);
  const [selectedProcedure, setSelectedProcedure] = React.useState<ProcedureProps | null>(null);
  


  React.useEffect(() => {
    const fetchProcedures = async () => {
      const data: ProcedureProps[] | null = await getProcedures(user?.id || '');
      setProcedures(data);
    };
    fetchProcedures();
  }, []);


  const getProcedures = async (id: string) => {
    const { data, error } = await supabase
    .from('Procedures')
    .select('*')
    .eq('user_id', user?.id);

    if(error) {
      console.error(error);
      return [];
    }
    return data;
  };

  const handleCloseTooltip = () => {
    setToolTipVisible(false);
  };

  const handleAbort = () => {
    setProcedureTxt('');
    setProcedureTitle('');
    setModalVisible(false);
  };

  const handleSave = async () => {
    if (!procedureTitle.trim() || !procedureTxt.trim()) {
      alert('Du måste fylla i både titel och beskrivning för att spara!');
      return;
    }

    const { data, error } = await supabase
    .from('Procedures')
    .insert([
      { 
        user_id: user?.id,
        procedure_title: procedureTitle,
        procedure_text: procedureTxt,
      }
    ])
    .select();

    if (error) {
      console.error('Error saving procedure:', error);
    } else {
      if (data && data.length > 0) {
        
        const newProcedure = data[0]; 
        setProcedures([...procedures, { 
          id: newProcedure.id, 
          procedure_title: procedureTitle, 
          procedure_text: procedureTxt, 
          user_id: user?.id 
        }]);

        setProcedureTxt('');
        setProcedureTitle('');
        setModalVisible(false);
      }
  }
}

const handleDeleteProcedure = async (procedur: ProcedureProps) => {
  
  const { error } = await supabase
  .from('Procedures')
  .delete()
  .match({ id: procedur.id, user_id: user?.id });

  if (error) {
    console.error('Error deleting procedure:', error);
    alert('Något gick fel, försök igen senare!');
  } else {
    setProcedures(procedures.filter(procedure => procedure.id !== procedur.id));
    alert('Procedur borttagen!');
    setModalVisible(false);
  }
}

  return(
    <ScrollView className="bg-vgrBlue">
    <View className='flex-1 items-center justify-center pt-12 px-4'>
        <View className='flex-col items-center justify-center py-4'>
          <Typography variant='white' size='h1' weight='700' >
            Mina Procedurer <TouchableOpacity onPress={() => setToolTipVisible(true)}><Ionicons name="information-circle-outline" size={24} color="white" /></TouchableOpacity>
          </Typography>
          {toolTipVisible && (
          <TouchableWithoutFeedback onPress={handleCloseTooltip}>
            <View className='absolute inset-0 flex items-center justify-center z-50'>
              <View className='bg-black border-[3px] border-white p-4 rounded-lg shadow-lg w-full  mt-36'>
                <TouchableOpacity onPress={handleCloseTooltip} className='absolute top-2 right-2'>
                  <Typography variant='white' size='md' weight='400'>X</Typography>
                </TouchableOpacity>
                <Typography variant='white' size='md' weight='400' className='text-center text-base'>
                  Dina procedurer handlar om hur DU vill att dina sjukhusbesök ska gå till. 
                  Här kan du berätta hur du vill att sjukhuspersonalen ska göra vid olika tillfällen.
                  Vill du till exempel att de ska använda handsprit innan de undersöker dig?
                  Eller att bara korta personer får ta blodprov på dig?
                </Typography>
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}
          
        </View>
        <View className='flex-row gap-1'>
          <Button variant='white' size='md' className='mb-8' onPress={() =>  setModalVisible(true)}>           
            <Typography variant='blue' size='sm' weight='400' className='text-center' >Lägg till procedur</Typography>
          </Button>          
        </View>

        {/* Modal for adding procedure */}
        <Modal visible={modalVisible} transparent={true} animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View className="flex-1 justify-center items-center bg-vgrBlue bg-opacity-50">
            <View className="bg-white p-6 w-4/5 rounded-lg">
              <Typography variant="black" size="h3" weight="700">Lägg till procedur</Typography>
              <TextInput
                placeholder="Vad handlar din procedur om?"
                value={procedureTitle}
                autoFocus={true}
                onChangeText={setProcedureTitle}              
                className="border border-gray-400 mt-4 p-2"
              />
              <TextInput
                className="border border-gray-400 mt-4 p-2"
                style={{ height: 100 }}
                placeholder="Beskriv din procedur..."
                multiline={true}
                value={procedureTxt}
                onChangeText={setProcedureTxt}
              />
              <View className='flex-row gap-4 mt-4'>
                <Button variant='blue' size='md' onPress={handleAbort}>
                  <Typography variant='white' size='md' weight='700'>AVBRYT</Typography>
                </Button>
                <Button variant='blue' size='md' onPress={handleSave}>
                  <Typography variant='white' size='md' weight='700'>SPARA</Typography>
                </Button>
              </View>
            </View>
          </View>
        </Modal>
        {procedures.length > 0 ? ( 
          procedures.map((procedure, index) => (
            <TouchableOpacity 
              key={index} 
              onPress={() => {
                setSelectedProcedure(procedure); 
                setModalVisible(true); 
              }}
            >
              <View className='flex-col bg-white w-full min-w-full p-4 rounded-lg mt-4'>
                <Typography variant='black' size='md' weight='700' className="pb-2">{procedure.procedure_title}</Typography>
                <Typography variant='black' size='md' weight='400'>{procedure.procedure_text}</Typography>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Typography variant='white' size='md' weight='400' className='text-center mt-4'>Du har inte lagt in några procedurer än!</Typography>
        )}

        {/* Modal for selected procedure */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View className='flex-1 justify-center items-center bg-black bg-opacity-50'>
            <View className='bg-white rounded-lg p-4 w-80'>
              {selectedProcedure && (
                <>
                  <Typography variant='black' size='lg' weight='700'>{selectedProcedure.procedure_title}</Typography>
                  <Typography variant='black' size='md' weight='400'>{selectedProcedure.procedure_text}</Typography>
                  
                  <Button
                    variant="blue"
                    size="md"
                    className="my-4 items-center"
                    onPress={() => handleDeleteProcedure(selectedProcedure)}
                  >
                    <Typography variant='white' size='md' weight='700'>Ta bort procedur</Typography>
                  </Button>
                </>
              )}
              <Button
                variant="blue"
                size="md"
                className="items-center"
                onPress={() => {
                  setModalVisible(false);
                  setSelectedProcedure(null); 
                }}
              >
                <Typography variant='white' size='md' weight='700'>Stäng</Typography>
              </Button>
            </View>
          </View>
        </Modal>

      </View>
    </ScrollView>
  );
}