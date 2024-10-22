import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, Text, View, TextInput, Modal, Image, Platform } from 'react-native';
import { Button, Typography, DisplayEntryMedia, Draw } from '@/components';
import { useAuth } from '@/providers/AuthProvider';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { DiaryEntry, DiaryMediaUpload, FilelikeObject } from '@/utils/types';
import * as FileSystem from 'expo-file-system';
import { supabase } from '@/utils/supabase';
import type { SkImage } from '@shopify/react-native-skia';



export default function DiaryScreen() {
  const { user } = useAuth(); 
  
  const [diary, setDiary] = useState<DiaryEntry[] | null>(null); 
  const [loadedAll, setLoadedAll] = useState<boolean>(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [postTitel, setPostTitel] = useState('');
  const [postText, setPostText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [drawing, setDrawing] = useState<FilelikeObject | null>(null); 
  const [drawingPreview, setDrawingPreview] = useState<string | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false); 
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  //state to remount the component
  const [remountKey, setRemountKey] = useState(0);

  //set the modals to false when the component mounts, if the user happens to navigate away from the page. Else they wont open again
  useEffect(() => {
    setIsDrawingMode(false);
    setIsModalVisible(false);   
    fetchUserEntries(true); 
  }, [remountKey]);

  
  
  //fetch the  diary entrys 
  const fetchUserEntries = async (limitEntries: boolean = true) => {
    //first check if user is logged in
    if (!user?.id) {
      console.error('User ID is missing');
      return;
    }
    
    try{      
      
      let query = supabase
      .from('diary_posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });//post_date or created_at
        
        
      if (limitEntries) {
        query = query.limit(3); // Change the number as needed
      }

      const { data: diaryEntries, error: diaryError } = await query;

      if (diaryError) {
        console.error('Error fetching diary posts:', diaryError);
        return;
      }

      if (!diaryEntries || diaryEntries.length === 0) {
        console.log('No diary posts found for this user.');
        return;
      }

      //map the database fields to the entry structure
      const formattedEntries: DiaryEntry[] = await Promise.all(
        diaryEntries.map(async (entry: any) => {
          
          const mediaUrls = await getMediaFiles(entry);

          return {
            titel: entry.post_title,   
            text: entry.post_text,   
            image: mediaUrls.image || null,  
            video: mediaUrls.video || null, 
            drawing: mediaUrls.drawing || null, 
            date: new Date(entry.post_date)  
          };
        })
      );
    
      
    //set the diary entrys to the state
    setDiary(formattedEntries);   

  }catch (error) {
    console.error('Error fetching user images:', error);
  } 
}

  const getMediaFiles = async (entry: DiaryEntry) => {
    const mediaUrls: any = {
      image: null,
      video: null,
      drawing: null,
    };
  
    // Fetch image URL if exists
    if (entry.image_url) {
      const { data: imageUrl } = supabase.storage
        .from('diary_media')
        .getPublicUrl(entry.image_url);  // Use the actual field from the database
      if (imageUrl?.publicUrl) mediaUrls.image = imageUrl.publicUrl;
    }
  
    // Fetch video URL if exists
    if (entry.video_url) {
      const { data: videoUrl } = supabase.storage
        .from('diary_media')
        .getPublicUrl(entry.video_url);  // Use the actual field from the database
      if (videoUrl?.publicUrl) mediaUrls.video = videoUrl.publicUrl;
    }
  
    // Fetch drawing URL if exists
    if (entry.drawing_url) {
      const { data: drawingUrl } = supabase.storage
        .from('diary_media')
        .getPublicUrl(entry.drawing_url);  // Use the actual field from the database
      if (drawingUrl?.publicUrl) mediaUrls.drawing = drawingUrl.publicUrl;
    }
  
    return mediaUrls;
}
  

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
  const handleSaveDrawing = async (snapshot: SkImage) => {
    try {
      // Generate base64 for preview
      const base64Image = snapshot.encodeToBase64();
      const base64ImageUri = `data:image/png;base64,${base64Image}`;
      setDrawingPreview(base64ImageUri);

      // Save file to device storage
      const snapshotBytes = await snapshot.encodeToBytes();
      const drawingFileName = `user-drawing-${new Date().toISOString()}.png`;
      const fileUri = `${FileSystem.documentDirectory}${drawingFileName}`;
      
      // Write bytes directly to file
      await FileSystem.writeAsStringAsync(fileUri, base64Image, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      

      // Create FilelikeObject
      const userDrawing: FilelikeObject = {
        uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
        name: drawingFileName,
        type: 'image/png',
      };
      
      setDrawing(userDrawing);

      console.log('Drawing saved successfully');
    } catch (error) {
      console.error('Error saving drawing:', error);
    }
  };

  // Function to handle form submission (saving post)
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
        mediaUploads.push({ type: 'drawing', url: drawingBucketData?.path });
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
      mediaUploads.push({ type: 'image', url: imageBucketData?.path });
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
      mediaUploads.push({ type: 'video', url: videoBucketData?.path });
    }
  }

  //if there were any media uploads, get the uri's
  const uploadedMedia = {
    drawing_url: mediaUploads.find((m) => m.type === 'drawing')?.url || null,
    image_url: mediaUploads.find((m) => m.type === 'image')?.url || null,
    video_url: mediaUploads.find((m) => m.type === 'video')?.url || null,
  };

  // Save the post to the diary, including text, image, video, drawing, and date
  const uploadEntry = {
    user_id: user?.id,
    post_title: postTitel,
    post_text: postText,
    image_url: mediaUploads.find((m) => m.type === 'image')?.url || null,
    video_url: mediaUploads.find((m) => m.type === 'video')?.url || null,
    drawing_url: mediaUploads.find((m) => m.type === 'drawing')?.url || null,
    post_date: selectedDate,  
  };

  //insert the diary entry to the database
  const { data: diaryData, error: diaryError } = await supabase
    .from('diary_posts')
    .insert([uploadEntry]);

  if (diaryError) {
    console.error("Error saving diary entry:", diaryError);
    return;
  }

  const newEntry: DiaryEntry = {
    titel: postTitel,
    text: postText,
    image: uploadedMedia.image_url,
    video: uploadedMedia.video_url,
    drawing: uploadedMedia.drawing_url,
    date: selectedDate,
  };
  
  // Save the entry to local diary state
  setDiary(prevDiary => [...(prevDiary || []), newEntry]);

  // Reset modal fields
  setPostTitel('');
  setPostText('');
  setSelectedImage(null);
  setSelectedVideo(null);
  setDrawing(null);
  setDrawingPreview(null);
  setSelectedDate(new Date());

  /*  await fetchUserEntries(); */
  setRemountKey((prevKey) => prevKey + 1);
  // Close modal
  setIsModalVisible(false);
};

const fetchAllEntries = async () => {
  fetchUserEntries(false);
  setLoadedAll(true);
}
const fetchFewerEntries = async () => {
  setDiary(null);
  fetchUserEntries(true);
  setLoadedAll(false);
}

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
              
              {/*drawing modal */}
              {isDrawingMode && (
                <Modal
                visible={isModalVisible}
                transparent={false}
                animationType="slide"
                onRequestClose={() => setIsDrawingMode(false)}
              >
                <Draw
                  style={{ height: '100%', width: '100%' }}
                  onSave={(snapshot) => handleSaveDrawing(snapshot)}
                  strokeColor={'black'}
                  strokeWidth={5}
                  onClose={() => setIsDrawingMode(false)}
                />
                </Modal>
              )}
              
              
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
        {diary?.map((entry, index) => (
          <View key={index} className='flex flex-col items-start justify-start border border-black w-full bg-slate-100 p-4 my-4'>
            <Typography variant='black' weight='700' size='md'>{entry.titel}</Typography>
            <Typography variant='black' weight='500' size='md'>{entry.text}</Typography>
            {entry.date ? (
              <Typography variant='black' size='sm'>{new Date(entry.date).toLocaleDateString()}</Typography>
            ) : (
              <Typography variant='black' size='sm'>Inget datum har angivits</Typography>
            )}
            <DisplayEntryMedia entry={entry} />           
          </View>
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