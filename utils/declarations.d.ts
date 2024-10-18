declare module 'react-native-drawing-canvas' {
  import { ViewProps } from 'react-native';
  
  interface DrawingCanvasProps extends ViewProps {
    onSave?: (drawing: string) => void; 
    strokeColor?: string;
    strokeWidth?: number;
  }

  const DrawingCanvas: React.FC<DrawingCanvasProps>;
  export default DrawingCanvas;
}