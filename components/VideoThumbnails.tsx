import React, { useState, useEffect } from 'react';
import { View, Image } from 'react-native';
import * as VideoThumbnails from 'expo-video-thumbnails';

//creates a single image from the users video
export default function VideoThumbnail({videoUri}: {videoUri: string}) {
  const [thumbnail, setThumbnail] = useState<string | null>(null);

  useEffect(() => {
    console.log('videoUri');
    const getThumbnail = async () => {
      const { uri } = await VideoThumbnails.getThumbnailAsync(videoUri, {
        time: 1000,//the image will be taken at 1 second into the video
      });
      setThumbnail(uri);
    }

    getThumbnail();
  }, []);
  //the uri is passed to the memoized image component wich will only rerender if the uri changes
  const MemoizedImage = React.memo(({ uri }: { uri: string } ) => (
    <Image source={{ uri }} style={{ width: 100, height: 100, resizeMode: 'cover' }} />
  ));
  return(    
      <>
        {thumbnail && (
          <MemoizedImage uri={thumbnail} />
        )}
      </>
  )
}
    