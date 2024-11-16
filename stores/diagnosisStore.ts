import { create } from 'zustand';
import { DiagnosisProps } from '@/utils/types';
import { fetchDiagnosis } from '@/lib/apiHelper'

interface DiagnosisStore {
  diagnosis: DiagnosisProps[];
  fetchDiagnosis: (id: string) => Promise<void>;
  setDiagnosis: (diagnosis: DiagnosisProps[]) => void;
};

export const useDiagnosisStore = create<DiagnosisStore>((set) => ({
  diagnosis: [],
  fetchDiagnosis: async (id: string) => {
    const diagnosis = await fetchDiagnosis(id);
    set({ diagnosis });
  },
  setDiagnosis: (diagnosis: DiagnosisProps[]) => set({ diagnosis })
}));