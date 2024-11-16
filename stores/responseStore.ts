import { create } from 'zustand';
import { QuestionProps, QuestionStore } from '@/utils/types';
import { 
  fetchQuestions
} from '@/lib/apiHelper';

export const useQuestionStore = create<QuestionStore>((set) => ({

  response: null,
  questions: null,
  setResponse: (response) => set({ response }),

  getQuestions: async (id: string) => {
    const data = await fetchQuestions(id);
    if(!data) return;
    set({ questions: data });
  }
  
}));