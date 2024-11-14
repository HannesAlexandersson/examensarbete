import { supabase } from '../utils/supabase';
import { Answers } from '@/utils/types';

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

export const getFullUrl = async(path: string) => {

  const { data } = await supabase.storage
  .from('avatars')
  .getPublicUrl(path);
  

  return data;
}

export const moveAvatarToPictures = async (oldAvatarUrl: string) => {  

  if (!oldAvatarUrl) {
    console.error('Old avatar path is undefined or empty.');
    return; 
  } 
  
  const { data: moveData, error: moveError } = await supabase.storage
  .from('avatars') 
  .move(oldAvatarUrl, `${oldAvatarUrl}`, {
    destinationBucket: 'pictures' 
  });

  if (moveError) {
    console.error('Failed to copy avatar:', moveError);
    return;
  }  
};

export const calculateAge = (dateOfBirth: Date) => { 
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    const age = today.getFullYear() - birthDate.getFullYear();
    return age;
};

export const getAnswers = async (id: string) => {
  const { data, error } = await supabase
  .from('Answers')
  .select('*')
  .eq('profile_id', id);
  if (error) {
    console.error('Error fetching answers:', error);
    return [];
  }
  
  return data as Answers[]; 
};