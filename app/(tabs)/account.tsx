import { View, Image, ScrollView, Modal } from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import React from 'react';
import { Entypo, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Typography, Button, DrawingPicker } from '@/components';
import { FilelikeObject } from "@/utils/types";
import { supabase } from '@/utils/supabase';
import { useUserStore } from '@/stores/authStore';


export default function AccountScreen() {
  //global states
  const { user, signOut } = useAuth();
  const { userAvatar, userAge, first_name, description, selected_option } = useUserStore();
  //local states
  const [paintModal, setPaintModal] = React.useState(false);
  const [isDrawingMode, setIsDrawingMode] = React.useState(false);
  const [drawing, setDrawing] = React.useState<FilelikeObject | null>(null);
  const [drawingPreview, setDrawingPreview] = React.useState<string | null>(null);

  //lifecycle
  React.useEffect(() => {
    console.log('version changed to: ', selected_option);
  }, [selected_option]);


  //handlers
  const handleEditAccount = () => {
    router.push('/edit');
  }

  const handleSavePainting = async() => {    
    let drawingUrl = '';

    //only try to upload the media if there is any
    if (drawing) {
      try {
        const drawingData = new FormData();     
        drawingData.append('file', {
        uri: drawing.uri,
        type: drawing.type,
        name: drawing.name,
        } as any);

        //generate a unique filename
        const drawingFileName = `drawing-${Date.now()}.${drawing.name.split('.').pop()}`;

        //save to bucket
        const { data: drawingBucketData, error: drawingError } = await supabase
        .storage
        .from('drawings')
        .upload(drawingFileName, drawingData, {
          cacheControl: '3600000000',
          upsert: false,
        });

        if (drawingError) {
          console.error("Error uploading drawing:", drawingError);
        } else {
          console.log("Drawing uploaded successfully to bucket:", drawingBucketData);
          drawingUrl = `${drawingBucketData?.path}`;
        }
        //upload the uri to the db table
        const entry = {
          user_id: user?.id,
          drawing_uri: drawingUrl,
          name: drawingFileName,
        };
        try {
          const { data: drawingData, error: drawingError } = await supabase
          .from('Drawings')
          .insert(entry);
          if (drawingError) {
            console.error("Error inserting drawing into table:", drawingError);
          } else {
            console.log("Drawing inserted successfully into table:", drawingData);
          }
        } catch (error) {
          console.error("Error inserting drawing into table:", error);
        }
      } catch (error) {
        console.error("Error uploading drawing:", error);
      } finally {
        setDrawing(null);
        setDrawingPreview(null);
      }

    }
    setPaintModal(false);   
  }

  const handleAbortPainting = () => {
    setPaintModal(false);
    setDrawing(null);
    setDrawingPreview(null);
  }
  
  return (
  <ScrollView>
    <View className="flex-1 items-center justify-start gap-4 bg-white">
      <View className='flex flex-row justify-between items-center w-full px-5 pt-8 pb-3 bg-slate-100'>
        <View className='w-1/2 flex flex-col items-start justify-center pl-4'>
          {description ? (
            <>
            <Typography variant='black' weight='400' size='xl' className='mb-4'>{first_name} {userAge && (<>, {userAge}år</>)}</Typography>          
            <Typography variant='black' weight='400' size='md' className=''>{description}</Typography>
            </>
          ) : (
            <>
              <Typography variant='black' weight='400' size='xl' className='mb-4'>Hej {first_name}!</Typography>
              <Typography variant='black' weight='400' size='md' className='text-left'>Skriv och berätta lite om dig själv här.</Typography>
            </>
          )}        
        </View>
        <View className='w-1/2 flex flex-col gap-2 items-center justify-center'>
          {userAvatar && (
            <View className='flex items-center justify-center'>
              <Image 
                source={{ uri: userAvatar }}
                className="w-16 h-20 rounded-full"
              />
            </View>
          )}
          {!userAvatar && (
            <View className='flex items-center justify-center'>
              <Image 
                source={require('@/assets/images/default_avatar.png')}
                className="w-16 h-20 rounded-full"
              />            
            </View>
          )}          
          <Button variant='outlined' size='sm' className='items-center flex-row bg-transparent' onPress={handleEditAccount}>          
            <Typography variant='black' size='sm' weight='400' className='text-center mr-1' >Ändra</Typography>
            <Entypo name="pencil" size={14} color="black" />
          </Button>
        </View>
      </View>
      <View className='flex flex-col gap-2 items-center justify-center w-full px-12 bg-white'>

        <Button variant='outlined' size='md' className='border-gray-400 w-full items-center' onPress={() => router.push('/diary')} >
          <MaterialCommunityIcons name="book-edit" size={24} color="black" />
          <Typography variant='black' size='lg' weight='400' className='text-center' >Min dagbok</Typography>
        </Button>
        
        <Button variant='outlined' size='md' className='border-gray-400 w-full items-center' onPress={() => router.push('/question-collection')}>
          <MaterialCommunityIcons name="chat-question" size={24} color="black" />
          <Typography variant='black' size='lg' weight='400' className='text-center' >Mina frågor</Typography>
        </Button>
        
        <Button variant='outlined' size='md' className='border-gray-400 w-full items-center' onPress={() => router.push('/album')}>
          <MaterialCommunityIcons name="image-album" size={24} color="black" />
          <Typography variant='black' size='lg' weight='400' className='text-center' >Mina album</Typography>
        </Button>
        {selected_option === 1 || selected_option === 2 && (
          <Button variant='outlined' size='md' className='border-gray-400 w-full items-center' onPress={() => setPaintModal(true)}>
            <FontAwesome name="paint-brush" size={24} color="black" />
            <Typography variant='black' size='lg' weight='400' className='text-center' >Måla</Typography>
          </Button>
        )}
      </View>

      <Button variant='blue' size='md' className='mb-8' onPress={signOut}>
        <Typography variant='white' weight='700' className=' text-3xl'>Logga ut</Typography>
      </Button>
    </View>

      <Modal 
        visible={paintModal}
        animationType='slide'
        transparent={true}
      >
       <View className="flex-1 justify-center items-center bg-vgrBlue bg-opacity-50">
        <View className="bg-white flex-col p-6 w-4/5 rounded-lg">
        <Typography variant='blue' size='md' weight='700' className='py-4'>Måla en teckning</Typography>
        <Typography variant='blue' size='md' weight='300' className=''>Starta målningen genom att trycka på knappen här nedanför</Typography>
        <View className='flex-col items-center justify-center mt-4'>
          <DrawingPicker
            setDrawing={setDrawing}
            setDrawingPreview={setDrawingPreview}
            isDrawingMode={isDrawingMode}
            setIsDrawingMode={setIsDrawingMode}            
          />
           <View className='flex-col items-center justify-center mt-4'>
           {drawingPreview &&
            <View className='mt-2 items-center justify-center'>
              <Typography variant='blue' size='sm' weight='400' >Förhandsgranskning:</Typography>              
              <Image 
                source={{ uri: drawingPreview }} 
                style={{ width: 100, height: 100, 
                marginTop: 10, borderWidth: 1, 
                borderColor: 'black' }} 
              />
            </View>
           }
           </View>
          </View>
          <View className='flex-row gap-1 items-center justify-between mt-4'>
            <Button variant='blue' size='lg' onPress={handleSavePainting}>
              <Typography variant='white' size='md' weight='700'>Spara</Typography>
            </Button>
            <Button variant='blue' size='lg' onPress={handleAbortPainting}>
              <Typography variant='white' size='md' weight='700'>Avbryt</Typography>
            </Button>
          </View>
        </View>
      </View>
    </Modal>
  </ScrollView>
  );
}