import { B } from '@faker-js/faker/dist/airline-C5Qwd7_q';
import { supabase } from '../utils/supabase';

export const fetchUserDataFromProfilesTable = async (userId: string) => {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) throw error;
  return data;
};

export const fetchUserAvatarFromAvatarBucket = async (avatarUrl: string) => {  
  const { data, error } = await supabase.storage
  .from('avatars')
  .download(avatarUrl);
  if (error) throw error;

  return data as Blob;
};

export const calculateAge = (dateOfBirth: Date) => { 
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    return age;
};