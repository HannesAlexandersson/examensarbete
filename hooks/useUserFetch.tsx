import { useState } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { User } from '@/utils/types';

export const useUserFetch = () => {
  const [user, setUser] = useState<User | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const router = useRouter();

  const getUser = async (id: string) => {
    try {
      // Fetch user profile
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (userError) throw userError;

      // Fetch medicines
      const { data: medicinsData, error: medicinsError } = await supabase
        .from('medicines')
        .select(`
          *,
          Staff:utskrivare (id, staff_name),
          Departments:utskrivande_avdelning (id, name)
        `)
        .eq('user_id', id);

      if (medicinsError) throw medicinsError;

      // Process user data
      if (userData.date_of_birth) {
        userData.date_of_birth = new Date(userData.date_of_birth);
      }

      // Process medicines data
      const enrichedMedicins = medicinsData.map((med) => ({
        ...med,
        utskrivare_name: med.Staff?.staff_name || 'Okänd utskrivare',
        ordinationName: med.Departments?.name || 'Okänd avdelning',
      }));

      // Combine user and medicines data
      const updatedUser: User = {
        ...userData,
        medicins: enrichedMedicins,
        own_medicins: [], // Populate this if needed
        diary_entries: userData.diary_entries || [],
        events: userData.events || [],
      };

      setUser(updatedUser);

      // Handle first-time user
      if (userData.first_time) {
        router.push('/onboarding');
      } else {
        // Fetch avatar if exists
        if (userData.avatar_url) {
          const { data: avatarData, error: avatarError } = await supabase.storage
            .from('avatars')
            .download(userData.avatar_url);

          if (avatarError) throw avatarError;

          const reader = new FileReader();
          reader.onloadend = () => {
            if (typeof reader.result === 'string') {
              setUserAvatar(reader.result);
            }
          };
          reader.readAsDataURL(avatarData);
        }

        router.push('/(tabs)');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  return { user, userAvatar, getUser };
};