export type User = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  first_time: boolean;
};

export type AuthContextType = {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (firstname: string, lastname: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};