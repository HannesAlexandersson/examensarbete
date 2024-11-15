import { supabase } from '../utils/supabase';
import { Answers, DiaryEntry, QuestionProps } from '@/utils/types';

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

export const fetchUserEntries = async (limitEntries: boolean = true, id: string | null) => { 
   //first check if user is logged in
   if (!id) {
    console.error('User ID is missing');
    return;
  }

  try{      
    
    let query = supabase
    .from('diary_posts')
    .select('*')
    .eq('user_id', id)
    .order('created_at', { ascending: false });
      
      
    if (limitEntries) {
      query = query.limit(3); // Limit the initial number of entries to 3
    }

    const { data: diaryEntries, error: diaryError } = await query;

    if (diaryError) {
      console.error('Error fetching diary posts:', diaryError);
      return;
    }

    if (!diaryEntries || diaryEntries.length === 0) {
      console.log('No diary posts found for this user.');
      return;
    }

    //map the database fields to the entry structure
    const formattedEntries: DiaryEntry[] = await Promise.all(
      diaryEntries.map(async (entry: any) => {
        
        const mediaUrls = await getMediaFiles(entry, 'diary_media');

        return {
          titel: entry.post_title,   
          text: entry.post_text,   
          image: mediaUrls.image || null,  
          video: mediaUrls.video || null, 
          drawing: mediaUrls.drawing || null, 
          date: new Date(entry.post_date)  
        };
      })
    );
  
    
    return formattedEntries;
  } catch (error) {
    console.error('Error fetching user diary entries:', error);
    return [];
  }
};

//helper function for media handling in other functions
export const getMediaFiles = async (entry: any, bucket: string) => {
  const mediaUrls: any = {
    image: null,
    video: null,
    drawing: null,
  };

  // Fetch image URL if exists
  if (entry.image_url) {
    const { data: imageUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(entry.image_url); 
    if (imageUrl?.publicUrl) mediaUrls.image = imageUrl.publicUrl;
  }

  // Fetch video URL if exists
  if (entry.video_url) {
    const { data: videoUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(entry.video_url);  
    if (videoUrl?.publicUrl) mediaUrls.video = videoUrl.publicUrl;
  }

  // Fetch drawing URL if exists
  if (entry.drawing_url) {
    const { data: drawingUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(entry.drawing_url);
    if (drawingUrl?.publicUrl) mediaUrls.drawing = drawingUrl.publicUrl;
  }

  return mediaUrls;
}


export const fetchQuestions = async (id: string) => {
  if(!id) return;

  const { data, error } = await supabase
    .from('Questions')
    .select('*')
    .eq('sender_id', id);

  if(error) {
    console.error('error', error);
  }

  if(!data) return;

  if(data.length === 0) {
    console.log('No data');
    return;
  }
  const fetchedQuestions = data.map((question: QuestionProps) => {
    return {
      id: question.id,
      msg_text: question.msg_text,
      reciver_name: question.reciver_name,
      contact_name: question.contact_name,
      sender_name: question.sender_name,
      answerd: question.answerd,
      sender_id: question.sender_id,
      reciver_id: question.reciver_id,
    } 
  });    

  
  return fetchedQuestions;
}