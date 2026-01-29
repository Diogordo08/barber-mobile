import { User } from './Auth';

export * from './Auth'; // Re-exporta User e AuthContextType para facilitar

export interface Barbershop {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  phone: string;
  address: string | null;
  whatsapp: string;
  theme?: {
    primary: string;
    secondary: string;
  };
}

export interface Barber {
  id: number;
  name: string;
  avatar: string | null;
  bio?: string;
  role?: string;
  rating?: number;
}

export interface ServiceItem {
  id: number;
  name: string;
  price: number | string;
  duration_minutes: number; // Corrigido para bater com o backend (snake_case)
  description?: string;
}

export interface Appointment {
  id: string | number;
  status: 'confirmed' | 'completed' | 'cancelled';
  price: number;
  scheduled_at: string;
  formatted_date: string;
  
  // Atualizado para bater com o novo Resource do Laravel
  barber: {
    name: string;
    avatar: string | null;
  };
  service: {
    name: string;
    duration: string;
  };
  barbershop: {
    name: string;
  };
}

export interface Plan {
  id: number;
  name: string;
  price: number;
  monthly_limit: number;
  description: string;
}