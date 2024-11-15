import { create } from 'zustand';
import { MediaStore, mediaDataProps } from '@/utils/types';
import { 
  
} from '@/lib/apiHelper';


export const useMediaStore = create<MediaStore>((set) => ({
  getPhotoForAvatar: false,
  selectedMediaFile: null,
  selectedMedia: null,
  mediaData: {              
    images: [],
    videos: [],
    drawings: []
  },
  setSelectedMedia: (file: string | null) => set({ selectedMedia: file }),

  userMediaFiles: ({ file }: { file: string }) => {
    set({ selectedMediaFile: file });    
    return file;
  },
  setSelectedMediaFile: (file: string | null) => set({ selectedMediaFile: file }),  
  
  setMediaData: (newData: mediaDataProps) => set({ mediaData: newData }),

  handleSelect: (fileUrl: string) =>
    set((state) => ({
        selectedMedia: state.selectedMedia === fileUrl ? null : fileUrl,
    })),

  setGetPhotoForAvatar: (value: boolean) => {
    set({ getPhotoForAvatar: value });
    console.log('Setting getPhotoForAvatar:', value);
    console.log("Current state in store:", useMediaStore.getState().getPhotoForAvatar);
  },
}));
