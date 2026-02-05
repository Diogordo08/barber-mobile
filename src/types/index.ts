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
  id: number;
  status: 'confirmed' | 'completed' | 'cancelled' | 'no_show' | 'pending';
  scheduled_at: string; // Data vem como string do backend
  total_price: number | string;
  
  // Relacionamentos (podem vir do Laravel)
  service?: {
    name: string;
    duration_minutes?: number;
  };
  barber?: {
    name: string;
    avatar?: string;
  };
  barbershop?: {
    name: string;
    address?: string;
  };
}

export interface Plan {
  id: number;
  name: string;
  price: number | string; // Pode vir como string "50.00" do banco
  description: string | null;
  cuts_per_month: number | null; // Limite de cortes por mês (null = ilimitado)
}