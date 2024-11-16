import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Typography, Button, MediaPicker, DrawingPicker } from '@/components';
import { View, ScrollView, Modal, TextInput, TouchableOpacity, Image } from 'react-native';
import { supabase, supabaseUrl } from '@/utils/supabase';
import { DepartmentProps, DiagnosisProps, FilelikeObject, MediaUpload } from '@/utils/types';
import { useDepartmentsStore, useDiagnosisStore } from '@/stores';
import { fi } from '@faker-js/faker/.';

export default function Diagnosis() {
  //global states
  const { user, setUser } = useAuth();
  const { departments } = useDepartmentsStore();
  const { diagnosis, setDiagnosis } = useDiagnosisStore();

  //local states
  const [modalVisible, setModalVisible] = React.useState<boolean>(false);  
  const [newDiagnosis, setNewDiagnoses] = React.useState<DiagnosisProps>({
    name: '',
    description: '',    
    id: '',
  });  
  const [isActive, setIsActive] = React.useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = React.useState<DiagnosisProps | null>(null);
  const [isFullviewModalVisible, setIsFullviewModalVisible] = React.useState<boolean>(false);
  const [departmentSuggestions, setDepartmentSuggestions] = React.useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  //states for the drawing modal
  const [isDrawingMode, setIsDrawingMode] = React.useState(false); 
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = React.useState<string | null>(null);
  const [drawing, setDrawing] = React.useState<FilelikeObject | null>(null);
  const [drawingPreview, setDrawingPreview] = React.useState<string | null>(null); 
 
  //handlers
  const handleAddDiagnosis = async() => {
    try{
      const mediaUploads: MediaUpload[] = [];
      const fullUrls: MediaUpload[] = [];

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
        .from('diagnosisMedia')
        .upload(drawingFileName, drawingData, {
          cacheControl: '3600000000',
          upsert: false,
        });

        if (drawingError) {
          console.error("Error uploading drawing:", drawingError);
        } else {
          const drawingUrl = `${supabaseUrl}/storage/v1/object/public/diagnosisMedia/${drawingBucketData?.path}`;
          //insert the url to the mediaUploads array
          mediaUploads.push({ type: 'drawing', url: drawingBucketData?.path });
          fullUrls.push({ type: 'drawing', url: drawingUrl });
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
          .from('diagnosisMedia')
          .upload(imageFileName, imageData, {
            cacheControl: '3600000000',
            upsert: false,
          });
    
        if (imageError) {
          console.error("Error uploading image:", imageError);
        } else {
          const imageUrl = `${supabaseUrl}/storage/v1/object/public/diagnosisMedia/${imageBucketData?.path}`;
          mediaUploads.push({ type: 'image', url: imageBucketData?.path });
          fullUrls.push({ type: 'image', url: imageUrl });
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
          .from('diagnosisMedia')
          .upload(videoFileName, videoData, {
            cacheControl: '3600000000',
            upsert: false,
          });
    
        if (videoError) {
          console.error("Error uploading video:", videoError);
        } else {
          const videoUrl = `${supabaseUrl}/storage/v1/object/public/diagnosisMedia/${videoBucketData?.path}`;
          mediaUploads.push({ type: 'video', url: videoBucketData?.path });
          fullUrls.push({ type: 'video', url: videoUrl });
        }
      }

      //if there were any media uploads, get the uri's
      /* const uploadedMedia = {
        drawing_url: mediaUploads.find((m) => m.type === 'drawing')?.url || null,
        image_url: mediaUploads.find((m) => m.type === 'image')?.url || null,
        video_url: mediaUploads.find((m) => m.type === 'video')?.url || null,
      }; */


      if(newDiagnosis.name === '' || newDiagnosis.description === ''){
        throw new Error('All fields must be filled');
      }

      const diagnosisEntry = {
        name: newDiagnosis.name,
        description: newDiagnosis.description,
        treating_department_name: newDiagnosis.department,
        treating_department_id: departments?.find((dept) => dept.name === newDiagnosis.department)?.id,
        user_id: user?.id,
        image_url: mediaUploads.find((m) => m.type === 'image')?.url || null,
        video_url: mediaUploads.find((m) => m.type === 'video')?.url || null,
        drawing_url: mediaUploads.find((m) => m.type === 'drawing')?.url || null,
      }
  

      //save the new diagnosis to supabase
      const { data, error } = await supabase
        .from('Diagnosis')
        .insert([diagnosisEntry])
        .select();

      if (error) {
        console.error('Error adding contact:', error);       
      } else {
        if (data && data.length > 0) {          
          //add the new diagnosis to the global state   
          setDiagnosis([...diagnosis, {
            id: data[0].id,
            name: data[0].name,
            description: data[0].description,
            department: data[0].treating_department_name,
            image: fullUrls.find(m => m.type === 'image')?.url || null,
            video: fullUrls.find((m) => m.type === 'video')?.url || null,
            drawing: fullUrls.find((m) => m.type === 'drawing')?.url || null,
          }]);         
        }
      }
    //clear the states
    setSelectedImage(null);
    setSelectedVideo(null);
    setDrawing(null);
    setNewDiagnoses({ 
      name: '',
      description: '', 
      id: '' ,    
      });
    } catch (error) {
      console.error('Error adding diagnosis:', error);
    }finally{
      //refresh the state by fetching the new diagnosis IF I NEED TO UNCOMMENT THIS IF IT DOESNT REFRESH
    /*  await fetchDiagnosis(id) */
    }

    //close the modal
    setModalVisible(false);
  };

  const handleAbort = () => {
    setIsActive(false);
    setNewDiagnoses({ name: '', description: '', id: '' });
    setModalVisible(false);
    setDrawing(null);
    setSelectedImage(null);
    setSelectedVideo(null);
  };

  //force the cursur to the start of the input field for readability
  const handleFocus = () => {
    setIsActive(true); 
  };
  const handleBlur = () => {
    setIsActive(false); 
  };

  //open the fullview modal on press for the selected contact
  const handleSelectedDiagnosis = (diagnosis: DiagnosisProps) => {
    setSelectedDiagnosis(diagnosis); 
    setIsFullviewModalVisible(true); 
  };

  const handleRemoveDiagnosis = async (deletedDiagnosis: DiagnosisProps) => {
    if (!deletedDiagnosis) {
      return;
    }
  
    try {
      const { error } = await supabase
        .from('Diagnosis')
        .delete()
        .eq('id', deletedDiagnosis.id);
  
      if (error) {
        console.error('Error removing diagnosis:', error);
        return;
      } else {
        alert('Diagnos borttagen!');  
        // Remove the deleted diagnosis from the global store's diagnosis array
        setDiagnosis( diagnosis.filter((d) => d.id !== deletedDiagnosis.id) );
      }
    } catch (error) {
      console.error('Error removing diagnosis:', error);
    }
  
    setIsFullviewModalVisible(false);
  };  

  //filter departments while the user types in the formfields
  const handleDepartmentChange = (text: string) => {
    setNewDiagnoses({ ...newDiagnosis, department: text });

    if (departments) {
      const filteredDepartments = departments
        .map(dept => dept.name) //map to department names
        .filter((name): name is string => Boolean(name)) //filter out null/undefined
        .filter(name => name.toLowerCase().includes(text.toLowerCase())); //filter by input

      setDepartmentSuggestions(filteredDepartments);
      setShowSuggestions(true);
    }
  };

  // Select a department from the suggestions
  const handleSuggestionSelect = (suggestion: string) => {
    setNewDiagnoses({ ...newDiagnosis, department: suggestion });
    setShowSuggestions(false); 
  };

  return(
    <ScrollView className='bg-vgrBlue'>
      <View className='flex-1 items-center justify-center pt-12 px-4'>
        <View className='flex-col items-center justify-center py-4'>
          <Typography variant='white' size='h1' weight='700' >Mina Diagnoser</Typography>
        </View>

        <View className='flex-row gap-1'>
          <Button variant='white' size='md' className='' onPress={() =>  setModalVisible(true)}>           
            <Typography variant='blue' size='sm' weight='400' className='text-center' >Lägg till Diagnos</Typography>
          </Button>          
        </View>

        <Modal visible={modalVisible} transparent={true} animationType="slide" onRequestClose={() => setModalVisible(false)}>
          <View className="flex-1 justify-center items-center bg-vgrBlue bg-opacity-50">
            <View className="bg-white p-6 w-4/5 rounded-lg">
              <Typography variant="black" size="h3" weight="700">Lägg till diagnos</Typography>
              <TextInput
                placeholder="Vad heter sjudomen?"
                value={newDiagnosis?.name || ''}
                autoFocus={true}
                onChangeText={(text) => setNewDiagnoses({ ...newDiagnosis, name: text })}              
                className="border border-gray-400 mt-4 p-2"
                onFocus={handleFocus} //set focus state when user uses the input field
                onBlur={handleBlur} //reset focus state when user is done using the input field
                selection={isActive ? undefined : { start: 0 }}
              />
              <TextInput
                placeholder='Beskriv vad det innebär för dig'
                value={newDiagnosis?.description || ''}
                multiline={true}
                autoFocus={true}
                onChangeText={(text) => setNewDiagnoses({ ...newDiagnosis, description: text })}
                className="border border-gray-400 mt-4 p-2"
                onFocus={handleFocus} //set focus state when user uses the input field
                onBlur={handleBlur} //reset focus state when user is done using the input field
                selection={isActive ? undefined : { start: 0 }}
              />
              <TextInput
                placeholder="Vilken avdelning behandlar dig?"
                value={newDiagnosis?.department || ''}
                multiline={true}
                onChangeText={handleDepartmentChange} 
                className="border border-gray-400 mt-4 p-2"
              />

              {/* Display department suggestions */}
              {showSuggestions && departmentSuggestions?.length > 0 && (
                <ScrollView className="border border-gray-400 mt-2 max-h-44 bg-white overflow-auto rounded-lg">
                  {departmentSuggestions?.map((suggestion, index) => (
                    <TouchableOpacity
                      key={index}
                      onPress={() => handleSuggestionSelect(suggestion)}
                      className="p-2 border-b border-gray-200"
                    >
                      <Typography variant="black" size="sm">{suggestion}</Typography>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
               <View className="flex flex-row justify-between mt-4">
                <MediaPicker setSelectedImage={setSelectedImage} setSelectedVideo={setSelectedVideo} />
                <DrawingPicker
                  setDrawing={setDrawing}
                  setDrawingPreview={setDrawingPreview}
                  isDrawingMode={isDrawingMode}
                  setIsDrawingMode={setIsDrawingMode}
                />
              </View>

              <Button variant="blue" size="md" className="w-full mt-4" onPress={handleAddDiagnosis}>
                <Typography variant="white" size="lg" weight="400" className="text-center">Lägg till diagnos</Typography>
              </Button>
              <Button variant="blue" size="md" className="w-full mt-4" onPress={handleAbort}>
                <Typography variant="white" size="lg" weight="400" className="text-center">Avbryt</Typography>
              </Button>

              <View className='flex-col items-center justify-center mt-4'>
              {selectedImage && <Image source={{ uri: selectedImage }} style={{ width: 100, height: 100, marginTop: 10 }} />}
              {selectedVideo && <Typography variant='white' size='md' weight='400' className='mt-3' >Video: {selectedVideo}</Typography>}
              {drawingPreview &&
                <View className='mt-2 items-center justify-center'>
                  <Typography variant='white' size='md' weight='400' >Förhandsgranskning:</Typography>              
                  <Image 
                    source={{ uri: drawingPreview }} 
                    style={{ width: 100, height: 100, 
                    marginTop: 10, borderWidth: 1, 
                    borderColor: 'black' }} 
                  />
                </View>
                }
              </View>
            </View>
          </View>
        </Modal>

        <ScrollView className='flex-1 w-full'>
          {diagnosis && (
            diagnosis.map((diagnosis, index) => (
            <TouchableOpacity key={index} onPress={() => handleSelectedDiagnosis(diagnosis)}>
              <View className='flex-col items-center justify-center py-8 px-6 min-w-full bg-white rounded-lg mt-8'>
                <Typography variant='blue' size='h2' weight='700' className='p-0 m-0' >{diagnosis.name}</Typography>                
              </View>
            </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Fullview modal */}
        <Modal visible={isFullviewModalVisible} transparent={true} animationType="slide" onRequestClose={() => setIsFullviewModalVisible(false)}>
          <View className="flex-1 justify-center items-center bg-vgrBlue bg-opacity-50">
            <View className="bg-white justify-between p-6 w-4/5 h-5/6 rounded-lg"> 
              <View>
                <Typography variant="blue" size="h2" weight="700">{selectedDiagnosis?.name}</Typography>
                <Typography variant="blue" size="md" weight="400">{selectedDiagnosis?.description}</Typography>
              </View>
              <View className='flex-row justify-between items-center mt-2'>
              {selectedDiagnosis?.image && (
                <View className='border-b border-gray-400'> 
                  <Image source={{ uri: selectedDiagnosis?.image }} style={{ width: 100, height: 100, marginTop: 10 }} />                
                </View> 
              )}
               {selectedDiagnosis?.drawing && (  
                <View className='border-b border-gray-400'>             
                  <Image source={{ uri: selectedDiagnosis?.drawing }} style={{ width: 100, height: 100, marginTop: 10 }} />                
                </View> 
              )}
              {selectedDiagnosis?.video && (     
                <View className='border-b border-gray-400'>            
                  <Image source={{ uri: selectedDiagnosis?.video }} style={{ width: 100, height: 100, marginTop: 10 }} />                
                </View>
              )}
             </View>
              <Typography variant='blue' size='md' weight='400' className='mt-3' >Behandlas av:</Typography>
              <Typography variant='blue' size='md' weight='400' className='italic'> {selectedDiagnosis?.department}</Typography>
              <View>
                <Button
                  variant='blue'
                  size='md'
                  className="mt-4 rounded"
                  onPress={() => handleRemoveDiagnosis(selectedDiagnosis as DiagnosisProps)}
                >
                  <Typography className="text-white text-center">Ta Bort Diagnos</Typography>
                </Button>
                <Button variant="blue" size="md" className="w-full mt-4" onPress={() => setIsFullviewModalVisible(false)}>
                  <Typography variant="white" size="lg" weight="400" className="text-center">Stäng</Typography>
                </Button>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}