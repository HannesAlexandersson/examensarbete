import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView   } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';




export default function EditProfile() {
  const { user, editUser, userAvatar } = useAuth();
  const [id, setId] = useState(user?.id || '');
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [dateOfBirth, setDateOfBirth] = useState<Date>(user?.date_of_birth || new Date('2010-12-24'));
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [userDescription, setUserDescription] = useState(user?.description || '');
 

  // State for DatePicker
  const [showDatePicker, setShowDatePicker] = useState(false);

  // State for ImagePicker
  const [image, setImage] = useState<string | null>(null);

  // Function to handle date change from DatePicker
  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };


  // Function to handle image picking
  const pickImage = async () => {
    // Ask for permission to access media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access media library is required!');
      return;
    }

    // Open image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setAvatarUrl(result.assets[0].uri); // Set to avatar URL
    }
  };

  // Function to handle taking a new picture
  const takePicture = async () => {
    // Ask for camera permissions
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Permission to access camera is required!');
      return;
    }

    // Open camera
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
      setAvatarUrl(result.assets[0].uri); // Set to avatar URL
    }
  };

  const handleSave = () => {    
    editUser(id, firstName, lastName, email, dateOfBirth, avatarUrl, userDescription);
    alert('Din profil är uppdaterad');
    router.back();
  };

  

  return (
  <ScrollView className=" bg-vgrBlue">
    <View className='flex-1 items-center justify-center'>
      <View className='flex-1 items-center justify-center w-full p-4 pt-12'>
        <Text className="font-bold text-2xl text-white underline mb-4">Redigera Profil</Text>
        <Text className='text-white text-md w-full text-left font-roboto'>Ditt förnamn</Text>
        <TextInput
          placeholder="Förnamn"
          className='bg-white rounded-lg p-4 mb-4 border-gray-300 w-full'
          value={firstName}
          onChangeText={setFirstName}
        />
        <Text className='text-white text-md w-full text-left font-roboto'>Ditt efternamn</Text>
        <TextInput
          placeholder="Efternamn"
          className='bg-white rounded-lg p-4 mb-4 border-gray-300 w-full'
          value={lastName}
          onChangeText={setLastName}
        />
       <Text className='text-white text-md w-full text-left font-roboto'>Din email address</Text>
        <TextInput
          placeholder="Email"
          className='bg-white rounded-lg p-4 mb-4 border-gray-300 w-full'
          value={email}
          onChangeText={setEmail}
        />
        
        <Text className='text-white text-md w-full text-left font-roboto'>Födelsedatum</Text>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} className='bg-white rounded-lg p-4 mb-4 w-full'>
          <Text className='text-black'>{dateOfBirth.toLocaleDateString()}</Text>
        </TouchableOpacity>
        

        {showDatePicker && (
          <DateTimePicker
            locale='sv-SE'
            value={dateOfBirth}
            mode="date"
            display="default"            
            onChange={handleDateChange}
          />
        )}
        
        <TextInput
          placeholder="Beskriv dig själv"
          className='bg-white rounded-lg p-4 mb-4 border-gray-300 w-full'
          value={userDescription}
          onChangeText={setUserDescription}
        />

          <View className='flex flex-col justify-center items-center w-full'>
            <Text className='text-white text-lg mb-4 font-roboto'>Profilbild</Text>
            {image ? (
              <Image source={{ uri: image }} className="w-24 h-24 rounded-full mb-4" />
            ) : (
              <Image source={{ uri: userAvatar }} className="w-24 h-24 rounded-full mb-4" />
            )}

            <View className='flex flex-row gap-2 justify-center items-center w-full'>
              <TouchableOpacity onPress={pickImage} className='bg-white rounded-lg p-2 mb-4'>
                <Text className='text-vgrBlue'>Välj bild från album</Text>
              </TouchableOpacity>

            
              <TouchableOpacity onPress={takePicture} className='bg-white rounded-lg p-2 mb-4'>
                <Text className='text-vgrBlue'>Ta nytt foto</Text>
              </TouchableOpacity>

            </View>
            <View className='flex flex-row gap-6 justify-center items-center w-full'>
              <TouchableOpacity className='mb-4' onPress={() => router.back()}>
                <Text className='bg-white rounded py-2 px-4 font-bold text-lg text-vgrBlue'>Ångra</Text>
              </TouchableOpacity>
              <TouchableOpacity className='mb-4' onPress={handleSave}>
                <Text className='bg-white rounded py-2 px-4 font-bold text-lg text-vgrBlue'>Spara</Text>
              </TouchableOpacity>
            </View>
          </View>
      </View>
    </View>
  </ScrollView >
  );
}
