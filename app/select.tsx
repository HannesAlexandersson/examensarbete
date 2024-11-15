import { Button, Typography } from '@/components';
import React from 'react';
import { ScrollView, Text } from 'react-native';

export default function SelectFromAlbum() {

  const handleToAlbum = () => {
    // Navigate to album
  }

  return (
    <ScrollView>
     <Typography variant='black' size='h3'>Select from album</Typography>
     <Button variant='blue' size='lg' className='my-4' onPress={handleToAlbum}>Till album</Button>
    </ScrollView>
  );
}