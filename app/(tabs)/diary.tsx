import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Text, View, TextInput, Modal, Image } from 'react-native';
import { Button, Typography, DisplayEntryMedia, MediaPicker, DrawingPicker } from '@/components';
import { useAuth } from '@/providers/AuthProvider';
import DateTimePicker from '@react-native-community/datetimepicker';
import { DiaryEntry, DiaryMediaUpload, FilelikeObject } from '@/utils/types';
import { supabase } from '@/utils/supabase';
import { useDiaryStore } from '@/stores';

export default function DiaryScreen() {

  //global states
  const { 
    user,     
  } = useAuth();   

  const { 
    diary_entries,
    setDiaryEntries,
  } = useDiaryStore();

  //local states  
  const [loadedAll, setLoadedAll] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);
  const [postTitel, setPostTitel] = useState<string>('');
  const [postText, setPostText] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [drawing, setDrawing] = useState<FilelikeObject | null>(null); 
  const [drawingPreview, setDrawingPreview] = useState<string | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState<boolean>(false); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  //state to remount the component
  const [remountKey, setRemountKey] = useState(0);

  //set the modals to false when the component mounts, if the user happens to navigate away from the page. Else they wont open again
  React.useEffect(() => {
    setIsDrawingMode(false);
    setIsModalVisible(false);    
    
    console.log('hej');
  }, [remountKey]);

  
  
  // Function to handle form submission
  const handleSavePost = async () => {
    if (!postText && !selectedImage && !selectedVideo && !drawing) {
      alert("Du kan inte spara en tom post");
      return;
    } else if( !postTitel || !postText) {
      alert("Du måste ange en titel och text för att spara ett inlägg");
      return;
    }
     
    const mediaUploads: DiaryMediaUpload[] = [];    
   

    //only try to upload the media if there is any
    if (drawing) {          
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
      .from('diary_media')
      .upload(drawingFileName, drawingData, {
        cacheControl: '3600000000',
        upsert: false,
      });

      if (drawingError) {
        console.error("Error uploading drawing:", drawingError);
      } else {
        //insert the url to the mediaUploads array
       /*  mediaUploads.push({ type: 'drawing', url: drawingBucketData?.path }); */
       const { data: publicUrlData } = supabase
      .storage
      .from('diary_media')
      .getPublicUrl(drawingBucketData?.path);

      mediaUploads.push({ type: 'video', url: publicUrlData.publicUrl, uri: drawingBucketData?.path });
      }
    }

  if (selectedImage) {
    const imageData = new FormData();
    const imageFileName = selectedImage?.split('/').pop() || 'default-image-name.png';
    imageData.append('file', {
      uri: selectedImage,
      type: `image/${imageFileName?.split('.').pop()}`,
      name: imageFileName,
    } as any);

    const { data: imageBucketData, error: imageError } = await supabase
      .storage
      .from('diary_media')
      .upload(imageFileName, imageData, {
        cacheControl: '3600000000',
        upsert: false,
      });

    if (imageError) {
      console.error("Error uploading image:", imageError);
    } else {
      /* mediaUploads.push({ type: 'image', url: imageBucketData?.path }); */
      const { data: publicUrlData } = supabase
      .storage
      .from('diary_media')
      .getPublicUrl(imageBucketData?.path);

      mediaUploads.push({ type: 'image', url: publicUrlData.publicUrl, uri: imageBucketData?.path });
    }
  }

  if (selectedVideo) {
    const videoData = new FormData();
    const videoFileName = selectedVideo?.split('/').pop() || 'default-video-name.mp4';
    videoData.append('file', {
      uri: selectedVideo,
      type: `video/${videoFileName?.split('.').pop()}`,
      name: videoFileName,
    } as any);

    const { data: videoBucketData, error: videoError } = await supabase
      .storage
      .from('diary_media')
      .upload(videoFileName, videoData, {
        cacheControl: '3600000000',
        upsert: false,
      });

    if (videoError) {
      console.error("Error uploading video:", videoError);
    } else {
      /* mediaUploads.push({ type: 'video', url: videoBucketData?.path }); */
      const { data: publicUrlData } = supabase
      .storage
      .from('diary_media')
      .getPublicUrl(videoBucketData?.path);

      mediaUploads.push({ type: 'video', url: publicUrlData.publicUrl, uri: videoBucketData?.path });
    }
  }

  //if there were any media uploads, get the URL's
  const uploadedMedia = {
    drawing_url: mediaUploads.find((m) => m.type === 'drawing')?.url || null,
    image_url: mediaUploads.find((m) => m.type === 'image')?.url || null,
    video_url: mediaUploads.find((m) => m.type === 'video')?.url || null,
  };

  // Save the post to the table using the media URI's 
  const uploadEntry = {
    user_id: user?.id,
    post_title: postTitel,
    post_text: postText,
    image_url: mediaUploads.find((m) => m.type === 'image')?.uri || null,
    video_url: mediaUploads.find((m) => m.type === 'video')?.uri || null,
    drawing_url: mediaUploads.find((m) => m.type === 'drawing')?.uri || null,
    post_date: selectedDate,  
  };

  //insert the diary entry to the database
  const { data: diaryData, error: diaryError } = await supabase
    .from('diary_posts')
    .insert([uploadEntry])
    .select();

  if (diaryError) {
    console.error("Error saving diary entry:", diaryError);
    return;
  }

  const {data:Eventdata, error:EventError} = await supabase
    .from('Events')
    .insert(
      {
        profile_id: user?.id,
        event_type: 'diary_post',
        event_name: `Nytt dagboksinlägg: ${uploadEntry.post_title}`,
        event_id: diaryData[0].id
      }
    )
    .select();
  if(EventError) console.error('Error saving event', EventError);

  console.log('event added:', Eventdata);

  const newEntry: DiaryEntry = {
    titel: postTitel,
    text: postText,
    image: uploadedMedia.image_url,
    video: uploadedMedia.video_url,
    drawing: uploadedMedia.drawing_url,
    date: selectedDate,
  };  
  console.log('newEntry:', newEntry);
  //update the diary entries in the global state
  setDiaryEntries([newEntry, ...(diary_entries || [])]);  

  // Reset modal fields
  setPostTitel('');
  setPostText('');
  setSelectedImage(null);
  setSelectedVideo(null);
  setDrawing(null);
  setDrawingPreview(null);
  setSelectedDate(new Date());
  
  
  setRemountKey((prevKey) => prevKey + 1); 
  // Close modal
  setIsModalVisible(false);
};

