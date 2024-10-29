import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, ScrollView   } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { Button, Typography } from '@/components';




export default function EditProfile() {
  const { user, editUser, userAvatar, setGetPhotoForAvatar, getPhotoForAvatar, selectedMediaFile, setSelectedMediaFile, setSelectedOption, selectedOption } = useAuth();
  const [id, setId] = useState(user?.id || '');
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [dateOfBirth, setDateOfBirth] = useState<Date>(user?.date_of_birth || new Date('2010-12-24'));
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [userDescription, setUserDescription] = useState(user?.description || ''); 
  
  const [showDatePicker, setShowDatePicker] = useState(false);  
  const [image, setImage] = useState<string | null>(null);

  //handle date change from DatePicker
  const handleDateChange = (event: any, selectedDate: Date | undefined) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateOfBirth(selectedDate);
    }
  };


  //handle image picking
  const pickImage = async () => {
    //ask permission to access phones media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
      alert('Appen behöver få behörighet för att komma åt dina bilder!');
      return;
    }

    //open the image picker
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

  //handle taking a new picture
  const takePicture = async () => {
    //ask for camera permissions
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
      setAvatarUrl(result.assets[0].uri);
    }
  };

  const handleSave = () => {    
    editUser(id, firstName, lastName, email, dateOfBirth, avatarUrl, userDescription, selectedOption);
    alert('Din profil är uppdaterad');
    router.back();
  };  

  const handleToAlbum = () => {
    setGetPhotoForAvatar(true);
    router.push('/album?source=edit');
  };

  useEffect(() => {
    if (getPhotoForAvatar) {      
      if (selectedMediaFile){
        setAvatarUrl(selectedMediaFile);
      }
      setImage(selectedMediaFile);
    }
  }, [selectedMediaFile, getPhotoForAvatar]);

  const handleRegret = () => {
    setAvatarUrl(user?.avatar_url || '');
    setImage(user?.avatar_url || '');
    setSelectedMediaFile(null);
    setGetPhotoForAvatar(false);

    router.back();
  };

  
  const setVersion = (v: number) => {
    alert(`Versionen är ändrad till version ${v}. Vänligen starta om appen för att låta den nya versionen appliceras.`);
    setSelectedOption(v);
    editUser(id, firstName, lastName, email, dateOfBirth, avatarUrl, userDescription, selectedOption);
    router.back();
  };

  return (
  <ScrollView className=" bg-vgrBlue">
    <View className='flex-1 items-center justify-center'>
      <View className='flex-1 items-center justify-center w-full p-4 pt-12'>
        <Typography variant='white' weight='700' size='h2' className="underline mb-4">Byt version</Typography>
        <View className='flex flex-row gap-2 justify-center items-center mb-4 w-full'>

        {user?.selected_version === 1 ? (
        <Button variant='blue' size='md' className='border border-white' onPress={() => alert('Du använder redan version 1')}>
          <Typography variant='white'>Version 1</Typography>
        </Button>
        ) : (
        <Button variant='white' size='md' onPress={() => setVersion(1)}>
          <Typography variant='blue'>Version 1</Typography>
        </Button>
        )}

        {user?.selected_version === 2 ? (
        <Button variant='blue' size='md' className='border border-white' onPress={() => alert('Du använder redan version 2')}>
          <Typography variant='white'>Version 2</Typography>
        </Button>
        ) : (
        <Button variant='white' size='md' onPress={() => setVersion(2)}>
          <Typography variant='blue'>Version 2</Typography>
        </Button>
        )}

        {user?.selected_version === 3 ? (
        <Button variant='blue' size='md' className='border border-white' onPress={() => alert('Du använder redan version 3')}>
          <Typography variant='white'>Version 3</Typography>
        </Button>
        ) : (
          <Button variant='white' size='md' onPress={() => setVersion(3)}>
            <Typography variant='blue'>Version 3</Typography>
          </Button>
        )}

        </View>
        <Typography variant='white' weight='700' size='h2' className="underline mb-4">Redigera Profil</Typography>
        <Typography variant='white' weight='300' size='sm' className='w-full text-left'>Ditt förnamn</Typography>
        <TextInput
          placeholder="Förnamn"
          className='bg-white rounded-lg p-4 mb-4 border-gray-300 w-full'
          value={firstName}
          onChangeText={setFirstName}
        />
        <Typography variant='white' weight='300' size='sm' className='w-full text-left'>Ditt efternamn</Typography>
        <TextInput
          placeholder="Efternamn"
          className='bg-white rounded-lg p-4 mb-4 border-gray-300 w-full'
          value={lastName}
          onChangeText={setLastName}
        />
       <Typography variant='white' weight='300' size='sm' className='w-full text-left'>Din email address</Typography>
        <TextInput
          placeholder="Email"
          className='bg-white rounded-lg p-4 mb-4 border-gray-300 w-full'
          value={email}
          onChangeText={setEmail}
        />
        
        <Typography variant='white' weight='300' size='sm' className='w-full text-left'>Födelsedatum</Typography>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} className='bg-white rounded-lg p-4 mb-4 w-full'>
          <Text className='text-black'>
          {dateOfBirth.toLocaleDateString()}
          </Text>
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
        <Typography variant='white' weight='300' size='sm' className='w-full text-left'>Beskrivning (max 180 bokstäver)</Typography>
        <TextInput
          placeholder="Beskriv dig själv"
          className='bg-white rounded-lg p-4 mb-4 border-gray-300 w-full'
          value={userDescription}
          onChangeText={setUserDescription}
          multiline={true}  
          numberOfLines={4} 
          textAlignVertical="top"
        />

          <View className='flex flex-col justify-center items-center w-full'>
            <Typography variant='white' weight='600' size='h3'>Profilbild</Typography>
            {image ? (
              <Image source={{ uri: image }} className="w-24 h-24 rounded-full mb-4" />
            ) : (
              userAvatar ? (
                <Image source={{ uri: userAvatar }} className="w-24 h-24 rounded-full mb-4" />
              ) : (
              <View className='w-24 h-24 bg-gray-200 rounded-full mb-4' />
            ))}

            <View className='flex flex-row gap-2 justify-center items-center mb-4 w-full'>
              <Button variant='white' size='md' onPress={handleToAlbum}>
                <Typography variant='blue'>Album</Typography>
              </Button>

              <Button onPress={pickImage} variant='white' size='md'>
                <Typography variant='blue'>Telefonbilder</Typography>
              </Button>

            
              <Button onPress={takePicture} variant='white' size='md'>
                <Typography variant='blue'>Nytt foto</Typography>
              </Button>
            </View>

            <View className='flex flex-row gap-6 justify-center items-center w-full'>
              <Button variant='white' size='md' className='rounded my-4' onPress={handleRegret}>
                <Typography variant='blue' weight='700' className='text-lg'>Ångra</Typography>
              </Button>
              <Button variant='white' size='md' className='rounded my-4' onPress={handleSave}>
                <Typography variant='blue' weight='700' className='text-lg'>Spara</Typography>
              </Button>
            </View>
          </View>
      </View>
    </View>
  </ScrollView >
  );
}
