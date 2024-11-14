import { create } from 'zustand';
import { supabase } from '../utils/supabase';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { 
  fetchUserDataFromProfilesTable, 
  fetchUserAvatarFromAvatarBucket 
} from '@/lib/apiHelper';
import { User, AuthContextType } from '@/utils/types';

interface UserStore {
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
  userAvatar: string | null;
  isUserLoaded: boolean;

  getUser: () => Promise<void>;
  getAvatar: () => Promise<void>;
};

export const useUserStore = create<UserStore>((set) => ({
  id: null,
  userAvatar: null,
  first_name: '',
  last_name: '',
  email: '',
  first_time: false,
  selected_option: '',
  avatar_url: '',
  description: '',
  date_of_birth: null,
  selected_version: null,
  isUserLoaded: false,

  getUser: async () => {
    const { user } = useAuth();
    
    set((state) => {
      if (state.isUserLoaded) return state; // If user data is already loaded, don't fetch again
      return {};      
    });
    
    if (!user || !user.id) {
      console.warn("Unauthorized access attempt detected.");
      return;
    }

    try {
      const { data, error } = await fetchUserDataFromProfilesTable(user.id);
      if (error) throw error;

      set({
        id: data.id,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        first_time: data.first_time,
        selected_option: data.selected_option,
        avatar_url: data.avatar_url,
        description: data.description,
        date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
        selected_version: data.selected_version,
      });
    } catch (error) {
      console.error("Failed to fetch user:", error);
    }
  }, 

  getAvatar: async () => {
    const { user } = useAuth();
    
    // If user data is already loaded, don't fetch again
    set((state) => {
      if (state.isUserLoaded) return state; 
      return {};      
    });
    //if user doesnt have an avatar url return
    if (!user?.id || !user.avatar_url) return;

    try {      
      const data = await fetchUserAvatarFromAvatarBucket(user.avatar_url);    

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') set({ userAvatar: reader.result });
      };
      reader.readAsDataURL(data);
    } catch (error) {
      console.error("Failed to fetch avatar:", error);
    }
  },

 
}));

