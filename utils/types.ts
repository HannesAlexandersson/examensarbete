import { Image } from "react-native-reanimated/lib/typescript/Animated";
import { StyleProp, ViewStyle } from "react-native";

export type User = {
  id: string | null;
  first_name: string;
  last_name: string;
  email: string;
  first_time: boolean;
  selected_option: string | null;  
  avatar_url?: string | null;  
  description?: string;
  date_of_birth?: Date | null;
  selected_version: number | null;
};

export type EventSource = {
  id: number;
  date: string;
  type: string;
  title: string;
  icon: Image;
};

export type AuthContextType = {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (firstname: string, lastname: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  selectedOption: number;
  userAge: number | null;
  userAvatar: string | null;
  setSelectedOption: (option: number) => void;
  userMediaFiles: ({ file }: { file: string; }) => string | null
  selectedMediaFile: string | null;
  setSelectedMediaFile: (file: string | null) => void;
  getPhotoForAvatar?: boolean;
  setGetPhotoForAvatar: (value: boolean) => void;
  editUser: (id: string, firstname: string, lastname: string, email: string, dateOfBirth: Date, avatarUrl: string, userDescription: string, selectedOption: number) => Promise<void>;
};

export type OnboardingText = {
  title: string;
  paragraph: string;
  position: number;
};

export type VersionDescriptions = {
  version: string;
  paragraph: string;
  position: number;
};

export type RoundCheckmarkProps = {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

export type CheckmarkOptions = {
  id: number;
  label: string;
}

export type TypographyProps = {
  children: React.ReactNode;
  variant?: 'black' | 'white' | 'blue';
  weight?: '300' | '400' | '500' | '600' | '700';
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'h1' | 'h2' | 'h3';
  className?: string; 
}

export type ButtonProps = {
  children: React.ReactNode;
  variant?: 'black' | 'blue' | 'outlined' | 'white';  
  size?: 'sm' | 'md' | 'lg';
  className?: string; 
  onPress?: () => void;
}

export type CameraMode = 'picture' | 'video';

export type AuthStackParamList = {
	Login: undefined;
	Register: undefined;
	ForgetPassword: undefined;
};

export interface DiaryEntry {
  titel: string;
  text: string;
  image?: string | null;
  video?: string | null;
  drawing?: string | null;
  date?: Date ;
}

export interface IPath {
  segments: String[];
  color?: string;
}

export interface ICircle {
  x: number;
  y: number;
}
export interface IStamp {
  x: number;
  y: number;
  color: string;
}

export enum Tools {
  Pencil,
  Stamp,
}

export interface DrawProps {
  style?: StyleProp<ViewStyle>; 
  onSave: (drawing: string) => void; 
  strokeColor: string;
  strokeWidth: number;
  onClose: () => void;
}