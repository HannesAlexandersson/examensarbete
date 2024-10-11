import React from 'react';
import { supabase } from '@/utils/supabase';
import { useRouter } from 'expo-router';

export const AuthContext = React.createContext({
  user: null,
  signIn: async (email: string, password: string) => {},
  signUp: async (firstname: string, lastname: string, email: string, password: string) => {},
  signOut: async () => {},
});

export const useAuth = () => React.useContext(AuthContext);

export const AuthProvider = ({ children } : { children: React.ReactNode }) => {
//the user object is created here and used all over the app with the context
const [user, setUser] = React.useState(null);
const router = useRouter();

const getUser = async (id: string) => {
  // get from supabase table "User" and select everything and the 'id' must equal the id we defined here and return it as single wich is a object and set that to the data object and i there is no errors set the user to data
  const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
  if(error) return console.error(error);
  setUser(data);
  console.log('Welcome back:', data)
  router.push('/(tabs)')
}

const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email,
    password: password,
  });
  console.log('Welcome back:', data.user?.email)
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

//the context provider gives us acces to the user object through out the app
return <AuthContext.Provider value={{ user, signIn, signOut, signUp}}>{children}</AuthContext.Provider>

}