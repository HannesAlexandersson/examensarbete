import React, { useEffect, useState } from 'react';
import { useAuth } from "@/providers/AuthProvider";
import { ScrollView, View, Image, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { supabase } from '@/utils/supabase';
import { router } from 'expo-router';
import { Button, Typography, VideoThumbnail } from '@/components';

export default function album() {
  const { user, userMediaFiles } = useAuth();

  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);  
  const [mediaFiles, setMediaFiles] = useState<string[]>([]);
  const [videoFiles, setVideoFiles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserImages = async () => {
    //first check if user is logged in
    if (!user?.id) {
      console.error('User ID is missing');
      return;
    }

    try {      
      const { data: imageRecords, error: imageError } = await supabase
        .from('Images') 
        .select('*')
        .eq('user_id', user.id); // Match user objects ID from the context with id of the images in the DB

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
      setMediaFiles(validUrls); //store image urls in the media state

    } catch (error) {
      console.error('Error fetching user images:', error);
    } finally {
      setLoading(false);
    }
  };

  //fetch the user videos same way as images
  const fetchUserVideos = async () => {    
    if (!user?.id) {
      console.error('User ID is missing');
      return;
    }

    try {      
      const { data: videoRecords, error: videoError } = await supabase
        .from('videos') 
        .select('*')
        .eq('user_id', user.id); 

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
      setVideoFiles(validUrls); 

    } catch (error) {
      console.error('Error fetching user videos:', error);
    } finally {
      setLoading(false);
    }
  };

  //call the fetch functions on mount
  useEffect(() => {
    fetchUserImages();
    fetchUserVideos();
  }, []);
  
  const handleSelectMedia = (mediaUrl: string | null) => {    
    if (mediaUrl) { // Check if mediaUrl is not null
      console.log('Selected media:', mediaUrl);
      userMediaFiles({ file: mediaUrl }); // Call the context/state management function      
      router.back(); 
    } else {
      console.log('No media selected');
    }
  };  

  const handleSelect = (fileUrl: string) => {
    setSelectedMedia((prevSelected) => (prevSelected === fileUrl ? null : fileUrl));
  };
  
  if (loading) {
    return (
      <View className='flex-1 items-center justify-center'>
        <ActivityIndicator size="large" color="#0000ff" /> 
        <Typography variant='black' weight='700' className='text-3xl '>Laddar...</Typography> 
      </View>
    );
  }
  
  return (
    <View className="flex-1 items-center justify-center bg-white pt-8">
      <View className="flex-row justify-around w-full px-4 pb-4">
        <Button variant='black' size='sm' onPress={() => router.back()} >
          <Typography variant='white' weight='400' size='sm' className='uppercase'>Tillbaka</Typography>
        </Button>
        <Button variant='outlined' size='sm' onPress={() => handleSelectMedia(selectedMedia)} >
          <Typography variant='black' weight='400' size='sm' className='uppercase'>Välj media</Typography>
        </Button>
      </View>
  <ScrollView className="flex-1 px-4 mt-4">
    <Typography variant='black' weight='700' size='h1'>Foton</Typography>
    <View className="flex-row flex-wrap justify-between">
      {mediaFiles.map((fileUrl, index) => (
        <TouchableOpacity 
          key={index}                 
          onPress={() => handleSelect(fileUrl)} 
        >
          <View className={`relative mb-4 ${selectedMedia === fileUrl ? 'border-2 border-blue-500' : ''}`}>
            <Image
              source={{ uri: fileUrl }}
              className={`w-32 h-32 `} 
              style={{ resizeMode: 'cover' }}
            />
            {selectedMedia === fileUrl && ( 
              <View className="absolute inset-0 h-full w-full flex items-center justify-center bg-black opacity-50">
                <Typography variant='white' weight='700'>Vald</Typography>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  </ScrollView>

  <ScrollView className="flex-1 px-4">
    <Typography variant='black' weight='700' size='h1'>Videos</Typography>
    <View className="flex-row flex-wrap justify-between">
      {videoFiles.map((fileUrl, index) => (
        <TouchableOpacity 
          key={index}                 
          onPress={() => handleSelect(fileUrl)} 
        >
          <View className={`relative mb-4 ${selectedMedia === fileUrl ? 'border-2 border-blue-500' : ''}`}>
           
             <VideoThumbnail videoUri={fileUrl} />                  
            {selectedMedia === fileUrl && ( 
              <View className="absolute inset-0 h-full w-full flex items-center justify-center bg-black opacity-50">
                <Typography variant='white' weight='700'>Vald</Typography>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  </ScrollView>
</View>
  );
}