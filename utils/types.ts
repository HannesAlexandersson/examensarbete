export type User = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  first_time: boolean;
  selected_option: string | null;
};

export type AuthContextType = {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (firstname: string, lastname: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  selectedOption: number | null;
  setSelectedOption: (option: number | null) => void;
};

export type OnboardingText = {
  title: string;
  paragraph: string;
  position: number;
};

export type VersionDescriptions = {
  version: string;
  paragraph: string;
  position: number;
};

export type RoundCheckmarkProps = {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}

export type CheckmarkOptions = {
  id: number;
  label: string;
}