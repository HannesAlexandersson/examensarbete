import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Button, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function App() {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [flashMode, setFlashMode] = useState('off');
  const [type, setType] = useState('photo');

  if (!permission) {
    // Camera permissions are still loading.
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet.
    return (
      <View style={styles.container}>
        <Text style={styles.message}>We need your permission to show the camera</Text>
        <Button onPress={requestPermission} title="grant permission" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  }

  // Function to toggle between photo and video modes
  const toggleCameraMode = () => {
    setType((prevType) => (prevType === 'photo' ? 'video' : 'photo'));
  };
  
  // Function to take a photo
  const takePhoto = async () => {
   /*  if (type === 'photo') {
      const photo = await CameraView.takePhotoAsync();
      console.log(photo);
    } */
   console.log('Photo taken');
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
      return <Ionicons name="infinite-sharp" size={50} color="white" />;
    } else {
      return <Ionicons name="flash-outline" size={50} color="white" />;
    }
  };
  return (
    
      <CameraView style={{ flex: 1}} facing={facing}>
        <View className='flex-1 justify-end'>
          <View className='absolute top-10 left-0 pl-2'>
            <TouchableOpacity onPress={toggleFlashMode}>
              {renderFlashIcon()}
            </TouchableOpacity>
          </View>
          <View className='flex-row items-center justify-around mb-10'>
           {/*Conditional rendering of the camera mode buttons */ }
          {type === 'photo' ? (            
            <TouchableOpacity className='items-end justify-end' onPress={toggleCameraMode}>
              <Ionicons name="videocam" size={50} color="white" />
            </TouchableOpacity>
          ) : (            
            <TouchableOpacity className='items-end justify-end' onPress={toggleCameraMode}>
              <Ionicons name="camera-sharp" size={50} color="white" />
            </TouchableOpacity>
          )}
          
          
          {type === 'video' ? ( isRecording ? (
            <TouchableOpacity className='items-end justify-end' onPress={() => setIsRecording(false)}>
              <Ionicons name="pause-circle" size={100} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity className='items-end justify-end' onPress={() => setIsRecording(true)}>
              <Ionicons name="radio-button-on" size={100} color="red" />
            </TouchableOpacity>
          )
        ) : (
          <TouchableOpacity className='items-end justify-end' onPress={takePhoto}>
              <Ionicons name="radio-button-on" size={100} color="white" />
            </TouchableOpacity>
        )}
          
          <TouchableOpacity className='items-end justify-end' onPress={toggleCameraFacing}>
            <Ionicons name="camera-reverse" size={50} color="white" />
          </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
  },
  camera: {
    flex: 1,
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'transparent',
    margin: 64,
  },
  button: {
    flex: 1,
    alignSelf: 'flex-end',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
});