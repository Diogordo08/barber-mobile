export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>; // Virou Promise
  updateUser: (data: Partial<User>) => Promise<void>; // Virou Promise
  isAuthenticated: boolean;
  loading: boolean;
}