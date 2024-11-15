import { create } from 'zustand';
import {  } from '@/utils/types';
import { 
  
} from '@/lib/apiHelper';

interface ResponseStore {
  response: string | null;
  setResponse: (response: string | null) => void;
}

export const useResponseStore = create<ResponseStore>((set) => ({

  response: null,

  setResponse: (response) => set({ response })
  
}));