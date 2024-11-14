import { create } from 'zustand';
import { MediaStore } from '@/utils/types';
import { 
  
} from '@/lib/apiHelper';


export const useMediaStore = create<MediaStore>((set) => ({
  selectedMediaFile: null,
  getPhotoForAvatar: false,

  setSelectedMediaFile: (file: string | null) => set({ selectedMediaFile: file }),
  setGetPhotoForAvatar: (value: boolean) => set({ getPhotoForAvatar: value }), 
}));

