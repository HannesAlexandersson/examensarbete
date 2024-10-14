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
const [selectedOption, setSelectedOption] = React.useState<number | null>(null);

const getUser = async (id: string) => {
  // get from supabase table "User" and select everything and the 'id' must equal the id we defined here and return it as single wich is a object and set that to the data object and i there is no errors set the user to data
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if(error) return console.error(error);

  if (data?.first_time) {    
    setUser(data);
    // Redirect to the special onboarding route thats only getting renderd once
    router.push('/onboarding');  
  } else {
    setUser(data);    
    router.push('/(tabs)')
  }
}

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

const editUser = async (id: string, firstname: string, lastname: string, email: string, dateOfBirth: Date, avatarUrl: string, userDescription: string) => {
  
  // Function to save the photo
  const saveAvatar = async () => {
    const formData = new FormData();
    const PicturefileName = avatarUrl?.split('/').pop() || 'default-avatar-name.jpg';
    
    formData.append('file', {
      uri: avatarUrl,
      type: `image/${PicturefileName?.split('.').pop()}`,
      name: PicturefileName,
    } as any);

    // Save to the avatar bucket
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(PicturefileName, formData, {
        cacheControl: '3600000000',
        upsert: false,
      });

    if(error) console.error(error);

    return data?.path; // Return the path of the uploaded image
  };

  // If avatarUrl is provided, upload the image and get the new URL
  if (avatarUrl) {
    const uploadedImagePath = await saveAvatar();
    if (uploadedImagePath) {
      avatarUrl = uploadedImagePath; // Update with new avatar URL
    }
  }

  // Update the user profile in the database
  const { data, error } = await supabase.from('profiles').update({
    first_name: firstname,
    last_name: lastname,
    email: email,
    date_of_birth: dateOfBirth,
    avatar_url: avatarUrl, // Use newAvatarUrl which might be updated
    description: userDescription,
  }).eq('id', id);

  if (error) {
    console.error('Profile update error:', error);
    return;
  }

  setUser(data); 
  console.log('User updated', data);
};

useEffect(() => {
  if (user?.date_of_birth) {
  const today = new Date();
  const birthDate = new Date(user?.date_of_birth);
  const age = today.getFullYear() - birthDate.getFullYear();
  setUserAge(age);
  }
console.log(userAge);
}, [user?.date_of_birth]);
//the context provider gives us acces to the user object through out the app
return <AuthContext.Provider value={{ user, signIn, signOut, signUp, selectedOption, setSelectedOption, editUser, userAge }}>{children}</AuthContext.Provider>

}