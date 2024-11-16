import React, { useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';
import { 
  User, 
  AuthContextType, 
  MedicinProps, 
  ProcedureProps, 
  ContactIds, 
  DiaryEntry, 
  Answers, 
  UserMediaForDepartment, 
  DiagnosisProps, 
  MediaEntry 
} from '@/utils/types';
import { fetchUserEntries, getMediaFiles } from '@/lib/apiHelper';
import { 
  useMediaStore, 
  useAnswerStore, 
  useUserStore, 
  useDiaryStore,
  useMedicineStore
 } from '@/stores';


export const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children } : { children: React.ReactNode }) => {

//states used as global states in the app
const [user, setUser] = React.useState<User | null>(null);
const router = useRouter();
/* const [userAge, setUserAge] = React.useState<number | null>(null); */
const [userAvatar, setUserAvatar] = React.useState<string | null>(null);
/* const [selectedOption, setSelectedOption] = React.useState<number>(3);
const [selectedMediaFile, setSelectedMediaFile] = React.useState<string | null>(null);
const [getPhotoForAvatar , setGetPhotoForAvatar] = React.useState<boolean>(false); */
const [contactIds, setContactIds] = React.useState<ContactIds[]>([]);
/* const [answers, setAnswers] = React.useState<Answers[]>([]); */
/* const [ response, setResponse ] = React.useState<string | null>(null); */

//global states from the zustand stores
const { 
  first_name,
  last_name,
  user_email,
  date_of_birth,
  description,
  selected_option, 
  avatar_url,
  getUserData,
  getAvatar, 
  getAge, 
  moveAvatarToPictures,
  updateUser,
 } = useUserStore();

const { fetchAnswers } = useAnswerStore();
const { selectedMediaFile } = useMediaStore();
const { setDiaryEntries } = useDiaryStore();
const { fetchMedicins, enrichMedicins } = useMedicineStore();

//context functions
const getUser = async (id: string) => {
  //get all the user data from the profiles table
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if(error) return console.error(error);

  
  if (data?.date_of_birth) {
    getAge(data.date_of_birth);    
  }

  // get the users medicines and enrich them with staff and department details
  await fetchMedicins(id); 
  await enrichMedicins(); 

 /* 
  const medicins = await fetchMedicins(id);

  // Enrich medicines with staff and department details
  const enrichedMedicins = await fetchDetailsForMedicins(medicins.medicins); */

  //call the fetch diaryposts function to get the users diary entries and set the global state
  const diaryEntries = await fetchUserEntries(false, id);
  setDiaryEntries(diaryEntries || []);

  //get the departments and associated staff
  const { departments, staff } = await fetchDepartmentsAndStaff();  

  //get the users diagoisis
  const diagnosis = await fetchDiagnosis(id);

  //get user procedures
  const procedures = await getProcedures(id);

  //call the get answers function to set the users answers
  await fetchAnswers(id);
  

  const updatedUser: User = {
    ...data,
    /* own_medicins: medicins?.own_medicins || [],
    medicins: enrichedMedicins, */
    diary_entries: diaryEntries || [], 
    departments: departments || [],
    staff: staff || [],
    diagnoses: diagnosis || [],
    procedures: procedures || [],
  };

  //the contact ids are used to fetch the relevant staff and departments for the user
  await getContactIds(id); 

  //set the user to the updated user
  setUser(updatedUser);

  if (data?.first_time) { 
    //redirect to the special onboarding route thats only getting renderd once the first time the user logs in
    router.push('/onboarding');  
  } else {

    //fetch avatar if avatar_url exists
    await getAvatar(data.avatar_url);    

    setUser(updatedUser);    
    router.push('/(tabs)');
  }
};

const getProcedures = async (id: string) => {  
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

const fetchDiagnosis = async (id: string) => {  
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

/* const fetchUserEntries = async (limitEntries: boolean = true, id: string | null) => {
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
}; */

/* const getMediaFiles = async (entry: any, bucket: string) => {
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
} */

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
  getUserData(data.user.id); 
};

const signUp = async (firstname: string, lastname: string, email: string, password: string) => {
  //trimming the input fields to remove any white spaces to avoid issues with supabases not accepting the emails
  const trimmedEmail = email.trim();
  const trimmedFirstname = firstname.trim();
  const trimmedLastname = lastname.trim();  
  
  const { data, error } = await supabase.auth.signUp({      
    email: trimmedEmail,
    password: password,
  });
  if (error) return console.error(error);
  
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

  //set the user object in the context and redirect to the homepage
  setUser(profileData);  
  router.back()
  router.push('/(tabs)');
  //finally set the global user state
  if (data?.user){
    getUser(data?.user?.id);
  }
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
  if (firstname !== first_name) updates.first_name = firstname;
  if (lastname !== last_name) updates.last_name = lastname;
  if (email !== user_email) updates.email = email;
  if (dateOfBirth !== date_of_birth) updates.date_of_birth = dateOfBirth;
  if (userDescription !== description) updates.description = userDescription;
  if (selectedOption !== selected_option) updates.selected_version = selectedOption;
  if (avatarUrl !== avatar_url) updates.avatar_url = avatarUrl;

  //compare the new url to the globally stored avatar url
  if (avatarUrl && avatarUrl !== avatar_url) {
    // if there is a new url move old avatar to the 'pictures' bucket instead of avatar buckets. 
    if (avatar_url) {     
      await moveAvatarToPictures(avatar_url);
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

      await getAvatar(avatarUrl);
    }    
  }

  //only update the database if there are changes
  if (Object.keys(updates).length > 0) {   
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', id);    

    if (error) {
      console.error('Profile update error:', error);
      return;
    }
    //update the user in the global state
    updateUser(updates);
    console.log('User updated');
  } else {
    console.log('No changes detected, skipping update.');
  }
};


const saveDiaryEntry = async (diaryEntry: any) => {
  const { data, error } = await supabase.from('diary_posts').insert([diaryEntry]);
  if (error) {
    console.error('Error saving diary entry:', error);
    return;
  }
  console.log('Diary entry saved:', data);
}


/* const fetchMedicins = async (userId: string) => {
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
}; */

/* const fetchDetailsForMedicins = async (medicins: MedicinProps[]): Promise<MedicinProps[]> => {
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
}; */



return <AuthContext.Provider value={{ user, setUser, contactIds, setContactIds, getContactIds, signIn, signOut, signUp, editUser }}>{children}</AuthContext.Provider>

}