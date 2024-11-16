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
  useMedicineStore,
  useDepartmentsStore,
  useDiagnosisStore
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
/* const [contactIds, setContactIds] = React.useState<ContactIds[]>([]); */
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
const { fetchContactIds, getDepartmentsandStaff } = useDepartmentsStore((state) => state);
const { fetchDiagnosis } = useDiagnosisStore();

//keep user logged in with supabase on/off state feature
React.useEffect(() => {
  const { data: authData } = supabase.auth.onAuthStateChange((event, session) => {
    //if there is no active user session return to sign in page
    if (!session) return router.push('/(auth)'); 
    //else call the getUser function with the session id
    getUser(session?.user.id);    
  });
  //clean up function  that terminates the subscription I.E the user session
  return () => {
    authData?.subscription.unsubscribe();
  };
}, []);

//context functions
const getUser = async (id: string) => {
  //get all the user data from the profiles table
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if(error) return console.error(error);

  //get the users age from the date of birth
  if (data?.date_of_birth) {
    getAge(data.date_of_birth);    
  }

  // set the global state with the users medicin and enrich them with staff and department details
  await fetchMedicins(id); 
  await enrichMedicins();  

  //call the fetch diaryposts function to get the users diary entries and set the global state
  const diaryEntries = await fetchUserEntries(false, id);
  setDiaryEntries(diaryEntries || []);

  //set the global states with the departments and staff
  await getDepartmentsandStaff();  

  //set the global state with the users diagnosis
  await fetchDiagnosis(id);

  //get user procedures
  const procedures = await getProcedures(id);

  //call the get answers function to set the users answers
  await fetchAnswers(id);
  

  const updatedUser: User = {
    ...data,
    /* own_medicins: medicins?.own_medicins || [],
    medicins: enrichedMedicins, */
    /* diary_entries: diaryEntries || [], */ 
    /* departments: departments || [],
    staff: staff || [], */
    /* diagnoses: diagnosis || [], */
    procedures: procedures || [],
  };

  //get the ids of the users contacts to be able to filter the departments and staff arrays
  await fetchContactIds(id);  

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

  return <AuthContext.Provider value={{ user, setUser, signIn, signOut, signUp, editUser }}>{children}</AuthContext.Provider>
}