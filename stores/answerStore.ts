import { create } from 'zustand';
import { AnswerStore } from '@/utils/types';
import { 
  getAnswers
} from '@/lib/apiHelper';


export const useAnswerStore = create<AnswerStore>((set) => ({
  answers: [],

  fetchAnswers: async (id: string) => {
    const answers = await getAnswers(id);
    set({ answers });
  }

}));