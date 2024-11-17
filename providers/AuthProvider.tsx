import React from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';
import { getErrorMessage } from '@/utils/utils';
import { 
  User, 
  AuthContextType  
} from '@/utils/types';
import { fetchUserEntries, insertProfileWithRetry } from '@/lib/apiHelper';
import { 
  useMediaStore, 
  useAnswerStore, 
  useUserStore, 
  useDiaryStore,
  useMedicineStore,
  useDepartmentsStore,
  useDiagnosisStore,
  useProcedureStore
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
const [userAvatar, setUserAvatar] = React.useState<string | null>(null);

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
const { getUserProcedures } = useProcedureStore();

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
  console.log('Fetching profile for ID:', id);
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

  //get the ids of the users contacts to be able to filter the departments and staff arrays
  await fetchContactIds(id);  

  //set the global state with the users diagnosis
  await fetchDiagnosis(id);

  //get user procedures and set the global state
  await getUserProcedures(id);  

  //call the get answers function to set the users answers
  await fetchAnswers(id);  

  const updatedUser: User = {
    ...data,    
  }; 

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

const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });

  //if there is an error return the error message to the caller
  if (error) {
    const translatedErrorMessage = getErrorMessage(error);    
    return translatedErrorMessage;
  }

  getUser(data.user.id);
  getUserData(data.user.id); 
  return null;
};


const signUp = async (firstname: string, lastname: string, email: string, password: string) => {
  //trimming the input fields to remove any white spaces to avoid issues with supabases not accepting the emails
  const trimmedEmail = email.trim();
  const trimmedFirstname = firstname.trim();
  const trimmedLastname = lastname.trim();  
 
  try {
    const { data, error } = await supabase.auth.signUp({      
      email: trimmedEmail,
      password: password,
    });
    if (error) {
      console.error(error);
      throw error; 
    }

    const userProfile = await insertProfileWithRetry({
      id: data.user?.id,
      user_id: data.user?.id,
      first_name: trimmedFirstname,
      last_name: trimmedLastname,
      email: trimmedEmail,
    });
    console.log('in sign up profileData:', userProfile);
    setUser(userProfile);    
    if (data?.user){
      //finally set the global user state
      updateUser(userProfile);
      //call the getuser function to get the user data
      getUser(data?.user?.id);
    }
  } catch (error) {
    console.error('Profile insertion failed:', error);
    return;
  }
  /* try{  
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
    )
    .select();
    if (profileError) return console.error(profileError);
    if(!profileData) return console.error('Profile data is missing');
    const userProfile = profileData[0];
    if(profileData){
      //set the user object in the context and redirect to the homepage
      setUser(userProfile);  
    }
    
    console.log('in sign up profileData:', profileData);
    router.back()
    router.push('/(tabs)');
    //finally set the global user state
    if (data?.user){
      getUser(data?.user?.id);
    }
  } catch (error) {
    console.error('Profile insertion failed:', error);
    return;
  } */
};

const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) return console.error(error);
  //clear the stores
  useUserStore.getState().resetUser();
  /* useUserStore.setState({
    id: null,
    userAvatar: null,
    first_name: '',
    last_name: '',
    user_email: '',
    first_time: false,
    selected_option: 3, 
    avatar_url: '',
    description: '',
    date_of_birth: null,
    selected_version: null,
    userAge: null,
  }); */

  //clear the local states
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