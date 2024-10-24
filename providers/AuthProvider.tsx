import React, { useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';
import { User, AuthContextType, MedicinProps, ProcedureProps, ContactIds, DiaryEntry, Answers, DiagnosisProps } from '@/utils/types';

export const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children } : { children: React.ReactNode }) => {
//the user object is created here and used all over the app with the context
const [user, setUser] = React.useState<User | null>(null);
const router = useRouter();
const [userAge, setUserAge] = React.useState<number | null>(null);
const [userAvatar, setUserAvatar] = React.useState<string | null>(null);
const [selectedOption, setSelectedOption] = React.useState<number>(3);
const [selectedMediaFile, setSelectedMediaFile] = React.useState<string | null>(null);
const [getPhotoForAvatar , setGetPhotoForAvatar] = React.useState<boolean>(false);
const [contactIds, setContactIds] = React.useState<ContactIds[]>([]);
const [answers, setAnswers] = React.useState<Answers[]>([]);
const [ response, setResponse ] = React.useState<string | null>(null);

const [mediaFiles, setMediaFiles] = React.useState<string[]>([]);
const [videoFiles, setVideoFiles] = React.useState<string[]>([]);
const [drawingFiles, setDrawingFiles] = React.useState<string[]>([]);




const getUser = async (id: string) => {
  // get from supabase table "User" and select everything and the 'id' must equal the id we defined here and return it as single wich is a object and set that to the data object and i there is no errors set the user to data
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if(error) return console.error(error);

  
  if (data?.date_of_birth) {
    data.date_of_birth = new Date(data.date_of_birth);
  }

  // Call fetchMedicins to get medicines
  const medicins = await fetchMedicins(id);

  // Enrich medicines with staff and department details
  const enrichedMedicins = await fetchDetailsForMedicins(medicins.medicins);

  //call the fetch diaryposts function to get the users diary entries
  const diaryEntries = await fetchUserEntries(false, id);

  //get the departments and associated staff
  const { departments, staff } = await fetchDepartmentsAndStaff();

  //get the users diagoisis
  const diagnosis = await fetchDiagnosis(id);

  //get user procedures
  const procedures = await getProcedures(id);

  //call the get answers function to set the users answers
  await getAnswers(id);

  //set the users stored media
  await fetchUserImages(id);
  await fetchUserVideos(id);
  await fetchuserDrawings(id);

  const updatedUser: User = {
    ...data,
    own_medicins: medicins?.own_medicins || [],
    medicins: enrichedMedicins,
    diary_entries: diaryEntries || [], 
    departments: departments || [],
    staff: staff || [],
    diagnoses: diagnosis || [],
    procedures: procedures || [],
  };
  await getContactIds(id);
  setUser(updatedUser);
  if (data?.first_time) { 
    //redirect to the special onboarding route thats only getting renderd once
    router.push('/onboarding');  
  } else {
    //fetch avatar if avatar_url exists
    if (data.avatar_url) {
      const { data: avatarData, error: avatarError } = await supabase.storage
        .from('avatars')
        .download(data.avatar_url);

      if (avatarError) {
        console.error('Error downloading avatar:', avatarError);
        return;
      }
      
      //read the blob data
      const reader = new FileReader();
      reader.onloadend = () => {        
        if (typeof reader.result === 'string') {
          setUserAvatar(reader.result); //set the user avatar to the avatar state
        } else {
          console.error('Unexpected result type:', typeof reader.result);
        }
      };
      reader.readAsDataURL(avatarData); 
    }

  setUser(updatedUser);    
  router.push('/(tabs)');
  }
};

const fetchuserDrawings = async (id: string) => {
  if (!id) {
    console.error('User ID is missing');
    return;
  }

  try {      
    const { data: drawingRecords, error: drawingError } = await supabase
      .from('Drawings') 
      .select('*')
      .eq('user_id', id); 

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
    setDrawingFiles(validUrls); 

  } catch (error) {
    console.error('Error fetching user drawings:', error);
  } 
}

const fetchUserImages = async (id: string) => {
  //first check if user is logged in
  if (!id) {
    console.error('User ID is missing');
    return;
  }

  try {      
    const { data: imageRecords, error: imageError } = await supabase
      .from('Images') 
      .select('*')
      .eq('user_id', id); 

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
    setMediaFiles(validUrls); //store image urls in the media state

  } catch (error) {
    console.error('Error fetching user images:', error);
  } 
};


const fetchUserVideos = async (id: string) => {    
  if (!id) {
    console.error('User ID is missing');
    return;
  }

  try {      
    const { data: videoRecords, error: videoError } = await supabase
      .from('videos') 
      .select('*')
      .eq('user_id', id); 

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
    setVideoFiles(validUrls); 

  } catch (error) {
    console.error('Error fetching user videos:', error);
  } 
};

const getAnswers = async (id: string) => {
  const { data, error } = await supabase
  .from('Answers')
  .select('*')
  .eq('profile_id', id);
  if (error) {
    console.error('Error fetching answers:', error);
    return [];
  }
  
  setAnswers(data as Answers[] || []);
};

const getProcedures = async (id: string) => {
  //define the query
  const query = supabase
  .from('Procedures')
  .select('*')
  .eq('user_id', id);
  
  try{
    //fetch the data
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

const fetchDiagnosis = async (id: string) => {
  //define the query
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
          image: mediaUrls.img || null,
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

const fetchDepartmentsAndStaff = async () => {
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

const fetchUserEntries = async (limitEntries: boolean = true, id: string | null) => {
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
    .order('created_at', { ascending: false });//post_date or created_at
      
      
    if (limitEntries) {
      query = query.limit(3); // Change the number as needed
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

const getMediaFiles = async (entry: any, bucket: string) => {
  const mediaUrls: any = {
    image: null,
    video: null,
    drawing: null,
  };

  // Fetch image URL if exists
  if (entry.image_url) {
    const { data: imageUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(entry.image_url);  // Use the actual field from the database
    if (imageUrl?.publicUrl) mediaUrls.image = imageUrl.publicUrl;
  }

  // Fetch video URL if exists
  if (entry.video_url) {
    const { data: videoUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(entry.video_url);  // Use the actual field from the database
    if (videoUrl?.publicUrl) mediaUrls.video = videoUrl.publicUrl;
  }

  // Fetch drawing URL if exists
  if (entry.drawing_url) {
    const { data: drawingUrl } = supabase.storage
      .from(bucket)
      .getPublicUrl(entry.drawing_url);  // Use the actual field from the database
    if (drawingUrl?.publicUrl) mediaUrls.drawing = drawingUrl.publicUrl;
  }

  return mediaUrls;
}

//get the users contacts from departments
const getContactIds = async (userId: string) => {
  const { data, error } = await supabase.from('ProfilesDepartments').select('*').eq('profile_id', userId);
  if (error) {
    console.error('Error fetching contacts:', error);
    return [];
  }
  
  setContactIds(
    data.map((contact) => ({
      department_id: contact.department_id,
      staff_id: contact.staff_id
    }))
  );
};


const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  
  if (error) return console.error(error)
  getUser(data.user.id);
  
};

const signUp = async (firstname: string, lastname: string, email: string, password: string) => {
  //trimming the input fields to remove any white spaces to avoid issues with supabases not accepting the emails
  const trimmedEmail = email.trim();
  const trimmedFirstname = firstname.trim();
  const trimmedLastname = lastname.trim();
  
  //sign up with email and password, creates a user in the supabase default auth user table
  const { data, error } = await supabase.auth.signUp({      
    email: trimmedEmail,
    password: password,
  });
  if (error) return console.error(error);
  //then create a profile in the profiles table with the same id as the user in the auth table
  const { data: profileData, error: profileError } = await supabase
  .from('profiles')
  .insert(
    {
      id: data.user?.id,
      user_id: data.user?.id,
      first_name: trimmedFirstname,
      last_name: trimmedLastname,
      email: trimmedEmail,
    },
  );
  if (profileError) return console.error(profileError);
  setUser(profileData);
  router.back()
  router.push('/(tabs)');  
};

const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) return console.error(error);
  setUser(null);
  setUserAvatar(null);
  router.push('/(auth)')
};

//keep user logged in with supabase on/off state feature
React.useEffect(() => {
  const { data: authData } = supabase.auth.onAuthStateChange((event, session) => {
    //if there is no active user session return to sign in page
    if (!session) return router.push('/(auth)'); 
    //else call the getUser function who already has the user id and redirects to homepage
    getUser(session?.user.id);    
  });
  //clean up function  that terminates the subscription I.E the user session
  return () => {
    authData?.subscription.unsubscribe();
  };
}, []);

const editUser = async (
  id: string, 
  firstname: string, 
  lastname: string, 
  email: string, 
  dateOfBirth: Date, 
  avatarUrl: string, 
  userDescription: string,
  selectedOption: number
) => {
  //if there is no changes made to a property then dont update that property in the db
  const updates: any = {};
  if (firstname !== user?.first_name) updates.first_name = firstname;
  if (lastname !== user?.last_name) updates.last_name = lastname;
  if (email !== user?.email) updates.email = email;
  if (dateOfBirth !== user?.date_of_birth) updates.date_of_birth = dateOfBirth;
  if (userDescription !== user?.description) updates.description = userDescription;
  if (selectedOption !== user?.selected_version) updates.selected_version = selectedOption;
  if (avatarUrl !== user?.avatar_url) updates.avatar_url = avatarUrl;

  //only upload avatar if the avatar URL has changed
  if (avatarUrl && avatarUrl !== user?.avatar_url) {
    // Move old avatar to the 'oictures' bucket instead of avatar buckets. 
    if (user?.avatar_url) {
     
      await moveAvatarToPictures(user.avatar_url);
    }

  
    //save the photo
    const saveAvatar = async () => {
      const formData = new FormData();
      const PicturefileName = avatarUrl?.split('/').pop() || 'default-avatar-name.jpg';      
      formData.append('file', {
        uri: avatarUrl,
        type: `image/${PicturefileName?.split('.').pop()}`,
        name: PicturefileName,
      } as any);

      //save to the avatar bucket
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(PicturefileName, formData, {
          cacheControl: '3600000000',
          upsert: false,
        });

      if (error) {
        console.error(error);
        return null;
      }

      return data?.path; 
    };

    //upload the image and get the new URL from the storage   
    const uploadedImagePath = await saveAvatar();
    if (uploadedImagePath) {
      const uploadedFileName = uploadedImagePath.split('/').pop();
      avatarUrl = uploadedFileName as string; 
      updates.avatar_url = avatarUrl;
      console.log('uploadedImagePath:', avatarUrl);
    }    
  }

  //only update the database if there are changes
  if (Object.keys(updates).length > 0) {
    // Update the user profile in the database
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id);    

    if (error) {
      console.error('Profile update error:', error);
      return;
    }

    await getUser(id);
    console.log('User updated');
  } else {
    console.log('No changes detected, skipping update.');
  }
};

// Function to move avatar to the "pictures" bucket
const moveAvatarToPictures = async (oldAvatarUrl: string) => {
  

  if (!oldAvatarUrl) {
    console.error('Old avatar path is undefined or empty.');
    return; // Handle the error case appropriately
  }  

  // Move the old avatar to the "pictures" bucket
  const { data: moveData, error: moveError } = await supabase.storage
  .from('avatars') // Source bucket
  .move(oldAvatarUrl, `${oldAvatarUrl}`, {
    destinationBucket: 'pictures' // Specify the destination bucket
  });

  if (moveError) {
    console.error('Failed to copy avatar:', moveError);
    return;
  }  
};

useEffect(() => {
  if (user?.date_of_birth) {
  const today = new Date();
  const birthDate = new Date(user?.date_of_birth);
  const age = today.getFullYear() - birthDate.getFullYear();
  setUserAge(age);
  }
}, [user?.date_of_birth]);

const userMediaFiles = ({ file }: {file: string}) => {  
    setSelectedMediaFile(file);
    return file;  
}

const saveDiaryEntry = async (diaryEntry: any) => {
  const { data, error } = await supabase.from('diary_posts').insert([diaryEntry]);
  if (error) {
    console.error('Error saving diary entry:', error);
    return;
  }
  console.log('Diary entry saved:', data);
}


const fetchMedicins = async (userId: string) => {
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

const fetchDetailsForMedicins = async (medicins: MedicinProps[]): Promise<MedicinProps[]> => {
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


//the context provider gives us acces to the user object through out the app
return <AuthContext.Provider value={{ user, setUser, mediaFiles, setMediaFiles, drawingFiles, setDrawingFiles, videoFiles, setVideoFiles, fetchUserEntries, answers, setAnswers, response, setResponse, contactIds, setContactIds, getContactIds, signIn, signOut, signUp, selectedOption, userAvatar, setSelectedOption, editUser, userAge, userMediaFiles, selectedMediaFile, setSelectedMediaFile, setGetPhotoForAvatar, getPhotoForAvatar, fetchMedicins }}>{children}</AuthContext.Provider>

}