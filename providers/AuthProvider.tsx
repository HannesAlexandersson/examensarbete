import React, { useEffect } from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';
import { User, AuthContextType } from '@/utils/types';

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

const getUser = async (id: string) => {
  // get from supabase table "User" and select everything and the 'id' must equal the id we defined here and return it as single wich is a object and set that to the data object and i there is no errors set the user to data
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if(error) return console.error(error);

  // Call fetchMedicins to get medicines
  const medicins = await fetchMedicins(id);
  // Combine the fetched user data with the medicines
  const updatedUser = {
    ...data,            
    medicins: medicins.medicins || [],       
    own_medicins: medicins.own_medicins || [] 
  };

  if (data?.date_of_birth) {
    data.date_of_birth = new Date(data.date_of_birth);
  }

  if (data?.first_time) {    
    setUser(data);
    // Redirect to the special onboarding route thats only getting renderd once
    router.push('/onboarding');  
  } else {
    // Fetch avatar if the avatar_url exists
    if (data.avatar_url) {
      const { data: avatarData, error: avatarError } = await supabase.storage
        .from('avatars')
        .download(data.avatar_url);

      if (avatarError) {
        console.error('Error downloading avatar:', avatarError);
        return;
      }
      
      // Read the blob data as a base64 string
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

    setUser(data);    
    router.push('/(tabs)');
  }
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
      console.log('user avatar url:', user.avatar_url);
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
  console.log('inside moveAvatarToPictures', oldAvatarUrl);

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
      .from('own_medicins')
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

//the context provider gives us acces to the user object through out the app
return <AuthContext.Provider value={{ user, signIn, signOut, signUp, selectedOption, userAvatar, setSelectedOption, editUser, userAge, userMediaFiles, selectedMediaFile, setSelectedMediaFile, setGetPhotoForAvatar, getPhotoForAvatar, fetchMedicins }}>{children}</AuthContext.Provider>

}