import React from 'react';
import * as ImagePicker from 'expo-image-picker';
import Button from '@/components/ButtonVariants';
import Typography from '@/components/Typography';
import { MediaPickerProps } from '@/utils/types';

//Component to pick an image or video from the device to use in the app
export default function MediaPicker({ setSelectedImage, setSelectedVideo }: MediaPickerProps) {

  //open Image Picker to select image or video
  const pickImageOrVideo = async () => {
    const mediaResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!mediaResult.canceled && mediaResult.assets.length > 0) {
      const asset = mediaResult.assets[0];
      //set the states that are managed in the parent component
      if (asset.type === 'image') {
        setSelectedImage(asset.uri);
      } else if (asset.type === 'video') {
        setSelectedVideo(asset.uri);
      }
    }
  };

  return(
    <Button variant='blue' size='sm' onPress={pickImageOrVideo}>
      <Typography variant='white' weight='700' size='sm'>Lägg till Bild/Video</Typography>
    </Button>
  );
}