import React, { useState, useEffect, useMemo} from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { Typography, Button, MediaPicker, DrawingPicker, VideoThumbnail } from '@/components';
import { View, Image, ScrollView, Modal, TextInput, TouchableOpacity, FlatList, Alert } from 'react-native';
import { supabase } from '@/utils/supabase';
import { DepartmentProps, StaffProps, ContactsProps, FilelikeObject, MediaUpload, DepartmentMedia } from '@/utils/types';
import { useDepartmentsStore, useUserStore } from '@/stores';
import { getUserMediaForDepartments } from '@/lib/apiHelper';

export default function Departments() {
  //global states
  const { user } = useAuth();
  const { id } = useUserStore();
  const {
    departments,
    staff,
    contactIds,
    fetchContactIds,    
    setContactIds,
  } = useDepartmentsStore((state) => state);
 
  //local states
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [newContact, setNewContact] = useState<ContactsProps>({
    name: '',
    contactperson: '',
    phonenumber: '',
    address: '',
    _C_department_id: '',
    _C_staff_id: '',
  }); 
  const [contacts, setContacts] = useState<ContactsProps[] | null>([]);
  const [selectedContact, setSelectedContact] = useState<ContactsProps | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentProps | null>(null);
  const [filteredDepartments, setFilteredDepartments] = useState<DepartmentProps[] | undefined>([]);
  const [filteredStaff, setFilteredStaff] = useState<StaffProps[] | null>([]);
  const [departmentSearchTerm, setDepartmentSearchTerm] = useState<string | null>('');
  const [staffSearchTerm, setStaffSearchTerm] = useState<string | null>('');  
  const [isActive, setIsActive] = useState<boolean>(false);
  const [isFullviewModalVisible, setIsFullviewModalVisible] = useState<boolean>(false);
  const [mediaModalVisible, setMediaModalVisible] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = React.useState<string | null>(null);
  const [isDrawingMode, setIsDrawingMode] = React.useState(false); 
  const [drawing, setDrawing] = React.useState<FilelikeObject | null>(null);
  const [drawingPreview, setDrawingPreview] = React.useState<string | null>(null);
  
  const [mediaDescription, setMediaDescription] = useState<{ description: string }>({ description: '' });
  const [departmentMedia, setDepartmentMedia] = useState<DepartmentMedia[]>([]);  
  
  useEffect(() => {

  const fetchMedia = async () => {
    if (user?.id) {
      const media = await getUserMediaForDepartments(user?.id);
      setDepartmentMedia(media);
    }
  };
  fetchMedia();
}, [user?.id]);


  //we want to filter out the departments that the user has contact with
  const userDepartments = useMemo(() => {
    if(!departments || !staff || !contactIds) return [];    

    if (departments?.length > 0 && staff.length > 0 && contactIds?.length > 0) {
      return departments?.map(department => {
          const contact = contactIds.find(contact => contact.department_id === department.id);
          const contactPerson = staff.find(person => person.id === contact?.staff_id);
          // Find media for this department
          const departmentMediaData = departmentMedia.find(m => m.department_id === department.id);
          
          if (contact) {
            return {
              _C_department_id: department.id, 
              _C_staff_id: contact?.staff_id || null, 
              name: department.name || null,
              contactperson: contactPerson?.staff_name || 'No contact person',
              phonenumber: department.phonenumber?.toString() || null,
              address: department.address || null,
              media: departmentMediaData?.media || { image_url: null, video_url: null, drawing_url: null }
            };
          }
          return null;
        })
        .filter(department => department !== null);
    }
    return [];
  }, [departments, staff, contactIds, departmentMedia]);

  //set the local state with the filtered departments whenever the userDepartments change
  useEffect(() => {
    setContacts(userDepartments as ContactsProps[]);
  }, [userDepartments]);
  

  const handleDepartmentSearch = (text: string) => {
    setDepartmentSearchTerm(text); 
    const filtered = departments?.filter(dept =>
      dept.name?.toLowerCase().includes(text.toLowerCase())
    );
    setFilteredDepartments(filtered);
  };
  
  const handleStaffSearch = (text: string) => {
    setStaffSearchTerm(text);
    if (staff) {
      let filtered: StaffProps[] = [];
      if (selectedDepartment) { 
        filtered = staff.filter(person =>
          person.staff_name?.toLowerCase().includes(text.toLowerCase()) &&
          //check the department_id of the staff to only get staff from the selected department
          person.department_id === selectedDepartment.id 
        );             
      } else {
        //if no department is selected, filter staff without department
        filtered = staff?.filter(person =>
          person.staff_name?.toLowerCase().includes(text.toLowerCase())
        );        
      }
      if (filtered) {
        //update state with filtered staff
        setFilteredStaff(filtered);  
      }
    } else {
      //if staff is null, reset filtered staff to an empty array
      setFilteredStaff([]);
    }    
  };  
  
  //force the cursor to the start of the input field 
  const handleFocus = () => {
    setIsActive(true); 
  };
  const handleBlur = () => {
    setIsActive(false); 
  };

  //open the fullview modal on press for the selected contact
  const handleSelectContact = (contact: ContactsProps) => {
    setSelectedContact(contact); 
    setIsFullviewModalVisible(true);     
  };

  //close the modal and clear the state
  const closeModal = () => {
    setIsFullviewModalVisible(false);
    setSelectedContact(null); 
    setSelectedDepartment(null);
  };

  const handleAddContact = async () => {
    if (!selectedDepartment || !newContact.contactperson) {
      alert("Du måste fylla i alla fält för att lägga till en kontakt");
      return;
    }
  
    try {      
      const { error } = await supabase
        .from('ProfilesDepartments')
        .insert({
          profile_id: user?.id,
          department_id: selectedDepartment.id,
          staff_id: staff?.find(person => person.staff_name === newContact.contactperson)?.id
        });
  
      if (error) {
        console.error('Error adding contact:', error);
        return;
      }
  
      alert('Kontakt tillagd!');  
      
      setNewContact({
        name: '',
        contactperson: '',
        phonenumber: '',
        address: ''
      });
      setModalVisible(false);
      //refresh the page so the new contact is displayed
      if (id)  fetchContactIds(id);

    } catch (error) {
      console.error('Error adding contact:', error);
    }
  };

  const handleRemoveContact = async (contact: ContactsProps) => {
  Alert.alert(
    'Bekräfta borttagning',
    `Är du säker på att du vill ta bort ${contact.name}?`,
    [
      {
        text: 'Avbryt',
        onPress: () => console.log('Borttagning avbruten'),
        style: 'cancel',
      },
      {
        text: 'OK',
        onPress: async () => {
          try {
            //delete contact from the database
            const { error } = await supabase
              .from('ProfilesDepartments')
              .delete()
              .eq('profile_id', user?.id)
              .eq('department_id', contact._C_department_id);

            if (error) {
              console.error('Error deleting contact:', error);
              return;
            }

            if(!contactIds) return;
            const updatedContactIds = contactIds?.filter(
              (c) => c.department_id !== contact._C_department_id
            );
            //update the global state with the new contactlist
            setContactIds(updatedContactIds);

            //update the local state with the new contactlist
            setContacts((prevContacts) =>
              prevContacts
                ? prevContacts.filter((c) => c._C_department_id !== contact._C_department_id)
                : null
            );            
            
            closeModal();
            alert('Kontakten borttagen!');
          } catch (error) {
            console.error('Error removing contact:', error);
            alert('Något gick fel vid borttagningen. Försök igen.');
          }
        },
      },
    ]
  );
};
  
const handleSendMessage = (contact: ContactsProps) => {
  router.push({
    pathname: '/question',
    params: {
      department: contact.name,
      department_id: contact._C_department_id,
      contactperson: contact.contactperson,
      staff_id: contact._C_staff_id,
    },
  });
}; 

  
  const handleAddMedia = () => {
    setMediaModalVisible(true);
  };

  
  const handleSaveMedia = async () => {
    const mediaUploads: MediaUpload[] = [];

    //only try to upload the media if there is any
    if (drawing) {          
      const drawingData = new FormData();     
      drawingData.append('file', {
      uri: drawing.uri,
      type: drawing.type,
      name: drawing.name,
      } as any);

      //generate a unique filename
      const drawingFileName = `drawing-${Date.now()}.${drawing.name.split('.').pop()}`;

      //save to bucket
      const { data: drawingBucketData, error: drawingError } = await supabase
      .storage
      .from('drawings')
      .upload(drawingFileName, drawingData, {
        cacheControl: '3600000000',
        upsert: false,
      });

      if (drawingError) {
        console.error("Error uploading drawing:", drawingError);
      } else {
        //insert the url to the mediaUploads array
        mediaUploads.push({ type: 'drawing', url: drawingBucketData?.path });
      }
    }

    if (selectedImage) {
      const imageData = new FormData();
      const imageFileName = selectedImage?.split('/').pop() || 'default-image-name.png';
      imageData.append('file', {
        uri: selectedImage,
        type: `image/${imageFileName?.split('.').pop()}`,
        name: imageFileName,
      } as any);
  
      const { data: imageBucketData, error: imageError } = await supabase
        .storage
        .from('pictures')
        .upload(imageFileName, imageData, {
          cacheControl: '3600000000',
          upsert: false,
        });
  
      if (imageError) {
        console.error("Error uploading image:", imageError);
      } else {
        mediaUploads.push({ type: 'image', url: imageBucketData?.path });
      }
    }
  
    if (selectedVideo) {
      const videoData = new FormData();
      const videoFileName = selectedVideo?.split('/').pop() || 'default-video-name.mp4';
      videoData.append('file', {
        uri: selectedVideo,
        type: `video/${videoFileName?.split('.').pop()}`,
        name: videoFileName,
      } as any);
  
      const { data: videoBucketData, error: videoError } = await supabase
        .storage
        .from('videos')
        .upload(videoFileName, videoData, {
          cacheControl: '3600000000',
          upsert: false,
        });
  
      if (videoError) {
        console.error("Error uploading video:", videoError);
      } else {
        mediaUploads.push({ type: 'video', url: videoBucketData?.path });
      }
    }

    //if there were any media uploads, get the uri's
    const uploadedMedia = {
      drawing_url: mediaUploads.find((m) => m.type === 'drawing')?.url || null,
      img_url: mediaUploads.find((m) => m.type === 'image')?.url || null,
      video_url: mediaUploads.find((m) => m.type === 'video')?.url || null,
    };

    const mediaEntry = {         
      image_uri: mediaUploads.find((m) => m.type === 'image')?.url || null,
      video_uri: mediaUploads.find((m) => m.type === 'video')?.url || null,
      drawing_uri: mediaUploads.find((m) => m.type === 'drawing')?.url || null,
      media_description: mediaDescription.description,
    }

    const { data, error } = await supabase
    .from('Media')
    .insert([mediaEntry])
    .select();

    if (error) {
      console.error('Error saving procedure:', error);
    } else {
      if (data && data[0] && data[0].id) {
        
        //insert into the junction table User_Departments_Media
        const media_id = data[0].id;

        const { error } = await supabase
        .from('User_Departments_mediaJunction')
        .insert({
          user_id: user?.id,
          department_id: selectedContact?._C_department_id,
          media_id: media_id,
        });

        if(error) {
          console.error('Error saving media to media table:', error);
        }
      } else {
        console.error('Error saving media to bucket:', error);
      }    
  }        

  console.log('Media saved successfully');     

  //clear the states and close the modal
  setDrawing(null);
  setDrawingPreview(null);
  setSelectedImage(null);
  setSelectedVideo(null);
  setMediaDescription({ description: '' });
  setMediaModalVisible(false);
  
  if (user?.id) {
    const media = await getUserMediaForDepartments(user.id);
    setDepartmentMedia(media);

    // If we have selectedContact, update it with the new media
    if (selectedContact) {
      const newMedia = media.find(m => m.department_id === selectedContact._C_department_id);
      setSelectedContact({
        ...selectedContact,
        media: newMedia?.media || { image_url: null, video_url: null, drawing_url: null, description: null }
      });
    }
  }
  
}


const handleAbortMedia = () => {
  setDrawing(null);
  setSelectedImage(null);
  setSelectedVideo(null);
  setMediaModalVisible(false);
}; 

  return(
    <ScrollView className='bg-vgrBlue'>
      <View className='flex-1 items-center justify-center pt-12 px-4'>
        <View className='flex-col items-center justify-center py-4'>
          <Typography variant='white' size='h1' weight='700' >Mina Vårdkontakter</Typography>
        </View>
      

        <View className='flex-row gap-1'>
          <Button variant='white' size='md' className='' onPress={() =>  setModalVisible(true)}>           
            <Typography variant='blue' size='sm' weight='400' className='text-center' >Lägg till kontakt</Typography>
          </Button>          
        </View>        
    
        {/* Modal for adding contact */}
        <Modal visible={modalVisible} transparent={true} animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View className="flex-1 justify-center items-center bg-vgrBlue bg-opacity-50">
            <View className="bg-white p-6 w-4/5 rounded-lg">
              <Typography variant="black" size="h3" weight="700">Lägg till kontakt</Typography>
              
              <TextInput
                placeholder="Avdelningsnamn"
                value={departmentSearchTerm || ''}
                autoFocus={true}
                onChangeText={handleDepartmentSearch}              
                className="border border-gray-400 mt-4 p-2"
                onFocus={handleFocus} //set focus state when user uses the input field
                onBlur={handleBlur} //reset focus state when user is done using the input field
                selection={isActive ? undefined : { start: 0 }}
              />

              {filteredDepartments && filteredDepartments.length > 0 && (
                <View style={{ maxHeight: 150, overflow: 'scroll' }}>
                  <FlatList
                    data={filteredDepartments}
                    keyExtractor={(item) => item.id || Math.random().toString()}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => {
                          setNewContact({
                            ...newContact,
                            name: item.name,
                            phonenumber: item.phonenumber,
                            address: item.address,
                          });
                          setSelectedDepartment(item); //set selected department for ID extraction
                          setFilteredDepartments([]);
                          setDepartmentSearchTerm(item.name); 
                        }}
                      >
                        <Typography variant="black" className="" size="sm">
                          {item.name}
                        </Typography>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
              
              <TextInput
                placeholder="Kontaktperson"
                value={staffSearchTerm || ''}
                onChangeText={handleStaffSearch} // Filter staff based on input
                className="border border-gray-400 mt-4 p-2"
              />
              <FlatList
                data={filteredStaff}
                keyExtractor={(item) => item.id || Math.random().toString()} 
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => {
                      setNewContact({
                        ...newContact,
                        contactperson: item.staff_name,
                      });
                      setFilteredStaff([]); 
                      setStaffSearchTerm(item.staff_name);
                    }}
                  >
                    <Typography variant="black" className='text-gray-300' size="sm">{item.staff_name}</Typography>
                  </TouchableOpacity>
                )}
              />
              
              <TextInput
                placeholder="Telefonnummer"
                value={newContact.phonenumber || ''}
                onChangeText={(text) => setNewContact({ ...newContact, phonenumber: text })}
                className="border border-gray-400 mt-4 p-2"
              />
              
              <TextInput
                placeholder="Address"
                value={newContact.address || ''}
                onChangeText={(text) => setNewContact({ ...newContact, address: text })}
                className="border border-gray-400 mt-4 p-2"
              />
              
              <Button variant="blue" size="md" className="w-full mt-4" onPress={handleAddContact}>
                <Typography variant="white" size="lg" weight="400" className="text-center">Lägg till kontakt</Typography>
              </Button>
              
              <Button variant="blue" size="md" className="w-full mt-2 mb-4" onPress={() => {
                setNewContact({
                  name: '',
                  contactperson: '',
                  phonenumber: '',
                  address: '',
                });
                setModalVisible(false);
              }}>
                <Typography variant="white" size="lg" weight="400" className="text-center">Avbryt</Typography>
              </Button>
            </View>
          </View>
        </Modal>
        
        <View className='flex-col items-center justify-center py-4'>
          <Typography variant='white' size='md' weight='300' className='text-center' >
            Klicka på en kontakt för mer info
          </Typography>
          
          <View className='flex-col items-center justify-center w-full py-4'>
            {contacts && contacts.length > 0 ? (
              contacts.map((contact, index) => (
                <TouchableOpacity  key={index} className='bg-white py-6 px-4 w-4/5 rounded-lg my-2' onPress={() => handleSelectContact(contact)}>
                  <View className='flex-row items-center justify-center mb-2'>
                  {contact?.name?.includes('barnsjukhus') ? (
                    <Image source={require('@/assets/images/bös.png')} style={{ width: 155, height: 65, }} />
                  ) : (
                    <Image source={require('@/assets/images/ronald.png')} style={{ width: 50, height: 50 }} />
                  )}
                  </View>
                  <Typography variant='black' size='md' weight='700' className='text-center'>{contact.name}</Typography>                  
                </TouchableOpacity >
              ))
            ) : (
              <Typography variant='white' size='md' weight='400' className='text-center'>Inga kontakter hittades</Typography>
            )}
          </View>
        </View>

        {/* fullview modal */}
        {selectedContact && (
          <Modal
            visible={isFullviewModalVisible}
            animationType="slide"
            onRequestClose={closeModal}             
          >
            <ScrollView className="bg-vgrBlue">
            <View className="flex-1 bg-white h-screen w-full px-4 pt-12"> 
              <Typography variant="black" weight='700' size='h2' className="text-center mb-12">
                {selectedContact.name}
              </Typography>
              <Typography variant='black' weight='400' size='md' className="mb-2">
                Kontaktperson: {selectedContact.contactperson}
              </Typography>
              <Typography variant='black' weight='400' size='md' className="mb-2">
                Telefonnummer: {selectedContact.phonenumber}
              </Typography>
              <Typography variant='black' weight='400' size='md' className="mb-2">
                Address: {selectedContact.address}
              </Typography>
              
              <Button 
                variant='blue'
                size='md'
                className="mt-4 rounded"
                onPress={handleAddMedia}
              >
                <Typography variant='white' size='md' weight='400' className="text-center">Lägg till bild/video</Typography>
              </Button>
              
              <Button
                variant='blue'
                size='md'
                className="mt-4 rounded"
                onPress={() => {
                  handleSendMessage(selectedContact);
                }}
              >
                <Typography variant='white' size='md' weight='400' className="text-center">Skicka Meddelande</Typography>
              </Button>

              <Button
                variant='blue'
                size='md'
                className="mt-4 rounded"
                onPress={() => handleRemoveContact(selectedContact)}
              >
                <Typography className="text-white text-center">Ta Bort Kontakt</Typography>
              </Button>

              <Button
                variant='white'
                className="bg-gray-500 p-3 mt-4 rounded"
                onPress={closeModal}
              >
                <Typography variant='white' weight='400' size='md' className="text-center">Stäng</Typography>
              </Button>
              <View className='flex-col items-center justify-center my-4'>
                {selectedContact.media  && (
                  <Typography variant="black" weight='700' size='md' className="mb-2">
                    Mina bilder från avdelningen:
                  </Typography>
                )}

              {selectedContact.media?.image_url && (
              <View className='flex-col items-center w-2/3 '>
               <Typography variant="blue" weight='400' size='md' className="my-2 underline italic">
                  {selectedContact.media.description}
                </Typography>               
                <Image 
                  source={{ uri: selectedContact.media.image_url }} 
                  style={{ width: 90, height: 90 }} 
                />
              </View>
              )}

              {selectedContact.media?.video_url && (
              <View className='flex-col  justify-center'>
                <Typography variant="blue" weight='400' size='md' className="my-2 underline italic">
                  {selectedContact.media.description}
                </Typography>      
                <VideoThumbnail 
                  videoUri={selectedContact.media.video_url} 
                />
              </View>
              )}

              {selectedContact.media?.drawing_url && (
              <View className='flex-col justify-center'>
                <Typography variant="blue" weight='400' size='md' className="my-2 underline italic">
                  {selectedContact.media.description}
                </Typography>      
                <Image 
                  source={{ uri: selectedContact.media.drawing_url }} 
                  style={{ width: 90, height: 90 }} 
                />
              </View>
              )}
              </View>
            </View>
            </ScrollView>
          </Modal>
        )}

        {/* Media modal */}
        <Modal
          visible={mediaModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setMediaModalVisible(false)}
        >
          <View className="flex-1 justify-center items-center bg-vgrBlue bg-opacity-50">
            <View className="bg-white p-6 w-4/5 rounded-lg">
              <Typography variant="black" size="h3" weight="700">
                Lägg till bild/video
              </Typography>
              {/* Show selected image/video or drawing canvas */}
              <View className='flex-col items-center justify-center mt-4'>
              {selectedImage && (
                <View className='relative mt-4'>
                  <Image source={{ uri: selectedImage }} style={{ width: 100, height: 100 }} />
                  <TouchableOpacity
                    className='absolute top-0 right-0 p-1 bg-black' 
                    style={{ position: 'absolute', top: 0, right: 0, padding: 5 }}
                    onPress={() => setSelectedImage(null)}
                  >
                    <Typography variant='white' weight='700' size='sm'>X</Typography>
                  </TouchableOpacity>
                </View>
              )}

              {selectedVideo && (
                <View className='relative mt-4'>
                  <VideoThumbnail videoUri={selectedVideo} />
                  <TouchableOpacity
                    className='absolute top-0 right-0 p-1 bg-black' 
                    style={{ position: 'absolute', top: 0, right: 0, padding: 5 }}
                    onPress={() => setSelectedVideo(null)}
                  >
                    <Typography variant='white' weight='700' size='sm'>X</Typography>
                  </TouchableOpacity>
                </View>
              )}
              
              {drawingPreview && (
                <View className='relative mt-2'>                  
                  <Image 
                    source={{ uri: drawingPreview }} 
                    style={{ width: 100, height: 100, resizeMode: 'cover',
                    borderWidth: 1, 
                    borderColor: 'black' }} 
                  />
                  <TouchableOpacity
                    className='absolute top-0 right-0 p-1 bg-black' 
                    style={{ position: 'absolute', top: 0, right: 0, padding: 5 }}
                    onPress={() => {setDrawingPreview(null), setDrawing(null)}}
                  >
                    <Typography variant='white' weight='700' size='sm'>X</Typography>
                  </TouchableOpacity>
                </View>
                )}
              </View>

              <View className="flex flex-row justify-between mt-4">
                <MediaPicker setSelectedImage={setSelectedImage} setSelectedVideo={setSelectedVideo} />
                <DrawingPicker
                  setDrawing={setDrawing}
                  setDrawingPreview={setDrawingPreview}
                  isDrawingMode={isDrawingMode}
                  setIsDrawingMode={setIsDrawingMode}
                />
              </View>
              <TextInput
                placeholder="Beskrivning, tex vem/vad bilden föreställer"
                className="border border-gray-400 mt-4 p-2"
                multiline={true}
                value={mediaDescription.description}
                onChangeText={(text) => setMediaDescription({ description: text })}
              />
              <Button
                variant="blue"
                size="md"
                className="w-full mt-4"
                onPress={handleSaveMedia}
              >                
                <Typography variant="white" size="lg" weight="400" className="text-center">
                  Lägg till
                </Typography>               
              </Button>

              <Button
                variant="blue"
                size="md"
                className="w-full mt-4"
                onPress={handleAbortMedia}
              >
                <Typography variant="white" size="lg" weight="400" className="text-center">
                  Avbryt
                </Typography>
              </Button>

              
            </View>          
          </View>
        </Modal>

      </View>
    </ScrollView>
  );
}