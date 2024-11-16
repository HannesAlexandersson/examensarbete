import { create } from 'zustand';
import { DiaryEntry } from '@/utils/types';
import { 
  
} from '@/lib/apiHelper';

export interface DiaryStore {
  diary_entries?: DiaryEntry[] | null;
  setDiaryEntries: (entries: DiaryEntry[]) => void;
};

export const useDiaryStore = create<DiaryStore>((set) => ({
  diary_entries: [],

  setDiaryEntries: (entries: DiaryEntry[]) => set({ diary_entries: entries }),
}));