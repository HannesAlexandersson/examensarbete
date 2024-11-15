import { Image } from "react-native-reanimated/lib/typescript/Animated";
import { StyleProp, ViewStyle } from "react-native";
import { SkImage } from "@shopify/react-native-skia";

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
  own_medicins?: OwnAddedMedicinProps[] | null;
  medicins?: MedicinProps[] | null;
  diary_entries?: DiaryEntry[] | null;
  events?: EventSource[] | null;
  diagnoses?: DiagnosisProps[] | null;
  answers?: string[] | null;
  departments?: DepartmentProps[] | null;
  staff?: StaffProps[] | null;
  procedures?: ProcedureProps[] | null;
};

export type EventSource = {
  id: number;
  date: string;
  type: string;
  title: string;
  icon: Image;
};

export type EventProps = {
  id: string | null;
  date: Date | null;
  event_type: string | null;
  event_name: string | null;
  profile_id: string | null;  
  event_details?: Answers[] | null; 
};

export type Answers = {
  id: string;
  question_id: string;
  profile_id: string;
  answer_txt: string;
  created_at: string;
};

export interface AnswerStore {
  answers: Answers[];
  fetchAnswers: (id: string) => Promise<void>;
}

export interface MediaStore {
  selectedMediaFile: string | null;
  getPhotoForAvatar?: boolean;
  setSelectedMediaFile: (file: string | null) => void;
  setGetPhotoForAvatar: (value: boolean) => void;
}

export interface UserStore {
  id: string | null;
  first_name: string;
  last_name: string;
  user_email: string;
  first_time: boolean;
  selected_option: number | null;  
  avatar_url?: string;  
  description?: string;
  date_of_birth?: Date | null;
  selected_version: number | null;
  userAvatar: string | null;
  userAge: number | null;
  getUserData: (id: string) => Promise<void>;
  getAvatar: (url: string) => Promise<void>;
  getAge: (dateOfBirth: Date) => void;
  updateUser: (updates: Partial<UserStore>) => void;
  moveAvatarToPictures: (oldAvatarUrl: string) => Promise<void>; 
};

export interface FullViewModalProps {
  isVisible: boolean;
  onClose: () => void;
  event: Answers | null;
}

export type AuthContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (firstname: string, lastname: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /* selectedOption: number; */
  /* userAge: number | null; */
  contactIds?: ContactIds[] | null;
  setContactIds: (contactIds: ContactIds[]) => void;  
  getContactIds: (userId: string) => Promise<never[] | undefined>;
  /* answers: Answers[];
  getAnswers: (userId: string) => Promise<Answers[] | undefined>;
  setAnswers: (answers: Answers[]) => void; */
  response: string | null;
  setResponse: (response: string | null) => void;
  /* userAvatar: string | null; */
  /* setSelectedOption: (option: number) => void; */
  /* userMediaFiles: ({ file }: { file: string; }) => string | null
  selectedMediaFile: string | null;
  setSelectedMediaFile: (file: string | null) => void;
  getPhotoForAvatar?: boolean; */
  /* setGetPhotoForAvatar: (value: boolean) => void; */
  fetchMedicins: (id: string) => Promise<{ medicins: MedicinProps[]; own_medicins: OwnAddedMedicinProps[]; }>;
  editUser: (id: string, firstname: string, lastname: string, email: string, dateOfBirth: Date, avatarUrl: string, userDescription: string, selectedOption: number) => Promise<void>;
  fetchUserEntries: (limitEntries: boolean, id: string | null) => Promise<DiaryEntry[] | undefined>;  
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

export type mediaDataProps = {
  images: string[];  
  drawings: string[];
  videos: string[];
}

export type MediaEntry = {
  image_url?: string | null;
  video_url?: string | null;
  drawing_url?: string | null;
  description?: string | null;
};

export type UserMediaForDepartment = {
  department_id: string | null;
  media: MediaEntry;
};

export type AccountVersion = {
  version?: string;
  welcomeText?: string;
  questionButtonText?: string;
  diaryButtonText?: string;
  questionText?: string;
}

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
  image_url?: string | null;
  video_url?: string | null;
  drawing_url?: string | null;
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
  onSave: OnSaveFunction; 
  strokeColor: string;
  strokeWidth: number;
  onClose: () => void;
}
type OnSaveFunction = (drawing: SkImage) => void;


export type FilelikeObject = {
  uri: string;
  name: string;
  type: string;
};

export interface DiaryMediaUpload {
  type: string;
  url: string;
  uri?: string;
}

export type OwnAddedMedicinProps = {
  id?: number;
  namn: string;
  ordination: string;
  utskrivare: string;
  avdelning: string;
  doktor_namn?: string | null;
  avd_namn?: string | null;
  medicin_namn?: string | null;
  fritext?: string | null;
  user_id?: string | null;
};

export type MedicinProps = {
  id: string;
  name: string;
  ordination: string;
  utskrivande_avdelning: string;
  utskrivare: string;
  utskrivare_name?: string | null;
  ordinationName?: string | null;
  user_id: string;  
};

export type EnrichMedicinProps = {
  medicin?: MedicinProps;
  utskrivareName: string | null;
  ordinationName: string | null;
};

export type DepartmentProps = {
  id: string | null;
  name: string | null;
  address: string | null;
  phonenumber: string | null;
  mediaUrls?: MediaEntry | null;
};

export type StaffProps = {
  id?: string;
  staff_name: string | null;
  staff_occupation: string | null;
  department_id: string | null;  
};

export type ContactsProps = {
  _C_department_id?: string | null;
  _C_staff_id?: string | null;
  name: string | null;
  contactperson: string | null;
  phonenumber: string | null;
  address: string | null;
  media?: MediaEntry;  
};

export interface DepartmentMedia {
  department_id: string;
  media: {
    image_url: string | null;
    video_url: string | null;
    drawing_url: string | null;
  }
}

export type ContactIds = {
  department_id?: string | null;
  staff_id?: string | null;
}

export type CompContProps = {
  contacts: ContactsProps[] | null;
  setContacts: (contacts: ContactsProps[] | null) => void;
  contactIds: ContactIds[];
  departments: DepartmentProps[];
  staff: StaffProps[];
}

export interface QuestionProps {
  id: string | null;
  sender_id: string | null;
  reciver_id: string | null;
  msg_text: string | null;
  reciver_name: string | null;
  contact_name: string | null;
  sender_name: string | null;
  answerd?: boolean | null;
}

export type ProcedureProps = {
  id: string | null;
  procedure_title: string | null;
  procedure_text: string | null;
  user_id?: string | null;
  procedure_img?: string | null;
  procedure_video?: string | null;
  procedure_drawing?: string | null;
}

export interface MediaPickerProps {
  setSelectedImage: (uri: string | null) => void;
  setSelectedVideo: (uri: string | null) => void;
}

export interface DrawingPickerProps {
  setDrawing: (drawing: FilelikeObject | null) => void;
  setDrawingPreview: (preview: string | null) => void;
  isDrawingMode: boolean;
  setIsDrawingMode: (mode: boolean) => void;
}

export type MediaUpload = {
  type: string;
  url: string;
}

export type DiagnosisProps = {
  id: string | null;
  name: string | null;
  image?: string | null;
  drawing?: string | null;
  video?: string | null;
  description: string | null;
  department?: string | null;
}