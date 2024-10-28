import React from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Typography, Button, MediaPicker, DrawingPicker } from '@/components';
import { View, ScrollView, Modal, TextInput, TouchableOpacity, Image } from 'react-native';
import { supabase } from '@/utils/supabase';
import { DepartmentProps, DiagnosisProps, FilelikeObject, MediaUpload } from '@/utils/types';
import { da } from '@faker-js/faker/.';

export default function Diagnosis() {
  const { user, setUser } = useAuth();
  const [modalVisible, setModalVisible] = React.useState<boolean>(false);
  const [diagnosis, setDiagnoses] = React.useState<DiagnosisProps[]>([]);
  const [newDiagnosis, setNewDiagnoses] = React.useState<DiagnosisProps>({
    name: '',
    description: '',    
    id: '',
  });  
  const [isActive, setIsActive] = React.useState(false);
  const [selectedDiagnosis, setSelectedDiagnosis] = React.useState<DiagnosisProps | null>(null);
  const [isFullviewModalVisible, setIsFullviewModalVisible] = React.useState<boolean>(false);

  const [isDrawingMode, setIsDrawingMode] = React.useState(false); 
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = React.useState<string | null>(null);
  const [drawing, setDrawing] = React.useState<FilelikeObject | null>(null);
  const [drawingPreview, setDrawingPreview] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (user?.diagnoses) {
      setDiagnoses(user.diagnoses); 
    }
  }, []);
 

  const handleAddDiagnosis = async() => {
    try{
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
        .from('diagnosisMedia')
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
          .from('diagnosisMedia')
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
          .from('diagnosisMedia')
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
        image_url: mediaUploads.find((m) => m.type === 'image')?.url || null,
        video_url: mediaUploads.find((m) => m.type === 'video')?.url || null,
      };


      if(newDiagnosis.name === '' || newDiagnosis.description === ''){
        throw new Error('All fields must be filled');
      }

      const diagnosisEntry = {
        name: newDiagnosis.name,
        description: newDiagnosis.description,
        treating_department_name: newDiagnosis.department,
        treating_department_id: user?.departments?.find((dept) => dept.name === newDiagnosis.department)?.id,
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
          
        //add the new diagnosis to the list of diagnoses        
        setDiagnoses([...diagnosis, {
          id: data[0].id,
          name: data[0].name,
          description: data[0].description,
          department: data[0].treating_department_name,
          image: uploadedMedia.image_url,
          video: uploadedMedia.video_url,
          drawing: uploadedMedia.drawing_url,
        }]);
      //add the new diagnosis to the user object
      if(user){
        user.diagnoses = [...diagnosis, {
          id: data[0].id,
          name: data[0].name,
          description: data[0].description,
          department: data[0].treating_department_name,
          image: uploadedMedia.image_url,
          video: uploadedMedia.video_url,
          drawing: uploadedMedia.drawing_url,
        }]
       
      }
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
  }

  //update the user object with the new diagnosis
  if(user){
    setUser({ ...user });
  }
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

  const handleFocus = () => {
    setIsActive(true); //so when a input field is active we set the state to true
  };
  const handleBlur = () => {
    setIsActive(false); //and when the user is done with the input field we set the state to false wich makes the cursor go to the start based on the selection prop
  };

  //open the fullview modal on press for the selected contact
  const handleSelectedDiagnosis = (diagnosis: DiagnosisProps) => {
    setSelectedDiagnosis(diagnosis); 
    setIsFullviewModalVisible(true); 
  };

  const handleRemoveDiagnosis = async (diagnosis: DiagnosisProps) => {
    if(!diagnosis){
      return
    };

    try {
      const { error } = await supabase
        .from('Diagnosis')
        .delete()
        .eq('id', diagnosis.id);

      if (error) {
        console.error('Error removing diagnosis:', error);
        return;
      }else{
      alert('Diagnos borttagen!');        
      //remove the deleted diagnosis from the list of diagnoses     
      setDiagnoses((diagnoses: DiagnosisProps[]) => 
        diagnoses.filter((diagnoses) => diagnoses.id !== diagnosis.id)
      );
      //remove the deleted diagnosis from the user object
      if(user){
        user.diagnoses = user.diagnoses?.filter((prevDiagnosis) => prevDiagnosis.id !== diagnosis.id);
        setUser({ ...user });
      }
    }
    } catch (error) {
      console.error('Error removing diagnosis:', error);
    }

    setIsFullviewModalVisible(false);
  };

  const [departmentSuggestions, setDepartmentSuggestions] = React.useState<string[]>([]);
const [showSuggestions, setShowSuggestions] = React.useState(false);

// Filter departments as the user types
const handleDepartmentChange = (text: string) => {
  setNewDiagnoses({ ...newDiagnosis, department: text });

  if (user?.departments) {
    const filteredDepartments = user.departments
      .map(dept => dept.name) // Map to department names
      .filter((name): name is string => Boolean(name)) // Filter out null/undefined
      .filter(name => name.toLowerCase().includes(text.toLowerCase())); // Filter by input

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