import { StatusBar } from "expo-status-bar";
import React, { useState, useRef } from "react";
import { View, Dimensions, TouchableOpacity, StyleSheet } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { Canvas, Circle, Path, Skia, ImageSVG } from "@shopify/react-native-skia";
import Animated, { useSharedValue, withTiming, useAnimatedStyle, withSpring } from "react-native-reanimated";
import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { IPath, ICircle, IStamp, Tools, DrawProps } from "@/utils/types";

const Draw: React.FC<DrawProps> = ({ style, onSave, onClose, strokeColor, strokeWidth }) => {
  const { width, height } = Dimensions.get("window");
  const paletteColors = ["red", "green", "blue", "yellow", "black"];
  //the SVGs for the different stamps
  const svgStamps = {
    star: '<svg viewBox="0 0 200 200"><polygon fill="{{fillColor}}" points="100,0,129.38926261462365,59.54915028125263,195.10565162951536,69.09830056250526,147.55282581475768,115.45084971874736,158.77852522924732,180.90169943749473,100,150,41.2214747707527,180.90169943749476,52.447174185242325,115.45084971874738,4.894348370484636,69.09830056250527,70.61073738537632,59.549150281252636"></polygon></svg>',
    heart: '<svg viewBox="0 0 200 200"><path fill="{{fillColor}}" d="M100,180c-1.5,0-3-0.5-4.2-1.5L35.5,125c-23.4-20.7-23.4-54.3,0-75C47.3,39.5,62.9,35,79.5,35s32.2,4.5,44,14l6.5,5.7l6.5-5.7c11.8-9.5,27.5-14,44-14s32.2,4.5,44,14c23.4,20.7,23.4,54.3,0,75l-60.3,53.5C103,179.5,101.5,180,100,180z"/></svg>',
    circle: '<svg viewBox="0 0 200 200"><circle fill="{{fillColor}}" cx="100" cy="100" r="90"/></svg>',
    square: '<svg viewBox="0 0 200 200"><rect fill="{{fillColor}}" x="20" y="20" width="160" height="160"/></svg>',
    triangle: '<svg viewBox="0 0 200 200"><polygon fill="{{fillColor}}" points="100,20 180,180 20,180"/></svg>',
    flower: '<svg viewBox="0 0 200 200"><path fill="{{fillColor}}" d="M100,100 m-40,0 a40,40 0 1,0 80,0 a40,40 0 1,0 -80,0 M100,100 m-28.28,-28.28 a40,40 0 1,0 56.56,56.56 a40,40 0 1,0 -56.56,-56.56 M100,100 m0,-40 a40,40 0 1,0 0,80 a40,40 0 1,0 0,-80"/></svg>'
  };
  const svgStar = '<svg class="star-svg" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 200 200"><polygon id="star" fill="{{fillColor}}" points="100,0,129.38926261462365,59.54915028125263,195.10565162951536,69.09830056250526,147.55282581475768,115.45084971874736,158.77852522924732,180.90169943749473,100,150,41.2214747707527,180.90169943749476,52.447174185242325,115.45084971874738,4.894348370484636,69.09830056250527,70.61073738537632,59.549150281252636"></polygon></svg>';

  const [activePaletteColorIndex, setActivePaletteColorIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<Tools>(Tools.Pencil);
  const [paths, setPaths] = useState<IPath[]>([]);
  const [circles, setCircles] = useState<ICircle[]>([]);
  const [stamps, setStamps] = useState<IStamp[]>([]);
  const [currentPath, setCurrentPath] = useState<IPath | null>(null);
  const canvasRef = useRef<any>(null);

  // Handle drawing paths
  const pan = Gesture.Pan()
    .runOnJS(true)
    .onStart((g) => {
      if (activeTool === Tools.Pencil) {
        const newPath: IPath = {
          segments: [`M ${g.x} ${g.y}`],
          color: paletteColors[activePaletteColorIndex],
        };
        setCurrentPath(newPath);
      }
    })
    .onUpdate((g) => {
      if (activeTool === Tools.Pencil && currentPath) {
        setCurrentPath(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            segments: [...prev.segments, `L ${g.x} ${g.y}`]
          };
        });
      }
    })
    .onEnd(() => {
      if (activeTool === Tools.Pencil && currentPath) {
        setPaths(prev => [...prev, currentPath]);
        setCurrentPath(null);
      }
    });

  // Handle stamps
  const tap = Gesture.Tap()
    .runOnJS(true)
    .onStart((g) => {
      if (activeTool === Tools.Stamp) {
        const newStamp: IStamp = {
          x: g.x - 25,
          y: g.y - 25,
          color: paletteColors[activePaletteColorIndex],
        };
        setStamps(prev => [...prev, newStamp]);
      }
    });

  // Combine gestures
  const gesture = Gesture.Exclusive(pan, tap);

  const clearCanvas = () => {
    setPaths([]);
    setCircles([]);
    setStamps([]);
    setCurrentPath(null);
  };

  const paletteVisible = useSharedValue(false);
  const animatedPaletteStyle = useAnimatedStyle(() => ({
    top: withSpring(paletteVisible.value ? -275 : -100),
    height: withTiming(paletteVisible.value ? 200 : 50),
    opacity: withTiming(paletteVisible.value ? 1 : 0, { duration: 100 }),
  }));

  const animatedSwatchStyle = useAnimatedStyle(() => ({
    top: withSpring(paletteVisible.value ? -50 : 0),
    height: paletteVisible.value ? 0 : 50,
    opacity: withTiming(paletteVisible.value ? 0 : 1, { duration: 100 }),
  }));

  const saveCanvas = async () => {
    try {
      if (!canvasRef.current) {
        console.log('Canvas ref is null');
        return;
      }
      
      const snapshot = canvasRef.current.makeImageSnapshot();
      
      if (!snapshot) {
        console.log('Snapshot creation failed');
        return;
      }
      
      console.log('Drawing File:', snapshot);
      onSave(snapshot);
      onClose();
    } catch (error) {
      console.error('Error saving canvas:', error);
    }
  };

  return (
    <GestureHandlerRootView style={style}>
      <GestureDetector gesture={gesture}>
        <Canvas ref={canvasRef} style={{ flex: 8 }}>
          {paths.map((p, index) => (
            <Path
              key={index}
              path={p.segments.join(" ")}
              strokeWidth={strokeWidth || 5}
              style="stroke"
              color={p.color}
            />
          ))}
          {currentPath && (
            <Path
              path={currentPath.segments.join(" ")}
              strokeWidth={strokeWidth || 5}
              style="stroke"
              color={currentPath.color}
            />
          )}
          {stamps.map((s, index) => {
            const image = Skia.SVG.MakeFromString(
              svgStar.replace("{{fillColor}}", s.color)
            );
            if (!image) return null;
            return (
              <ImageSVG
                key={index}
                width={50}
                height={50}
                x={s.x}
                y={s.y}
                svg={image}
              />
            );
          })}
        </Canvas>
      </GestureDetector>

      <View style={{ padding: 10, flex: 1, backgroundColor: "#edede9" }}>
        <View style={{ flex: 1, flexDirection: "row" }}>
          <Animated.View
            style={[
              { padding: 10, position: "absolute", width: 60 },
              animatedPaletteStyle,
            ]}
          >
            {paletteColors.map((c, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setActivePaletteColorIndex(i);
                  paletteVisible.value = false;
                }}
              >
                <View
                  style={[
                    { backgroundColor: c },
                    styles.paletteColor,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </Animated.View>
          
          <View style={styles.swatchContainer}>
            <TouchableOpacity
              onPress={() => {
                paletteVisible.value = !paletteVisible.value;
              }}
            >
              <Animated.View
                style={[
                  {
                    backgroundColor: paletteColors[activePaletteColorIndex],
                  },
                  styles.swatch,
                  animatedSwatchStyle,
                ]}
              />
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => setActiveTool(
                activeTool === Tools.Pencil ? Tools.Stamp : Tools.Pencil
              )}
            >
              <FontAwesome5
                name={activeTool === Tools.Pencil ? "pencil-alt" : "stamp"}
                style={styles.icon}
              />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={saveCanvas}>
              <MaterialIcons name="save-alt" size={40} color="black" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={clearCanvas}>
              <Ionicons name="trash-outline" style={styles.icon} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  icon: {
    fontSize: 40,
    textAlign: "center",
  },
  paletteColor: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginVertical: 5,
    zIndex: 2,
  },
  swatch: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderColor: "black",
    marginVertical: 5,
    zIndex: 1,
  },
  swatchContainer: {
    flexDirection: "row",
    flex: 1,
    padding: 10,
    justifyContent: "space-between",
    alignItems: "center",
  },
});

export default Draw;