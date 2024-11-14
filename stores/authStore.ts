import { create } from 'zustand';

import { 
  fetchUserDataFromProfilesTable, 
  fetchUserAvatarFromAvatarBucket,
  calculateAge 
} from '@/lib/apiHelper';


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
  userAge: number | null;
  getUserData: (id: string) => Promise<void>;
  getAvatar: (url: string) => Promise<void>;
  getAge: (dateOfBirth: Date) => void;
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
  userAge: null,

  getUserData: async (id: string) => {      
    console.log('hello')
    if (!id) return;

    const data = await fetchUserDataFromProfilesTable(id);    

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
  }, 

  getAvatar: async (url: string) => {    
    
    if (!url) return;
    const data = await fetchUserAvatarFromAvatarBucket(url);    

    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') set({ userAvatar: reader.result });
    };
    reader.readAsDataURL(data);
   
  },

  getAge: (dateOfBirth: Date) => { 
    set({ userAge: calculateAge(dateOfBirth) });
  }

}));

