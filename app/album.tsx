import React from 'react';
import { useAuth } from "@/providers/AuthProvider";
import { ScrollView, View, Image, TouchableOpacity, FlatList } from "react-native";
import { router } from 'expo-router';
import { Button, Typography, VideoThumbnail } from '@/components';
import { mediaDataProps } from '@/utils/types';
import { useMediaStore, useUserStore } from '@/stores';
import { fetchUserImages, fetchuserDrawings, fetchUserVideos } from '@/lib/apiHelper';



export default function Album() {
  //global states
  const { user } = useAuth();
  const { 
    userMediaFiles, 
    selectedMedia,     
    mediaData,
    setMediaData,
    handleSelect,    
   } = useMediaStore();

  const { id } = useUserStore();  
 

  React.useEffect(() => {
    //create a new AbortController instance for each fetch request to handle memory leaks
    const controller = new AbortController();
    if(!user) return;
    
    fetchAllMedia(id as string, controller);
    //cleanup on unmount
    return () => {
      setMediaData({ images: [], drawings: [], videos: [] });
    };
  }, []);

  
  const MemoizedImage = React.memo(({ uri }: { uri: string } ) => (
    <Image source={{ uri }} style={{ width: 128, height: 128, resizeMode: 'cover' }} />
  ));
  
  const handleSelectMedia = (mediaUrl: string | null) => {    
    if (mediaUrl) { 
      console.log('Selected media:', mediaUrl);
      userMediaFiles({ file: mediaUrl }); 

      //return the user to the previous screen
      router.back(); 
    } else {
      alert('Du har inte valt någon fil!');
    }
  };    

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