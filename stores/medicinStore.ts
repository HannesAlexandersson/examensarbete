import { create } from 'zustand';
import { fetchMedicins, fetchDetailsForMedicins } from '@/lib/apiHelper';
import { MedicinProps, OwnAddedMedicinProps, MedicineStore } from '@/utils/types';


export const useMedicineStore = create<MedicineStore>((set, get) => ({
  user_medicins: [],
  user_own_medicins: [],
  setUserOwnMedicins: (ownMedicins: OwnAddedMedicinProps[]) => 
    set({ user_own_medicins: ownMedicins }),
  setUserMedicins: (medicins: MedicinProps[]) =>
    set({ user_medicins: medicins }),

  fetchMedicins: async (userId: string) => {
    try {
      const { medicins, own_medicins } = await fetchMedicins(userId);
      set({ user_medicins: medicins, user_own_medicins: own_medicins });
    } catch (error) {
      console.error("Error fetching medicins:", error);
      set({ user_medicins: [], user_own_medicins: [] });
    }
  },

  enrichMedicins: async () => {
    try {
      const { user_medicins } = get(); //get current state
      const enrichedMedicins = await fetchDetailsForMedicins(user_medicins);
      set({ user_medicins: enrichedMedicins }); //update state with enriched data
    } catch (error) {
      console.error("Error enriching medicins:", error);
    }
  },
  
}));