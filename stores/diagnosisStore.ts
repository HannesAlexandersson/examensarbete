import { create } from 'zustand';
import { DiagnosisProps, DiagnosisStore } from '@/utils/types';
import { fetchDiagnosis } from '@/lib/apiHelper'

export const useDiagnosisStore = create<DiagnosisStore>((set) => ({
  diagnosis: [],
  fetchDiagnosis: async (id: string) => {
    const diagnosis = await fetchDiagnosis(id);
    set({ diagnosis });
  },
  setDiagnosis: (diagnosis: DiagnosisProps[]) => set({ diagnosis })
}));