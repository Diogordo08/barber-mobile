export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  barbershop_id: number | null;
}

export interface AuthContextType {
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>; // Virou Promise
  updateUser: (data: Partial<User>) => Promise<void>; // Virou Promise
  isAuthenticated: boolean;
  loading: boolean;
}