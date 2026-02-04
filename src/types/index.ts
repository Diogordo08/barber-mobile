import { User } from './Auth';

export * from './Auth';

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
  barbershop_id?: number; // Adicionado para consistência
}

export interface ServiceItem {
  id: number;
  name: string;
  price: number | string;
  duration_minutes: number; 
  description?: string;
}

export interface Appointment {
  id: string | number;
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  total_price: number; // Backend usa total_price
  scheduled_at: string; // Backend usa scheduled_at
  
  // Dados aninhados que vêm do 'with' do Laravel
  barber?: {
    name: string;
    avatar: string | null;
  };
  service?: {
    name: string;
    duration_minutes?: number;
  };
  barbershop?: {
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