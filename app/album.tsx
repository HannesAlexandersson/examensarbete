import React, { useState } from 'react';
import { useAuth } from "@/providers/AuthProvider";
import { ScrollView, View, Image, TouchableOpacity } from "react-native";
import { router } from 'expo-router';
import { Button, Typography, VideoThumbnail } from '@/components';

export default function Album() {
  const { 
    user, 
    userMediaFiles, 
    drawingFiles, 
    setDrawingFiles, 
    mediaFiles, 
    setMediaFiles, 
    videoFiles, 
    setVideoFiles 
  } = useAuth();

  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);  
  
  
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
      <ScrollView className="flex-1 px-8 my-4">
        <Typography variant='black' weight='700' size='h1' className='text-start'>Foton</Typography>
        <View className="flex-row flex-wrap justify-between gap-1">
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

      <ScrollView className="flex-1 px-8 my-4">
        <Typography variant='black' weight='700' size='h1' className='text-start'>Teckningar</Typography>
        <View className="flex-row flex-wrap justify-between gap-1">
          {drawingFiles.length === 0 && (
            <Typography variant='black' weight='400' size='sm'>Inga teckningar hittades</Typography>
          )}
          {drawingFiles.map((fileUrl, index) => (
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

      <ScrollView className="flex-1 px-8 my-4">
        <Typography variant='black' weight='700' size='h1' className='text-start'>Videos</Typography>
        <View className="flex-row flex-wrap justify-between gap-1">
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