import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, View, TextInput, Modal, Image, TouchableOpacity } from 'react-native';
import { Button, Typography } from '@/components';
import { useAuth } from '@/providers/AuthProvider';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { DiaryEntry } from '@/utils/types';
import { Draw } from '@/components';

export default function DiaryScreen() {
  const { user } = useAuth(); 
  
  const [diary, setDiary] = useState<DiaryEntry[] | null>(null); 
  const [loadedAll, setLoadedAll] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [postText, setPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [drawing, setDrawing] = useState<string | null>(null); 
  const [isDrawingMode, setIsDrawingMode] = useState(false); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false); 

  // Open Image Picker to select image or video
  const pickImageOrVideo = async () => {
    const mediaResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!mediaResult.canceled && mediaResult.assets.length > 0) {
      const asset = mediaResult.assets[0];
      if (asset.type === 'image') {
        setSelectedImage(asset.uri);
      } else if (asset.type === 'video') {
        setSelectedVideo(asset.uri);
      }
    }
  };

  // Handle Drawing (Save the drawing to state)
  const handleSaveDrawing = (savedDrawing: any) => {
    setDrawing(savedDrawing);
  };

  // Function to handle form submission (saving post)
  const handleSavePost = () => {
    // Here you would save the post to the diary, including text, image, video, or drawing
    const newEntry = {
      text: postText,
      image: selectedImage,
      video: selectedVideo,
      drawing: drawing,
    };
    
    // Save to diary (for example, appending it to an array)
    setDiary(prevDiary => [...(prevDiary || []), newEntry]);

    // Reset modal fields
    setPostText('');
    setSelectedImage(null);
    setSelectedVideo(null);
    setDrawing(null);

    // Close modal
    setIsModalVisible(false);
  };

  return (
    <ScrollView>
      <SafeAreaView className="flex-1 items-center justify-start">        
        
        <View className='flex flex-col items-center justify-center px-4 w-full bg-white'>
          <Button variant='black' size='lg' className='my-4' onPress={() => setIsModalVisible(true)}>
            <Typography variant='white' weight='700' size='md'>Skriv i dagboken</Typography>
          </Button>
        </View>
        
        {/* Modal for writing a new post */}
        <Modal
          visible={isModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsModalVisible(false)}
        >
          <View className="flex-1 justify-center items-center bg-black bg-opacity-50">
            <View className="bg-white w-4/5 p-6 rounded-lg">
              <Typography variant='black' size='h3' weight='700'>Ny post</Typography>              
              
              <TextInput
                style={{ borderColor: 'gray', borderWidth: 1, marginTop: 10, padding: 8, height: 100 }}
                placeholder="Skriv din text här..."
                multiline={true}
                value={postText}
                onChangeText={setPostText}
              />

              {/* Media or Drawing Option */}
              <View className="flex flex-row justify-between mt-4">
                <Button variant='black' size='sm' onPress={pickImageOrVideo}>
                  <Typography variant='white' weight='700' size='sm'>Lägg till Bild/Video</Typography>
                </Button>
                <Button variant='black' size='sm' onPress={() => setIsDrawingMode(true)}>
                  <Typography variant='white' weight='700' size='sm'>Måla/teckna</Typography>
                </Button>
              </View>

              {/* Show selected image/video or drawing canvas */}
              {selectedImage && <Image source={{ uri: selectedImage }} style={{ width: 100, height: 100, marginTop: 10 }} />}
              {selectedVideo && <Text style={{ marginTop: 10 }}>Video added: {selectedVideo}</Text>}

              {isDrawingMode && (
                <Draw
                  style={{ width: 300, height: 200, backgroundColor: '#f0f0f0', marginTop: 10 }}
                  onSave={(drawing) => handleSaveDrawing(drawing)} // Save the drawing as a base64 string or image URI
                  strokeColor={'black'}
                  strokeWidth={5}
                />
              )}
              
              {/* Save Button */}
              <Button variant='black' size='lg' className='my-4' onPress={handleSavePost}>
                <Typography variant='white' weight='700' size='md'>Spara post</Typography>
              </Button>
              
              {/* Close Modal Button */}
              <Button variant='outlined' size='md' onPress={() => setIsModalVisible(false)}>
                <Typography variant='black' weight='500' size='md'>Stäng</Typography>
              </Button>
            </View>
          </View>
        </Modal>

        {/* Display Diary Entries */}
        <View className='flex flex-col items-center justify-center w-full px-4 bg-slate-200'>
          <Typography variant='black' size='h3' weight='700' className="mt-4">Dina tidigare inlägg:</Typography>
          {diary?.map((entry, index) => (
            <View key={index} className='flex flex-col items-start justify-start border border-black w-full bg-slate-100 p-4 mt-4'>
              <Typography variant='black' weight='500' size='md'>{entry.text}</Typography>
              {entry.image && <Image source={{ uri: entry.image }} style={{ width: 100, height: 100, marginTop: 10 }} />}
              {entry.video && <Text>Video added: {entry.video}</Text>}
              {entry.drawing && <Image source={{ uri: entry.drawing }} style={{ width: 100, height: 100, marginTop: 10 }} />}
            </View>
          ))}
        </View>
        
        {/* Load More/Show Fewer Button */}
        <View className='flex flex-col items-center justify-center px-4 w-full bg-vgrBlue'>
          {!loadedAll ? (
            <Button variant='outlined' size='lg' className='mt-4' onPress={() => console.log('Load more')}>
              <Typography variant='black' weight='500' size='md'>Hämta alla inlägg</Typography>
            </Button>
          ) : (
            <Button variant='outlined' size='lg' className='mt-4' onPress={() => console.log('Show fewer')}>
              <Typography variant='black' weight='500' size='md'>Visa färre inlägg</Typography>
            </Button>
          )}
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}