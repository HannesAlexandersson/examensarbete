import { create } from 'zustand';
import { ProcedureProps, ProcedureStore } from '@/utils/types';
import { getProcedures } from '@/lib/apiHelper';

export const useProcedureStore = create<ProcedureStore>((set) => ({
  procedures: [],
  setProcedures: (procedures: ProcedureProps[]) => set({ procedures }),
  getUserProcedures: async (userId: string) => {
    const user_procedures = await getProcedures(userId);
    set({ procedures: user_procedures });
  },
}));