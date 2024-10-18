import React from 'react';
import { Typography } from '@/components';
import { View, ScrollView } from 'react-native';

export default function Diagnosis() {

  return(
    <ScrollView className='bg-white'>
    <View className='flex-1 items-center justify-center'>
      <Typography variant='black' size='xl' weight='700' className='text-white'>Min Diagnos</Typography>
    </View>
  </ScrollView>
  );
}