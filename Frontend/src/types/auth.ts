export interface User {
  id?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  username: string;
  role?: 'admin' | 'user' | 'auditor'; 
}


export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: SignupData) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

export interface SignupData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: 'user';
}