const fetchAllEntries = async () => { 
  setLoadedAll(true);
}
const fetchFewerEntries = async () => {   
  setLoadedAll(false);
}

// Display only the first three entries, or all entries if loadedAll is true
const displayedEntries = loadedAll ? diary_entries : diary_entries?.slice(0, 3);
console.log('displayedEntries:', displayedEntries);
  return (
    <ScrollView>
      <SafeAreaView className="flex-1 items-center justify-start ">        
        
        <View className='flex flex-col items-center justify-center px-4 w-full bg-white'>
          <Button variant='blue' size='lg' className='my-4' onPress={() => setIsModalVisible(true)}>
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
                style={{ borderColor: 'gray', borderWidth: 1, marginTop: 5, padding: 2, height: 100 }}
                placeholder="Skriv din text här..."
                multiline={true}
                value={postText}
                onChangeText={setPostText}
              />
              
              <View className="flex flex-row justify-between mt-4">                
                <MediaPicker setSelectedImage={setSelectedImage} setSelectedVideo={setSelectedVideo} />
                <DrawingPicker
                  setDrawing={setDrawing}
                  setDrawingPreview={setDrawingPreview}
                  isDrawingMode={isDrawingMode}
                  setIsDrawingMode={setIsDrawingMode}
                />
              </View>

              {/* Show selected image/video or drawing canvas */}
              {selectedImage && <Image source={{ uri: selectedImage }} style={{ width: 100, height: 100, marginTop: 10 }} />}
              {selectedVideo && <Text style={{ marginTop: 10 }}>Video added: {selectedVideo}</Text>}
            
              
              <Button variant='blue' size='lg' className='my-4 items-center' onPress={handleSavePost}>
                <Typography variant='white' weight='700' size='md'>Spara post</Typography>
              </Button>
              
              
              <Button variant='black' size='md' className='my-2 items-center' onPress={() => setIsModalVisible(false)}>
                <Typography variant='white' weight='700' size='md'>Ångra</Typography>
              </Button>

                {drawingPreview &&
                <View className='mt-2 items-center justify-center'>
                  <Text >Förhandsgranskning:</Text>              
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
        </Modal>

        {/* Display Diary Entries */}
        {displayedEntries?.map((entry, index) => (
          <ScrollView key={index} className='flex-1 w-full'>
            <View className='flex flex-col items-start justify-start border border-black w-full bg-slate-100 p-4 my-4'>
              <Typography variant='black' weight='700' size='md'>{entry.titel}</Typography>
              <Typography variant='black' weight='500' size='md' className='mb-2'>{entry.text}</Typography>
              <DisplayEntryMedia entry={entry} />  
              {entry.date ? (
                <Typography variant='black' size='sm' className='mt-2'>{new Date(entry.date).toLocaleDateString()}</Typography>
              ) : (
                <Typography variant='black' size='sm' className='mt-2'>Inget datum har angivits</Typography>
              )}
            </View>         
          </ScrollView>
        ))}
        
        
        <View className='flex flex-col items-center justify-center px-4 w-full bg-vgrBlue'>
          {!loadedAll ? (
            <Button variant='outlined' size='lg' className='my-4' onPress={fetchAllEntries}>
              <Typography variant='black' weight='500' size='md'>Hämta alla inlägg</Typography>
            </Button>
          ) : (
            <Button variant='outlined' size='lg' className='my-4' onPress={fetchFewerEntries}>
              <Typography variant='black' weight='500' size='md'>Visa färre inlägg</Typography>
            </Button>
          )}
        </View>
      </SafeAreaView>
    </ScrollView>
  );
}