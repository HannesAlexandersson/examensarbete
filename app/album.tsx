import React, { useEffect, useState } from 'react';
import { useAuth } from "@/providers/AuthProvider";
import { ScrollView, View, FlatList, Image, TouchableOpacity, Text, ActivityIndicator } from "react-native";
import { supabase } from '@/utils/supabase';
import { router, SearchParams } from 'expo-router';
import VideoThumbnail  from '@/components/VideoThumbnails';

export default function album() {
  const { user, userMediaFiles } = useAuth();

  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  /* const [selectedMedia, setSelectedMedia] = useState<string[]>([]); */
  /* const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [selectedVideos, setSelectedVideos] = useState<string[]>([]); */
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

          // Fetch the public URL from the pictures bucket using _uri
          const { data: fileUrl } = supabase
            .storage
            .from('pictures')  // pictures bucket
            .getPublicUrl(image_uri);  // Use the _uri to fetch the image

            if (!fileUrl.publicUrl) {
              console.error('Failed to fetch public URL');
              return;
            }          

          return fileUrl.publicUrl; // Return the valid URL
        })
      );

      const validUrls = mediaUrls.filter(Boolean) as string[]; // Filter out nulls
      setMediaFiles(validUrls); // Store media URLs in the state

    } catch (error) {
      console.error('Error fetching user images:', error);
    } finally {
      setLoading(false);
    }
  };

  //fetch the user videos
  const fetchUserVideos = async () => {
    //first check if user is logged in
    if (!user?.id) {
      console.error('User ID is missing');
      return;
    }

    try {      
      const { data: videoRecords, error: videoError } = await supabase
        .from('videos') 
        .select('*')
        .eq('user_id', user.id); // Match user objects ID from the context with id of the videos in the DB

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

          // Fetch the public URL from the videos bucket using _uri
          const { data: fileUrl } = supabase
            .storage
            .from('videos')  // videos bucket
            .getPublicUrl(video_uri);  // Use the _uri to fetch the video

            if (!fileUrl.publicUrl) {
              console.error('Failed to fetch public URL');
              return;
            }          

          return fileUrl.publicUrl; // Return the valid URL
        })
      );

      const validUrls = videoUrls.filter(Boolean) as string[]; // Filter out nulls
      setVideoFiles(validUrls); // Store video URLs in the state

    } catch (error) {
      console.error('Error fetching user videos:', error);
    } finally {
      setLoading(false);
    }
  };

  //call the function on mount
  useEffect(() => {
    fetchUserImages();
    fetchUserVideos();
  }, []);

  // Handling media selection
  const handleSelectMedia = (mediaUrl: string | null) => {    
    if (mediaUrl) { // Check if mediaUrl is not null
      console.log('Selected media:', mediaUrl);
      userMediaFiles({ file: mediaUrl }); // Call your context/state management function      
      router.back(); // Navigate back to the previous screen
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
        <Text className='font-bold text-3xl text-black'>Laddar...</Text> 
      </View>
    );
  }
  
  return (
    <View className="flex-1 items-center justify-center bg-white pt-12">
      <TouchableOpacity className='bg-white border border-black rounded-lg px-2 py-2' onPress={() => handleSelectMedia(selectedMedia)} >
        <Text className='text-black font-roboto font-normal text-[14px] uppercase'>Välj media</Text>
      </TouchableOpacity>
  <ScrollView className="flex-1 px-4">
    <Text className="font-bold text-3xl text-black font-roboto mb-4">Foton</Text>
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
                <Text className="text-white font-bold">Vald</Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  </ScrollView>

  <ScrollView className="flex-1 px-4">
    <Text className="font-bold text-3xl text-black font-roboto mb-4">Videos</Text>
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
                <Text className="text-white font-bold">Vald</Text>
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