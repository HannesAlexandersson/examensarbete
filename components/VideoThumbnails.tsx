import React, { useState, useEffect } from 'react';
import { View, Image } from 'react-native';
import * as VideoThumbnails from 'expo-video-thumbnails';

export default function VideoThumbnail({videoUri}: {videoUri: string}) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    const getThumbnail = async () => {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 15000,
      });
      setThumbnail(uri);
    }

    getThumbnail();
  }, []);

  return(    
      <View >
        {thumbnail && (
          <Image
            source={{ uri: thumbnail }}
            className='w-32 h-32'
          />
        )}
      </View>
  )
}
    