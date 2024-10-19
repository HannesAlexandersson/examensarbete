import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import React, { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Text, View, TouchableOpacity } from 'react-native';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/providers/AuthProvider';
import { useRouter } from 'expo-router';
import { CameraMode } from '@/utils/types';

export default function Camera() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [flashMode, setFlashMode] = useState('off');
  const [type, setType] = useState<CameraMode>('picture');
  const cameraRef = React.useRef<CameraView>(null);
  const [videoUri, setVideoUri] = useState<string | undefined>(undefined);
  const [photoUri, setPhotoUri] = useState<string | undefined>(undefined);
  const { user } = useAuth();
  const router = useRouter();

  const handlePermission = async () => {
    const cameraResponse = await requestPermission();
    const micResponse = await requestMicPermission();

    if (!cameraResponse.granted || !micResponse.granted) {
      alert('Både kamera och mikrofon behöver tillåtelse för att appen ska fungera');
    }
  };

  useEffect(() => {
    //check permissions on mount
    handlePermission();
  }, []);

  if (!permission) {
    //camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted && !micPermission?.granted) {
    //camera permissions are not granted yet.
    return (
      <View className='flex-1 justifyContent-center'>
        <Text className='text-center pb-10'>Du måste ge appen tillåtelse att använda kameran för att ta kort</Text>
        <Button onPress={handlePermission} title="grant permission" />
      </View>
    );
  }

  
  //toggle between front and back camera
  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  //toggle between photo and video modes
  const toggleCameraMode = () => {
    setType((prevType) => (prevType === 'picture' ? 'video' : 'picture' as CameraMode));
  };  

  //function torecording  video
  const recordVideo = async () => {
    if (isRecording) {      
      setIsRecording(false);
      cameraRef.current?.stopRecording();
    } else {      
      setIsRecording(true);
      const video = await cameraRef.current?.recordAsync();
      setVideoUri(video?.uri);
    }
  }

//save the video in the supabase bucket
const saveVideo = async() => {
  
  const formData = new FormData();
  const fileName = videoUri?.split('/').pop() || 'default-video-name.jpg';
  formData.append('file', {
    uri: videoUri,
    type: `video/${fileName?.split('.').pop()}`,
    name:fileName,
  } as any);//as any to avoid type error, because it expects an blob but it works perfectly fine with the file object. So instead of converting it to blob and base64 and all that simply cast it as any.

  const { data, error } = await supabase.storage
    .from('videos')
    .upload(fileName, formData, {
      cacheControl: '3600000000',
      upsert: false,
    });

  if(error) console.error(error);    

  const { error: videoError } = await supabase.from('videos').insert({
    video_uri: data?.path,
    user_id: user?.id,
    title: "default-video-title",
  });

  if(videoError) console.error(videoError);
  router.back();
}
  

  
//function to take a photo
const takePhoto = async () => {
  if (type === 'picture') {
    const photo = await cameraRef.current?.takePictureAsync();
    setPhotoUri(photo?.uri);
  }   
};

//save the photo
const savePhoto = async() => {
  const formData = new FormData();
  const PicturefileName = photoUri?.split('/').pop() || 'default-picture-name.jpg';
  formData.append('file', {
    uri: photoUri,
    type: `image/${PicturefileName?.split('.').pop()}`,
    name: PicturefileName,
  } as any);
  //save to bucket
  const { data, error } = await supabase.storage
    .from('pictures')
    .upload(PicturefileName, formData, {
      cacheControl: '3600000000',
      upsert: false,
    });
  if(error) console.error(error);
  //save to database 'image' table
  const { error: photoError } = await supabase.from('Images').insert({
    image_uri: data?.path,
    user_id: user?.id,
    title: "default-image-title",
  });
  if(photoError) console.error(photoError);

  router.back();
};

//cycle through the flash modes
const toggleFlashMode = () => {
  setFlashMode((prevMode) => {
    if (prevMode === 'off') return 'on';
    if (prevMode === 'on') return 'auto';
    return 'off'; //reset to 'off' if it was on 'ayto'
  });
};

//get the correct flashicon based on the flash mode
const renderFlashIcon = () => {
  if (flashMode === 'on') {
    return <Ionicons name="flash" size={50} color="yellow" />;
  } else if (flashMode === 'auto') {
    return <Text className='font-bold text-white text-sm pl-4 pt-4'>AUTO</Text>;
  } else {
    return <Ionicons name="flash-outline" size={50} color="white" />;
  }
};

//if the user doenst want to save the media, cleanse all the states
const discardMedia = () => {
  setVideoUri(undefined);
  setPhotoUri(undefined);
  setIsRecording(false);
};


return (    
      <CameraView mode={type} ref={cameraRef} style={{ flex: 1}} facing={facing}>
        <View className='flex-1 justify-end'>
          <View className='absolute top-10 left-0 pl-2'>
            <TouchableOpacity onPress={toggleFlashMode}>
              {renderFlashIcon()}
            </TouchableOpacity>
            
          </View>
          <View className='absolute top-10 right-0 pr-4'>
            <TouchableOpacity onPress={() => router.push('/album')}>
              <Ionicons name="albums-outline" size={34} color="white" />
            </TouchableOpacity>
          </View>
          <View className='flex-row items-center justify-around mb-10'>           
          {type === 'picture' ? (            
            <TouchableOpacity className='items-end justify-end' onPress={toggleCameraMode}>
              <Ionicons name="videocam" size={50} color="white" />
            </TouchableOpacity>
          ) : (            
            <TouchableOpacity className='items-end justify-end' onPress={toggleCameraMode}>
              <Ionicons name="camera-sharp" size={50} color="white" />
            </TouchableOpacity>
          )}
          
          {type === 'video' ? ( 
            <>
              {videoUri ? (
                <>
                  <TouchableOpacity className='items-end justify-end' onPress={saveVideo}>
                    <Ionicons name="checkmark-circle" size={65} color="green" />
                  </TouchableOpacity>

                  <TouchableOpacity className='items-end justify-end' onPress={discardMedia}>
                    <Ionicons name="close-circle" size={65} color="red" />
                  </TouchableOpacity>
                </>
                ) : (
                <TouchableOpacity className='items-end justify-end' onPress={recordVideo}>
                  {isRecording ? <Ionicons name="pause-circle" size={100} color="white" /> : <Ionicons name="radio-button-on" size={100} color="red" />}
                </TouchableOpacity>
                )
              }
            </>         
            ) : (
            <>
              {photoUri ? (
                <>
                  <TouchableOpacity className='items-end justify-end' onPress={savePhoto}>
                    <Ionicons name="checkmark-circle" size={65} color="green" />
                  </TouchableOpacity> 
                  
                  <TouchableOpacity className='items-end justify-end' onPress={discardMedia}>
                      <Ionicons name="close-circle" size={65} color="red" />
                  </TouchableOpacity>
                </>
                ) : (
                <TouchableOpacity className='items-end justify-end' onPress={takePhoto}>
                  <Ionicons name="radio-button-on" size={100} color="white" />
                </TouchableOpacity>
                )
              }
            </>              
          )}
          
          <TouchableOpacity className='items-end justify-end' onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={50} color="white" />
          </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    
  );
}

