import React, { useState, useRef, useEffect } from 'react';
import { View, Image, Button } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { DiaryEntry } from '@/utils/types';


export default function DisplayEntryMedia({ entry }: { entry: DiaryEntry }) {
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [status, setStatus] = useState({});
  const video = useRef(videoFile);

  useEffect(() => {
    if(entry.video) {
      setVideoFile(entry.video);
    }
  }, []);
  return (
    <View className='flex-1 flex-col gap-1 w-full'>
            {entry.image && <Image source={{ uri: entry.image }} style={{ width: 100, height: 100, marginTop: 10 }} />}
            {entry.video && 
            <Video
              ref={videoFile}
              style={{ width: 100, height: 100, marginTop: 10 }}
              source={{ uri: entry.video }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              isMuted={true}              
              onPlaybackStatusUpdate={status => setStatus(() => status)}
            />               
            }            
              
            {entry.drawing && <Image source={{ uri: entry.drawing }} style={{ width: 100, height: 100, marginTop: 10 }} />}
    </View>
  );
}