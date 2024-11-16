import { create } from 'zustand';
import { fetchContactIds, fetchDepartmentsAndStaff } from '@/lib/apiHelper';
import { DepartmentStore } from '@/utils/types';

export const useDepartmentsStore = create<DepartmentStore>((set) => ({
  departments: null,
  staff: null,
  contactIds: [],
  setDepartments: (departments) => set({ departments }),
  setStaff: (staff) => set({ staff }),
  setContactIds: (contactIds) => set({ contactIds }),
  
  fetchContactIds: async (userId: string) => {
    const contactIds = await fetchContactIds(userId);
    set({ contactIds });
  },

  getDepartmentsandStaff: async () => {
    try {
      const { departments, staff } = await fetchDepartmentsAndStaff();
      set({ departments, staff });
    } catch (error) {
      console.error('Error fetching departments and staff:', error);
      set({ departments: [], staff: [] });
    }
  },
}));