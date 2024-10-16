import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, View, TextInput, Modal, Image } from 'react-native';
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
  const [postTitel, setPostTitel] = useState('');
  const [postText, setPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [drawing, setDrawing] = useState<string | null>(null); 
  const [drawingPreview, setDrawingPreview] = useState<string | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  //set the modals to false when the component mounts, if the user happens to navigate away from the page. Else they wont open again
  useEffect(() => {
    setIsDrawingMode(false);
    setIsModalVisible(false);
  }, []);
  

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
    console.log('Drawing saved');
    const base64ImageUri = `data:image/png;base64,${savedDrawing}`;
    setDrawingPreview(base64ImageUri);
    setDrawing(savedDrawing);
  };

  // Function to handle form submission (saving post)
  const handleSavePost = () => {
    if (!postText && !selectedImage && !selectedVideo && !drawing) {
      alert("Du kan inte spara en tom post");
      return;
    }
  
    // Save the post to the diary, including text, image, video, drawing, and date
    const newEntry = {
      titel: postTitel,
      text: postText,
      image: selectedImage,
      video: selectedVideo,
      drawing: drawing,
      date: selectedDate,  
    };
  
    // Save to diary
    setDiary(prevDiary => [...(prevDiary || []), newEntry]);
  
    // Reset modal fields
    setPostText('');
    setSelectedImage(null);
    setSelectedVideo(null);
    setDrawing(null);
    setSelectedDate(new Date());
  
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
          <View className="flex-1 justify-center items-center bg-vgrBlue bg-opacity-50">
            <View className="flex-col bg-white w-4/5 p-6 rounded-lg">
              <Typography variant='black' size='h3' weight='700'>Nytt dagboksinlägg</Typography>
              <View className="flex-col justify-center items-start">
                <Typography variant='black' size='sm' weight='400'>Välj datum för inlägget</Typography>
                <Button variant='outlined' size='sm' className='mb-4 w-full rounded' onPress={() => setShowDatePicker(true)}>
                  <Typography variant='black' weight='400' size='sm'>
                    {selectedDate ? selectedDate.toLocaleDateString() : 'Välj datum'}
                  </Typography>
                </Button>
              </View>
              <View className="flex-1 justify-center items-center">

                {showDatePicker && (
                  <DateTimePicker
                  locale='sv-SE'
                    value={selectedDate}
                    mode="date"
                    display="default"
                    onChange={(event, date) => {
                      setShowDatePicker(false);
                      if (date) {
                        setSelectedDate(date);
                      }
                    }}
                  />
                )}
              </View>
              <TextInput
                style={{ borderColor: 'gray', borderWidth: 1, marginTop: 10, padding: 4, height: 40 }}
                placeholder="Skriv titeln här..."
                multiline={false}
                value={postTitel}
                onChangeText={setPostTitel}
              />
              
              <TextInput
                style={{ borderColor: 'gray', borderWidth: 1, marginTop: 10, padding: 8, height: 100 }}
                placeholder="Skriv din text här..."
                multiline={true}
                value={postText}
                onChangeText={setPostText}
              />

              {/* Media or Drawing Option */}
              <View className="flex flex-row justify-between mt-4">
                <Button variant='blue' size='sm' onPress={pickImageOrVideo}>
                  <Typography variant='white' weight='700' size='sm'>Lägg till Bild/Video</Typography>
                </Button>
                <Button variant='blue' size='sm' onPress={() => setIsDrawingMode(true)}>
                  <Typography variant='white' weight='700' size='sm'>Måla/teckna</Typography>
                </Button>
              </View>

              {/* Show selected image/video or drawing canvas */}
              {selectedImage && <Image source={{ uri: selectedImage }} style={{ width: 100, height: 100, marginTop: 10 }} />}
              {selectedVideo && <Text style={{ marginTop: 10 }}>Video added: {selectedVideo}</Text>}

              {isDrawingMode && (
                <Modal
                visible={isModalVisible}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setIsDrawingMode(false)}
              >
                <Draw
                  style={{ height: '100%', width: '100%' }}
                  onSave={(drawing) => handleSaveDrawing(drawing)} // Save the drawing as a base64 string or image URI
                  strokeColor={'black'}
                  strokeWidth={5}
                  onClose={() => setIsDrawingMode(false)}
                />
                </Modal>
              )}
              
              {/* Save Button */}
              <Button variant='blue' size='lg' className='my-4 items-center' onPress={handleSavePost}>
                <Typography variant='white' weight='700' size='md'>Spara post</Typography>
              </Button>
              
              {/* Close Modal Button */}
              <Button variant='black' size='md' className='my-2 items-center' onPress={() => setIsModalVisible(false)}>
                <Typography variant='white' weight='700' size='md'>Ångra</Typography>
              </Button>

                {drawing &&
                <View className='mt-2 items-center justify-center'>
                  <Text >Förhandsgranskning:</Text>              
                  <Image source={{ uri: drawing }} style={{ width: 100, height: 100, marginTop: 10, borderWidth: 1, borderColor: 'black' }} />
                </View>
                }
            </View>
          </View>
        </Modal>

        {/* Display Diary Entries */}
        {diary?.map((entry, index) => (
          <View key={index} className='flex flex-col items-start justify-start border border-black w-full bg-slate-100 p-4 mt-4'>
            <Typography variant='black' weight='500' size='md'>{entry.text}</Typography>
            {entry.date ? (
              <Typography variant='black' size='sm'>{new Date(entry.date).toLocaleDateString()}</Typography>
            ) : (
              <Typography variant='black' size='sm'>Inget datum har angivits</Typography>
            )}
            {entry.image && <Image source={{ uri: entry.image }} style={{ width: 100, height: 100, marginTop: 10 }} />}
            {entry.video && <Text>Video added: {entry.video}</Text>}
            {entry.drawing && <Image source={{ uri: entry.drawing }} style={{ width: 100, height: 100, marginTop: 10 }} />}
          </View>
        ))}
        
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