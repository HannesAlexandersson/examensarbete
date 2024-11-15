import React, { useState } from 'react';
import { useAuth } from "@/providers/AuthProvider";
import { ScrollView, View, Image, TouchableOpacity, FlatList } from "react-native";
import { router } from 'expo-router';
import { Button, Typography, VideoThumbnail } from '@/components';
import { supabase } from '@/utils/supabase';
import { mediaDataProps } from '@/utils/types';
import { useMediaStore, useUserStore } from '@/stores';



export default function Album() {
  const { user } = useAuth();
  const { 
    userMediaFiles, 
    selectedMedia, 
    setSelectedMedia,
    mediaData,
    setMediaData,
    handleSelect,
    setGetPhotoForAvatar
   } = useMediaStore();
  const { id } = useUserStore();

  /* const [selectedMedia, setSelectedMedia] = useState<string | null>(null); */  
  /* const [mediaData, setMediaData] = React.useState<mediaDataProps>({
    images: [],
    videos: [],
    drawings: []
 }); */
 
  React.useEffect(() => {
    // Create a new AbortController instance for each fetch request to handle memory leaks
    const controller = new AbortController();
    if(!user) return;

    
    fetchAllMedia(user.id as string, controller);
    //cleanup on unmount
    return () => {
      setMediaData({ images: [], drawings: [], videos: [] });
    };
  }, []);

  
  const MemoizedImage = React.memo(({ uri }: { uri: string } ) => (
    <Image source={{ uri }} style={{ width: 128, height: 128, resizeMode: 'cover' }} />
  ));

  const fetchuserDrawings = async (id: string, controller: any) => {
    if (!id) {
      console.error('User ID is missing');
      return;
    }
  
    try {      
      const { data: drawingRecords, error: drawingError } = await supabase
        .from('Drawings') 
        .select('*')
        .eq('user_id', id)
        .abortSignal(controller.signal); 
  
      if (drawingError) {
        console.error('Error fetching drawings from the database:', drawingError);
        return;
      }
  
      if (!drawingRecords || drawingRecords.length === 0) {
        console.log('No drawings found for this user.');
        return;
      }
      
      const drawingUrls = await Promise.all(
        drawingRecords.map(async (drawing) => {
          const { drawing_uri } = drawing;
          
          const { data: fileUrl } = supabase
            .storage
            .from('drawings')  
            .getPublicUrl(drawing_uri);  
  
            if (!fileUrl.publicUrl) {
              console.error('Failed to fetch public URL');
              return;
            }          
  
          return fileUrl.publicUrl; 
        })
      );
  
      const validUrls = drawingUrls.filter(Boolean) as string[]; 
      
      return validUrls;
  
    } catch (error: any) {
      if(error.name === 'AbortError') {
        console.log('Fetch aborted:', error);

      }else{
        console.error('Error fetching user drawings:', error);
      }
    } 
  }
  
  const fetchUserImages = async (id: string, controller: any) => {
    //first check if user is logged in
    if (!id) {
      console.error('User ID is missing');
      return;
    }
  
    try {      
      const { data: imageRecords, error: imageError } = await supabase
        .from('Images') 
        .select('*')
        .eq('user_id', id)
        .abortSignal(controller.signal);
  
      if (imageError) {
        console.error('Error fetching images from the database:', imageError);
        return;
      }
  
      if (!imageRecords || imageRecords.length === 0) {
        console.log('No images found for this user.');
        return;
      }
      
      const mediaUrls = await Promise.all(
        imageRecords.map(async (image) => {
          const { image_uri } = image;
  
          // Fetch the public URL from the pictures bucket using image_uri from 'profiles'
          const { data: fileUrl } = supabase
            .storage
            .from('pictures')  
            .getPublicUrl(image_uri); 
  
            if (!fileUrl.publicUrl) {
              console.error('Failed to fetch public URL');
              return;
            }          
  
          return fileUrl.publicUrl; //return with the valid public URL
        })
      );
  
      const validUrls = mediaUrls.filter(Boolean) as string[]; //filter out non valids
      

     return validUrls;
  
    } catch (error: any) {
      if(error.name === 'AbortError') {
        console.log('Fetch aborted:', error);
      }else{
      console.error('Error fetching user images:', error);
    } 
  }
};
  
  const fetchUserVideos = async (id: string, controller: any) => {    
    if (!id) {
      console.error('User ID is missing');
      return;
    }
  
    try {      
      const { data: videoRecords, error: videoError } = await supabase
        .from('videos') 
        .select('*')
        .eq('user_id', id)
        .abortSignal(controller.signal);
  
      if (videoError) {
        console.error('Error fetching videos from the database:', videoError);
        return;
      }
  
      if (!videoRecords || videoRecords.length === 0) {
        console.log('No videos found for this user.');
        return;
      }
      
      const videoUrls = await Promise.all(
        videoRecords.map(async (video) => {
          const { video_uri } = video;
          
          const { data: fileUrl } = supabase
            .storage
            .from('videos')  
            .getPublicUrl(video_uri);  
  
            if (!fileUrl.publicUrl) {
              console.error('Failed to fetch public URL');
              return;
            }          
  
          return fileUrl.publicUrl; 
        })
      );
  
      const validUrls = videoUrls.filter(Boolean) as string[]; 
      

     return validUrls;
  
    } catch (error: any) {
      if(error.name === 'AbortError') {
        console.log('Fetch aborted:', error);
      }else{
        console.error('Error fetching user videos:', error);
      }
    }
  }; 
  
  
  
  const handleSelectMedia = (mediaUrl: string | null) => {    
    if (mediaUrl) { // Check if mediaUrl is not null
      console.log('Selected media:', mediaUrl);
      userMediaFiles({ file: mediaUrl }); // Call the storefunction
      
      router.back(); //return the user to the previous screen
    } else {
      alert('Du har inte valt någon fil!');
    }
  };  

  /* const handleSelect = (fileUrl: string) => {
    setSelectedMedia((prevSelected) => (prevSelected === fileUrl ? null : fileUrl));
  }; */

  const fetchAllMedia = async (userId: string, controller: any) => {
    const [images, drawings, videos] = await Promise.all([
      fetchUserImages(userId, controller),
      fetchuserDrawings(userId, controller),
      fetchUserVideos(userId, controller),
    ]); 
    
    setMediaData({ images, drawings, videos } as mediaDataProps);
  };

  
  return (
    <ScrollView>
      <View className="flex-1 items-center justify-center bg-white pt-8">
      <View className="flex-row justify-around w-full px-4 pb-4">
        <Button variant='black' size='sm' onPress={() => router.back()} >
          <Typography variant='white' weight='400' size='sm' className='uppercase'>Tillbaka</Typography>
        </Button>
        <Button variant='outlined' size='sm' onPress={() => handleSelectMedia(selectedMedia)} >
          <Typography variant='black' weight='400' size='sm' className='uppercase'>Välj media</Typography>
        </Button>
      </View>
      <View className='flex-1 flex-col justify-between items-start gap-2 px-8 my-4'>
      <Typography variant='black' weight='700' size='h1' className='text-start'>Foton</Typography>
      <View className='flex-row'>
        {mediaData.images ? (
          <FlatList
            data={mediaData.images}
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => handleSelect(item)}>
                <View className={`relative mb-4 ${selectedMedia === item ? 'border-2 border-blue-500 px-1' : 'px-1'}`}>
                  <MemoizedImage uri={item} />
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item}
            initialNumToRender={5}
            windowSize={10}
            removeClippedSubviews={true}
            horizontal={true}
          />
        ) :(
          <Typography variant='black' weight='400' size='sm'>Inga foton hittades</Typography>
        )}
      </View>
      <Typography variant='black' weight='700' size='h1' className='text-start'>Målningar</Typography>
      <View className='flex-row'>
        {mediaData.drawings ? (
          <FlatList
            data={mediaData.drawings}
            renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleSelect(item)}>
              <View className={`relative mb-4 ${selectedMedia === item ? 'border-2 border-blue-500 px-1' : 'px-1'}`}>
                <MemoizedImage uri={item} />
              </View>
            </TouchableOpacity>
          )}
            keyExtractor={(item) => item}
            initialNumToRender={5}
            windowSize={10}
            removeClippedSubviews={true}
            horizontal={true}
          />
        ) :(
          <Typography variant='black' weight='400' size='sm'>Inga målningar hittades</Typography>
        )}
      </View>
      <Typography variant='black' weight='700' size='h1' className='text-start'>Vidor</Typography>
      <View className='flex-row mb-4'>
        {mediaData.videos ? (
        <FlatList        
          data={mediaData.videos}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => handleSelect(item)}>
              <View className={`relative mb-4 ${selectedMedia === item ? 'border-2 border-blue-500 px-1' : 'px-1'}`}>
                <VideoThumbnail videoUri={item} />
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item}
          initialNumToRender={5}
          windowSize={10}
          removeClippedSubviews={true}
          horizontal={true}
        />
         ) : (
          <Typography variant='black' weight='400' size='sm'>Inga videos hittades</Typography>
        )}
        </View>
      </View>
    </View>
  </ScrollView>
  );
}