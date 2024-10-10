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

  return <AuthContext.Provider value={{ user, signIn, signOut, signUp}}>{children}</AuthContext.Provider>

}