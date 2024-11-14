import { create } from 'zustand';
import { UserStore } from '@/utils/types';
import { 
  fetchUserDataFromProfilesTable, 
  fetchUserAvatarFromAvatarBucket,
  calculateAge,
  moveAvatarToPictures 
} from '@/lib/apiHelper';

export const useUserStore = create<UserStore>((set) => ({  

  id: null,
  userAvatar: null,
  first_name: '',
  last_name: '',
  user_email: '',
  first_time: false,
  selected_option: 3,
  avatar_url: '',
  description: '',
  date_of_birth: null,
  selected_version: null,
  userAge: null,

  updateUser: (updates) => set((state) => ({ ...state, ...updates })),

  getUserData: async (id: string) => {
    
    if (!id) return;

    const data = await fetchUserDataFromProfilesTable(id);    

    set({
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name,
      user_email: data.email,
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
  },

  moveAvatarToPictures: async (oldAvatarUrl: string) => {
    await moveAvatarToPictures(oldAvatarUrl);
  }


}));

