import { StatusBar } from "expo-status-bar";
import React, {useState, useRef } from "react";
import { router } from 'expo-router';
import {View, Dimensions, TouchableOpacity, StyleSheet } from "react-native";
import {Gesture, GestureDetector, GestureHandlerRootView} from "react-native-gesture-handler";
import {Canvas, Circle, Path, Skia, ImageSVG} from "@shopify/react-native-skia";
import Animated, {useSharedValue, withTiming, useAnimatedStyle, withSpring} from "react-native-reanimated";
import { Ionicons, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { IPath, ICircle, IStamp, Tools, DrawProps } from "@/utils/types";



const Draw: React.FC<DrawProps> = ({ style, onSave, onClose, strokeColor, strokeWidth }) =>{
  const { width, height } = Dimensions.get("window");

  const paletteColors = ["red", "green", "blue", "yellow", "black"];

  const svgStar =
    '<svg class="star-svg" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/2000/xlink" viewBox="0 0 200 200"><polygon id="star" fill="{{fillColor}}" points="100,0,129.38926261462365,59.54915028125263,195.10565162951536,69.09830056250526,147.55282581475768,115.45084971874736,158.77852522924732,180.90169943749473,100,150,41.2214747707527,180.90169943749476,52.447174185242325,115.45084971874738,4.894348370484636,69.09830056250527,70.61073738537632,59.549150281252636"></polygon></svg>';

  const [activePaletteColorIndex, setActivePaletteColorIndex] = useState(0);
  const [activeTool, setActiveTool] = useState<Tools>(Tools.Pencil);
  const [paths, setPaths] = useState<IPath[]>([]);
  const [circles, setCircles] = useState<ICircle[]>([]);
  const [stamps, setStamps] = useState<IStamp[]>([]);
  const canvasRef = useRef<any>(null);


  const pan = Gesture.Pan()
    .runOnJS(true)
    .onStart((g) => {
      if (activeTool === Tools.Pencil) {
        const newPaths = [...paths];
        newPaths[paths.length] = {
          segments: [],
          color: paletteColors[activePaletteColorIndex],
        };
        newPaths[paths.length].segments.push(`M ${g.x} ${g.y}`);
        setPaths(newPaths);
      }
    })
    .onUpdate((g) => {
      if (activeTool === Tools.Pencil) {
        const index = paths.length - 1;
        const newPaths = [...paths];
        if (newPaths?.[index]?.segments) {
          newPaths[index].segments.push(`L ${g.x} ${g.y}`);
          setPaths(newPaths);
        }
      }
    })
    .onTouchesUp((g) => {
      if (activeTool === Tools.Pencil) {
        const newPaths = [...paths];
        setPaths(newPaths);
      }
    })
    .minDistance(1);

  const tap = Gesture.Tap()
    .runOnJS(true)
    .onStart((g) => {
      if (activeTool === Tools.Stamp) {
        setStamps([
          ...stamps,
          {
            x: g.x - 25,
            y: g.y - 25,
            color: paletteColors[activePaletteColorIndex],
          },
        ]);
      }
    });

  const clearCanvas = () => {
    setPaths([]);
    setCircles([]);
    setStamps([]);
  };

  const paletteVisible = useSharedValue(false);
  const animatedPaletteStyle = useAnimatedStyle(() => {
    return {
      top: withSpring(paletteVisible.value ? -275 : -100),
      height: withTiming(paletteVisible.value ? 200 : 50),
      opacity: withTiming(paletteVisible.value ? 100 : 0, { duration: 100 }),
    };
  });

  const animatedSwatchStyle = useAnimatedStyle(() => {
    return {
      top: withSpring(paletteVisible.value ? -50 : 0),
      height: paletteVisible.value ? 0 : 50,
      opacity: withTiming(paletteVisible.value ? 0 : 100, { duration: 100 }),
    };
  });

  const saveCanvas = async () => {
    try {
      if (!canvasRef.current) {
        console.log('Canvas ref is null');
        return;
      }
  
      // Take a snapshot of the current canvas state
      const snapshot = canvasRef.current.makeImageSnapshot();  // Use correct method
      
      if (!snapshot) {
        console.log('Snapshot creation failed');
        return;
      }
      
      const base64Image = snapshot.encodeToBase64(); 
  
      if (base64Image) {
        console.log('Base64 Image:', base64Image); // Optional, just for checking
        onSave(base64Image); // Pass the base64 string to the parent component
      }
  
      onClose();  
    } catch (error) {
      console.error('Error saving canvas:', error);  // Log any error that occurs
    }
  };

  return (
    <>
      <GestureHandlerRootView>
        <View style={style}>
          <GestureDetector gesture={tap}>
            <GestureDetector gesture={pan}>
              <Canvas ref={canvasRef} style={{ flex: 8 }}>
                {circles.map((c, index) => (
                  <Circle key={index} cx={c.x} cy={c.y} r={10} />
                ))}
                {paths.map((p, index) => (
                  <Path
                    key={index}
                    path={p.segments.join(" ")}
                    strokeWidth={5}
                    style="stroke"
                    color={p.color}
                  />
                ))}
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
                        {
                          backgroundColor: c,
                        },
                        styles.paletteColor,
                      ]}
                    ></View>
                  </TouchableOpacity>
                ))}
              </Animated.View>
              <View style={styles.swatchContainer}>
                <TouchableOpacity
                  onPress={() => {
                    paletteVisible.value !== true
                      ? (paletteVisible.value = true)
                      : (paletteVisible.value = false);
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
                <View>
                  {activeTool === Tools.Pencil ? (
                    <TouchableOpacity
                      onPress={() => setActiveTool(Tools.Stamp)}
                    >
                      <FontAwesome5
                        name="pencil-alt"
                        style={styles.icon}
                      ></FontAwesome5>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      onPress={() => setActiveTool(Tools.Pencil)}
                    >
                      <FontAwesome5
                        name="stamp"
                        style={styles.icon}
                      ></FontAwesome5>
                    </TouchableOpacity>
                  )}
                </View>
                <TouchableOpacity onPress={() => {                  
                  saveCanvas();
                }}>

                  <MaterialIcons name="save-alt" size={40} color="black" />
                </TouchableOpacity>
                <TouchableOpacity onPress={clearCanvas}>
                  <Ionicons
                    name="trash-outline"
                    style={styles.icon}
                  ></Ionicons>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
      <StatusBar style="auto" />
    </>
  );
}

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