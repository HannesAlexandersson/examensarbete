import React from "react";
import { supabase } from "@/utils/supabase";
import { Typography, Button, MediaPicker, DrawingPicker } from "@/components";
import { useAuth } from "@/providers/AuthProvider";
import { ScrollView, TouchableOpacity, View, TouchableWithoutFeedback, Modal, TextInput, Text, Image } from "react-native";
import Ionicons from '@expo/vector-icons/Ionicons';
import { ProcedureProps, FilelikeObject, MediaUpload } from "@/utils/types";

export default function ProceduresScreen() {
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = React.useState<boolean>(false);
  const [ addNewModal, setAddNewModal ] = React.useState<boolean>(false);
  const [toolTipVisible, setToolTipVisible] = React.useState<boolean>(false);
  const [procedureTitle, setProcedureTitle ] = React.useState<string>('');
  const [procedureTxt, setProcedureTxt ] = React.useState<string>('');
  const [procedures, setProcedures] = React.useState<ProcedureProps[]>([]);
  const [selectedProcedure, setSelectedProcedure] = React.useState<ProcedureProps | null>(null);
  const [isDrawingMode, setIsDrawingMode] = React.useState(false); 
  const [selectedImage, setSelectedImage] = React.useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = React.useState<string | null>(null);
  const [drawing, setDrawing] = React.useState<FilelikeObject | null>(null);
  const [drawingPreview, setDrawingPreview] = React.useState<string | null>(null);

  //set the sates on mount
  React.useEffect(() => {
    if (user?.procedures) {
      setProcedures(user.procedures);
    }
  }, []);

  const handleCloseTooltip = () => {
    setToolTipVisible(false);
  };

  const handleAbort = () => {
    setProcedureTxt('');
    setProcedureTitle('');
    setDrawing(null);
    setSelectedImage(null);
    setSelectedVideo(null);
    setAddNewModal(false);
  };

  const handleSave = async () => {
    if (!procedureTitle.trim() || !procedureTxt.trim()) {
      alert('Du måste fylla i både titel och beskrivning för att spara!');
      return;
    }

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
      .from('procedureMedia')
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
        .from('procedureMedia')
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
        .from('procedureMedia')
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

    const procedureEntry = {
      user_id: user?.id,
      procedure_title: procedureTitle,
      procedure_text: procedureTxt,
      img_url: mediaUploads.find((m) => m.type === 'image')?.url || null,
      video_url: mediaUploads.find((m) => m.type === 'video')?.url || null,
      drawing_url: mediaUploads.find((m) => m.type === 'drawing')?.url || null,
    }

    const { data, error } = await supabase
    .from('Procedures')
    .insert([procedureEntry])
    .select();

    if (error) {
      console.error('Error saving procedure:', error);
    } else {
      if (data && data.length > 0) {
        
        const newProcedure = data[0];
        //update the local state with the new procedure
        setProcedures([...procedures, { 
          id: newProcedure.id, 
          procedure_title: procedureTitle, 
          procedure_text: procedureTxt, 
          user_id: user?.id,
          procedure_img: uploadedMedia.img_url,
          procedure_video: uploadedMedia.video_url,
          procedure_drawing: uploadedMedia.drawing_url 
        }]);

        //update the global userobject with the new procedure
        if (user) {
        user.procedures = [...procedures, { 
          id: newProcedure.id, 
          procedure_title: procedureTitle, 
          procedure_text: procedureTxt, 
          user_id: user?.id,
          procedure_img: uploadedMedia.img_url,
          procedure_video: uploadedMedia.video_url,
          procedure_drawing: uploadedMedia.drawing_url 
        }];
      }

        setProcedureTxt('');
        setProcedureTitle('');
        setDrawing(null);
        setDrawingPreview(null);
        setSelectedImage(null);
        setSelectedVideo(null);
        setAddNewModal(false);
      }
  }
}

const handleDeleteProcedure = async (procedur: ProcedureProps) => {
  if(!procedur){
    return;
  }
  
  const { error } = await supabase
  .from('Procedures')
  .delete()
  .match({ id: procedur.id, user_id: user?.id });

  if (error) {
    console.error('Error deleting procedure:', error);
    alert('Något gick fel, försök igen senare!');
  } else {
    //update the local state
    setProcedures(procedures.filter(procedure => procedure.id !== procedur.id));
    //update the global user object
    if (user) {
      user.procedures = procedures.filter(procedure => procedure.id !== procedur.id);
    }
    alert('Procedur borttagen!');
    setModalVisible(false);
  }
}

  return(
    <ScrollView className="bg-vgrBlue">
    <View className='flex-1 items-center justify-center pt-12 px-4'>
        <View className='flex-col items-center justify-center py-4'>
          <Typography variant='white' size='h1' weight='700' >
            Mina Procedurer <TouchableOpacity onPress={() => setToolTipVisible(true)}><Ionicons name="information-circle-outline" size={24} color="white" /></TouchableOpacity>
          </Typography>
          {toolTipVisible && (
          <TouchableWithoutFeedback onPress={handleCloseTooltip}>
            <View className='absolute inset-0 flex items-center justify-center z-50'>
              <View className='bg-black border-[3px] border-white p-4 rounded-lg shadow-lg w-full  mt-36'>
                <TouchableOpacity onPress={handleCloseTooltip} className='absolute top-2 right-2'>
                  <Typography variant='white' size='md' weight='400'>X</Typography>
                </TouchableOpacity>
                <Typography variant='white' size='md' weight='400' className='text-center text-base'>
                  Dina procedurer handlar om hur DU vill att dina sjukhusbesök ska gå till. 
                  Här kan du berätta hur du vill att sjukhuspersonalen ska göra vid olika tillfällen.
                  Vill du till exempel att de ska använda handsprit innan de undersöker dig?
                  Eller att bara korta personer får ta blodprov på dig?
                </Typography>
              </View>
            </View>
          </TouchableWithoutFeedback>
        )}
          
        </View>
        <View className='flex-row gap-1'>
          <Button variant='white' size='md' className='mb-8' onPress={() =>  setAddNewModal(true)}>           
            <Typography variant='blue' size='sm' weight='400' className='text-center' >Lägg till procedur</Typography>
          </Button>          
        </View>

        {/* Modal for adding procedure */}
        <Modal visible={addNewModal} transparent={true} animationType="slide" onRequestClose={() => setAddNewModal(false)}>
          <View className="flex-1 justify-center items-center bg-vgrBlue bg-opacity-50">
            <View className="bg-white p-6 w-4/5 rounded-lg">
              <Typography variant="black" size="h3" weight="700">Lägg till procedur</Typography>
              <TextInput
                placeholder="Vad handlar din procedur om?"
                value={procedureTitle}
                autoFocus={true}
                onChangeText={setProcedureTitle}              
                className="border border-gray-400 mt-4 p-2"
              />
              <TextInput
                className="border border-gray-400 mt-4 p-2"
                style={{ height: 100 }}
                placeholder="Beskriv din procedur..."
                multiline={true}
                value={procedureTxt}
                onChangeText={setProcedureTxt}
              />
              <View className="flex flex-row justify-between mt-4">
                <MediaPicker setSelectedImage={setSelectedImage} setSelectedVideo={setSelectedVideo} />
                <DrawingPicker
                  setDrawing={setDrawing}
                  setDrawingPreview={setDrawingPreview}
                  isDrawingMode={isDrawingMode}
                  setIsDrawingMode={setIsDrawingMode}
                />
              </View>
              
              <View className='flex flex-row justify-between mt-4'>
                <Button variant='blue' size='md' onPress={handleAbort}>
                  <Typography variant='white' size='md' weight='700'>AVBRYT</Typography>
                </Button>
                <Button variant='blue' size='md' onPress={handleSave}>
                  <Typography variant='white' size='md' weight='700'>SPARA</Typography>
                </Button>
              </View>

              {/* Show selected image/video or drawing canvas */}
              <View className='flex-col items-center justify-center mt-4'>
              {selectedImage && <Image source={{ uri: selectedImage }} style={{ width: 100, height: 100, marginTop: 10 }} />}
              {selectedVideo && <Text style={{ marginTop: 10 }}>Video: {selectedVideo}</Text>}
              {drawingPreview &&
                <View className='mt-2 items-center justify-center'>
                  <Text >Förhandsgranskning:</Text>              
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
        {procedures.length > 0 ? ( 
          procedures.map((procedure, index) => (
            <TouchableOpacity 
              key={index} 
              onPress={() => {
                setSelectedProcedure(procedure); 
                setModalVisible(true); 
              }}
            >
              <View className='flex-col bg-white w-full min-w-full p-4 rounded-lg mt-4'>
                <Typography variant='black' size='md' weight='700' className="pb-2">{procedure.procedure_title}</Typography>
                <Typography variant='black' size='md' weight='400'>{procedure.procedure_text}</Typography>
              </View>
              
            </TouchableOpacity>
          ))
        ) : (
          <Typography variant='white' size='md' weight='400' className='text-center mt-4'>Du har inte lagt in några procedurer än!</Typography>
        )}

        {/* Modal for selected procedure */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(!modalVisible);
          }}
        >
          <View className='flex-1 justify-center items-center bg-vgrBlue bg-opacity-50'>
            <View className='bg-white rounded-lg p-4 w-80'>
              {selectedProcedure && (
                <>
                  <Typography variant='black' size='lg' weight='700'>{selectedProcedure.procedure_title}</Typography>
                  <Typography variant='black' size='md' weight='400'>{selectedProcedure.procedure_text}</Typography>

                  <View className='flex-row justify-between items-center mt-2'>
                    {selectedProcedure.procedure_img && (
                    <View className='border-b border-gray-400'>
                      <Image source={{ uri: selectedProcedure.procedure_img }} style={{ width: 100, height: 100, marginTop: 10 }} />
                    </View>
                    )}
                    {selectedProcedure.procedure_drawing && (
                    <View className='border-b border-gray-400'>
                      <Image source={{ uri: selectedProcedure.procedure_drawing }} style={{ width: 100, height: 100, marginTop: 10 }} />
                    </View>
                    )}
                  </View>
                  
                  <Button
                    variant="blue"
                    size="md"
                    className="my-4 items-center"
                    onPress={() => handleDeleteProcedure(selectedProcedure)}
                  >
                    <Typography variant='white' size='md' weight='700'>Ta bort procedur</Typography>
                  </Button>
                </>
              )}
              <Button
                variant="blue"
                size="md"
                className="items-center"
                onPress={() => {
                  setModalVisible(false);
                  setSelectedProcedure(null); 
                }}
              >
                <Typography variant='white' size='md' weight='700'>Stäng</Typography>
              </Button>
            </View>
          </View>
        </Modal>

      </View>
    </ScrollView>
  );
}