import { Image } from "react-native-reanimated/lib/typescript/Animated";

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
  selectedOption: number | null;
  userAge: number | null;
  userAvatar: string | null;
  setSelectedOption: (option: number | null) => void;
  userMediaFiles: ({ file }: { file: string; }) => string | null
  selectedMediaFile: string | null;
  setSelectedMediaFile: (file: string | null) => void;
  getPhotoForAvatar?: boolean;
  setGetPhotoForAvatar: (value: boolean) => void;
  editUser: (id: string, firstname: string, lastname: string, email: string, dateOfBirth: Date, avatarUrl: string, userDescription: string) => Promise<void>;
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