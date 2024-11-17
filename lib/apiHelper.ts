import { supabase, supabaseUrl } from '@/utils/supabase';
import { 
  Answers, 
  DiaryEntry, 
  QuestionProps, 
  MedicinProps, 
  DiagnosisProps,
  ProcedureProps,
  MediaUpload
} from '@/utils/types';

export const insertProfileWithRetry = async (profile: any, retries = 3, delay = 500): Promise<any> => {
  while (retries > 0) {
    const { data: profileData, error } = await supabase
      .from('profiles')
      .insert(profile)
      .select();

    if (!error && profileData && profileData.length > 0) {
      return profileData[0]; // Successfully inserted and fetched
    }

    retries--;
    if (retries > 0) {
      console.log(`Retrying profile insertion... Attempts left: ${retries}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Failed to insert profile after retries');
};

export const getProcedures = async (id: string) => {  
  const query = supabase
  .from('Procedures')
  .select('*')
  .eq('user_id', id);
  
  try{    
    const { data: procedureEntrys, error: procedureErrors } = await query;

    if(procedureErrors) {
      console.error(procedureErrors);
      return [];
    }

    //map the database fields to the entry structure
    const formattedProcedures: ProcedureProps[] = await Promise.all(
      procedureEntrys?.map(async(procedure: any) => {
        const mediaUrls = await getMediaFiles(procedure, 'procedureMedia');
        
        return {
          id: procedure.id,
          procedure_title: procedure.procedure_title,
          procedure_text: procedure.procedure_text,
          user_id: procedure.user_id,
          procedure_img: mediaUrls.img || null,
          procedure_video: mediaUrls.video || null,
          procedure_drawing: mediaUrls.drawing || null,
        };
      })
    );

    
    return formattedProcedures;
  } catch (error) {
    console.error('Error fetching procedures:', error);
    return [];
  }
};

export const fetchDiagnosis = async (id: string) => {  
  const query = supabase
    .from('Diagnosis')
    .select('*')
    .eq('user_id', id);

  try{
    const { data: diagnosisData, error: diagnosisError } = await query
    

    if (diagnosisError) {
      console.error(diagnosisError);
      return [];
    }

    //map the database fields to the entry structure
    const formattedDiagnoses: DiagnosisProps[] = await Promise.all(
      diagnosisData?.map(async (diagnosis: any) => {
        const mediaUrls = await getMediaFiles(diagnosis, 'diagnosisMedia');

        return {
          id: diagnosis.id,
          name: diagnosis.name,
          description: diagnosis.description,
          department: diagnosis.treating_department_name,
          department_id: diagnosis.treating_department_id,
          image: mediaUrls.image || null,
          video: mediaUrls.video || null,
          drawing: mediaUrls.drawing || null,
        };
      })
    ); 

    return formattedDiagnoses;

  } catch (error) {
    console.error('Error in fetchDiagnosis:', error);
    return [];
  }
};

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

export const fetchuserDrawings = async (id: string, controller: any) => {
  if (!id) {
    console.error('User ID is missing');
    return;
  }

  try {      
    const { data: drawingRecords, error: drawingError } = await supabase
      .from('Drawings') 
      .select('*')
      .eq('user_id', id)
      .abortSignal(controller.signal); 

    if (drawingError) {
      console.error('Error fetching drawings from the database:', drawingError);
      return;
    }

    if (!drawingRecords || drawingRecords.length === 0) {
      console.log('No drawings found for this user.');
      return;
    }
    
    const drawingUrls = await Promise.all(
      drawingRecords.map(async (drawing) => {
        const { drawing_uri } = drawing;
        
        const { data: fileUrl } = supabase
          .storage
          .from('drawings')  
          .getPublicUrl(drawing_uri);  

          if (!fileUrl.publicUrl) {
            console.error('Failed to fetch public URL');
            return;
          }          

        return fileUrl.publicUrl; 
      })
    );

    const validUrls = drawingUrls.filter(Boolean) as string[]; 
    
    return validUrls;

  } catch (error: any) {
    if(error.name === 'AbortError') {
      console.log('Fetch aborted:', error);

    }else{
      console.error('Error fetching user drawings:', error);
    }
  } 
}

export const fetchUserImages = async (id: string, controller: any) => {
  //first check if user is logged in
  if (!id) {
    console.error('User ID is missing');
    return;
  }

  try {      
    const { data: imageRecords, error: imageError } = await supabase
      .from('Images') 
      .select('*')
      .eq('user_id', id)
      .abortSignal(controller.signal);

    if (imageError) {
      console.error('Error fetching images from the database:', imageError);
      return;
    }

    if (!imageRecords || imageRecords.length === 0) {
      console.log('No images found for this user.');
      return;
    }
    
    const mediaUrls = await Promise.all(
      imageRecords.map(async (image) => {
        const { image_uri } = image;

        // Fetch the public URL from the pictures bucket using image_uri from 'profiles'
        const { data: fileUrl } = supabase
          .storage
          .from('pictures')  
          .getPublicUrl(image_uri); 

          if (!fileUrl.publicUrl) {
            console.error('Failed to fetch public URL');
            return;
          }          

        return fileUrl.publicUrl; //return with the valid public URL
      })
    );

    const validUrls = mediaUrls.filter(Boolean) as string[]; //filter out non valids
    

   return validUrls;

  } catch (error: any) {
    if(error.name === 'AbortError') {
      console.log('Fetch aborted:', error);
    }else{
    console.error('Error fetching user images:', error);
  } 
}
};

export const fetchUserVideos = async (id: string, controller: any) => {    
  if (!id) {
    console.error('User ID is missing');
    return;
  }

  try {      
    const { data: videoRecords, error: videoError } = await supabase
      .from('videos') 
      .select('*')
      .eq('user_id', id)
      .abortSignal(controller.signal);

    if (videoError) {
      console.error('Error fetching videos from the database:', videoError);
      return;
    }

    if (!videoRecords || videoRecords.length === 0) {
      console.log('No videos found for this user.');
      return;
    }
    
    const videoUrls = await Promise.all(
      videoRecords.map(async (video) => {
        const { video_uri } = video;
        
        const { data: fileUrl } = supabase
          .storage
          .from('videos')  
          .getPublicUrl(video_uri);  

          if (!fileUrl.publicUrl) {
            console.error('Failed to fetch public URL');
            return;
          }          

        return fileUrl.publicUrl; 
      })
    );

    const validUrls = videoUrls.filter(Boolean) as string[]; 
    

   return validUrls;

  } catch (error: any) {
    if(error.name === 'AbortError') {
      console.log('Fetch aborted:', error);
    }else{
      console.error('Error fetching user videos:', error);
    }
  }
}; 

//fetch the users medicines from supabase table medicins to set the global state in the medicinstore
export const fetchMedicins = async (userId: string) => {
  try {
    //fetch the medicines associated with the user
    const { data: medicins, error: medicinsError } = await supabase
      .from('medicins')
      .select('*')
      .eq('user_id', userId);

    if (medicinsError) throw medicinsError;

    //fetch the users own added medicines
    const { data: ownMedicins, error: ownMedicinsError } = await supabase
      .from('Own_added_medicins')
      .select('*')
      .eq('user_id', userId);

    if (ownMedicinsError) throw ownMedicinsError;
    
    return {
      medicins: medicins || [],
      own_medicins: ownMedicins || []
    };
  } catch (error) {
    console.error('Error fetching medicines:', error);
    return {
      medicins: [],
      own_medicins: []
    };
  }
};

export const fetchDetailsForMedicins = async (medicins: MedicinProps[]): Promise<MedicinProps[]> => {
  if (!medicins || medicins.length === 0) return medicins;

  try {
    const staffIds = [...new Set(medicins.map((med) => med.utskrivare))];
    const departmentIds = [...new Set(medicins.map((med) => med.utskrivande_avdelning))];

    const [staffData, departmentData] = await Promise.all([
      supabase.from('Staff').select('id, staff_name').in('id', staffIds),
      supabase.from('Departments').select('id, name').in('id', departmentIds)
    ]);

    if (staffData.error) throw staffData.error;
    if (departmentData.error) throw departmentData.error;

    const staffLookup = Object.fromEntries(staffData.data.map(staff => [staff.id, staff.staff_name]));
    const departmentLookup = Object.fromEntries(departmentData.data.map(dept => [dept.id, dept.name]));

    return medicins.map((med) => ({
      ...med,
      utskrivare_name: staffLookup[med.utskrivare] || 'Okänd utskrivare',
      ordinationName: departmentLookup[med.utskrivande_avdelning] || 'Okänd avdelning',
    }));
  } catch (error) {
    console.error('Error fetching staff and department details:', error);
    return medicins;
  }
};

// Fetch contactIds for a user
export const fetchContactIds = async (userId: string) => {
  const { data, error } = await supabase.from('ProfilesDepartments').select('*').eq('profile_id', userId);
  if (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }
  return data.map((contact) => ({
    department_id: contact.department_id,
    staff_id: contact.staff_id
  }));
};

export const fetchDepartmentsAndStaff = async () => {
  try {
    const { data: departmentData, error: departmentError } = await supabase
    .from('Departments')
    .select('*');
    const { data: staffData, error: staffError } = await supabase
    .from('Staff')
    .select('*');

    if (departmentError) {
      console.error('Error fetching departments:', departmentError);
      return { departments: [], staff: [] };
    }

    if (staffError) {
      console.error('Error fetching staff:', staffError);
      return { departments: departmentData || [], staff: [] };
    }

    return {
      departments: departmentData || [],
      staff: staffData || [],
    };
  } catch (error) {
    console.error('Error fetching departments and staff:', error);
    return { departments: [], staff: [] };
  }
};

//check if the current user have added any media to the departments they connected to
export const getUserMediaForDepartments = async (userId: string) => {  

  const { data: mediaEntries, error: mediaError } = await supabase
    .from('User_Departments_mediaJunction')
    .select('media_id, department_id')
    .eq('user_id', userId);   

  if (mediaError) {
    console.error('Error fetching user media:', mediaError);
    return [];
  } 

  const mediaIds = mediaEntries.map(entry => entry.media_id);
  //get the actual media urls from the media table
  const { data: mediaData, error: mediaDetailsError } = await supabase
    .from('Media')
    .select('id, image_uri, video_uri, drawing_uri, media_description')
    .in('id', mediaIds);

  if (mediaDetailsError) {
    console.error('Error fetching media details:', mediaDetailsError);
    return [];
  } 
  const mediaWithUrls = mediaEntries.map(entry => {
    const media = mediaData.find(m => m.id === entry.media_id);
    const bucketUrl = `${supabaseUrl}/storage/v1/object/public`;
    return {
      department_id: entry.department_id,
      media: {
        image_url: media?.image_uri ? `${bucketUrl}/pictures/${media.image_uri}` : null,
        video_url: media?.video_uri ? `${bucketUrl}/videos/${media.video_uri}` : null,
        drawing_url: media?.drawing_uri ? `${bucketUrl}/drawings/${media.drawing_uri}` : null,
        description: media?.media_description || null
      },
    };
  });

  return mediaWithUrls;
};