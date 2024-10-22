import React from 'react';
import { Modal, View, Platform } from 'react-native';
import { FilelikeObject, DrawingPickerProps } from '@/utils/types';
import * as FileSystem from 'expo-file-system';
import type { SkImage } from '@shopify/react-native-skia';
import Draw from './Draw';
import Button from './ButtonVariants';
import Typography from './Typography';


export default function DrawingPicker({
  setDrawing,
  setDrawingPreview,
  isDrawingMode,
  setIsDrawingMode,
}: DrawingPickerProps) {
  
  
  const handleSaveDrawing = async (snapshot: SkImage) => {
    try {
      //convert to base64 for preview
      const base64Image = snapshot.encodeToBase64();
      const base64ImageUri = `data:image/png;base64,${base64Image}`;
      setDrawingPreview(base64ImageUri);

      // Save file to device storage
      const snapshotBytes = await snapshot.encodeToBytes();
      const drawingFileName = `user-drawing-${new Date().toISOString()}.png`;
      const fileUri = `${FileSystem.documentDirectory}${drawingFileName}`;
      
      // Write bytes directly to file
      await FileSystem.writeAsStringAsync(fileUri, base64Image, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Create FilelikeObject
      const userDrawing: FilelikeObject = {
        uri: Platform.OS === 'ios' ? fileUri.replace('file://', '') : fileUri,
        name: drawingFileName,
        type: 'image/png',
      };
      
      setDrawing(userDrawing);
      console.log('Drawing saved successfully in drawingpicker');
    } catch (error) {
      console.error('Error saving drawing in drawingpicker:', error);
    }
  };

  return (
    <View>
      {/* Button to open the drawing modal */}
      <Button variant="blue" size="sm" onPress={() => setIsDrawingMode(true)}>
        <Typography variant="white" weight="700" size="sm">
          Måla/teckna
        </Typography>
      </Button>

      {/* Drawing Modal */}
      {isDrawingMode && (
        <Modal
          visible={isDrawingMode}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setIsDrawingMode(false)}
        >
          <Draw
            style={{ height: '100%', width: '100%' }}
            onSave={(snapshot) => handleSaveDrawing(snapshot)}
            strokeColor="black"
            strokeWidth={5}
            onClose={() => setIsDrawingMode(false)}
          />
        </Modal>
      )}
    </View>
  );
}