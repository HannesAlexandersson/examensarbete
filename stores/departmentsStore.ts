import { create } from 'zustand';
import { fetchContactIds, fetchDepartmentsAndStaff } from '@/lib/apiHelper';
import { DepartmentProps, StaffProps, ContactIds } from '@/utils/types';

export interface DepartmentStore {
  departments: DepartmentProps[] | null;
  staff: StaffProps[] | null;
  contactIds: ContactIds[];
  setDepartments: (departments: DepartmentProps[]) => void;
  setStaff: (staff: StaffProps[]) => void;
  setContactIds: (contactIds: ContactIds[]) => void;
  fetchContactIds: (userId: string) => Promise<void>;
  getDepartmentsandStaff: () => Promise<void>; 
}

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