import React from 'react';
import { Typography } from '@/components';
import { View, ScrollView } from 'react-native';

export default function Questions() {

  return(
    <ScrollView className='bg-vgrBlue'>
    <View className='flex-1 items-center justify-center'>
      <Typography variant='black' size='xl' weight='700' className='text-white'>Mina frågor till vården</Typography>
    </View>
  </ScrollView>
  );
}