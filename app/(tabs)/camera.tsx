import { CameraView, CameraType, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import React, { useState, useEffect } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, Text, View, TouchableOpacity } from 'react-native';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/providers/AuthProvider';


type CameraMode = 'picture' | 'video';

export default function App() {
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

  const handlePermission = async () => {
    const cameraResponse = await requestPermission();
    const micResponse = await requestMicPermission();

    if (!cameraResponse.granted || !micResponse.granted) {
      alert('Både kamera och mikrofon behöver tillåtelse för att appen ska fungera');
    }
  };

  useEffect(() => {
    // Check permissions when the component mounts
    handlePermission();
  }, []);

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted && !micPermission?.granted) {
    // Camera permissions are not granted yet.
    return (
      <View className='flex-1 justifyContent-center'>
        <Text className='text-center pb-10'>Du måste ge appen tillåtelse att använda kameran för att ta kort</Text>
        <Button onPress={handlePermission} title="grant permission" />
      </View>
    );
  }

  

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  // Function to toggle between photo and video modes
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

  //function to save the video in the supabase bucket
  const saveVideo = async() => {
   
   const formData = new FormData();
   const fileName = videoUri?.split('/').pop();
    formData.append('file', {
      uri: videoUri,
      type: `video/${fileName?.split('.').pop()}`,
      name:fileName,
    });

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
      title: "test",
    });
    if(videoError) console.error(videoError);
    }
  

  //function to save the photo
  const savePhoto = () => {
    console.log('Photo saved', photoUri);
  };
  //function to take a photo
  const takePhoto = async () => {
    if (type === 'picture') {
      const photo = await cameraRef.current?.takePictureAsync();
      setPhotoUri(photo?.uri);
    }   
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
  return (
    
      <CameraView mode={type} ref={cameraRef} style={{ flex: 1}} facing={facing}>
        <View className='flex-1 justify-end'>
          <View className='absolute top-10 left-0 pl-2'>
            <TouchableOpacity onPress={toggleFlashMode}>
              {renderFlashIcon()}
            </TouchableOpacity>
          </View>
          <View className='flex-row items-center justify-around mb-10'>
           {/*Conditional rendering of the camera mode buttons */ }
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
                <TouchableOpacity className='items-end justify-end' onPress={saveVideo}>
                  <Ionicons name="checkmark-circle" size={100} color="white" />
                </TouchableOpacity>
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
                <TouchableOpacity className='items-end justify-end' onPress={savePhoto}>
                  <Ionicons name="checkmark-circle" size={100} color="white" />
                </TouchableOpacity>                
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

