import { User } from './Auth';

export * from './Auth';

export interface OpeningHour {
  day_of_week: number; // 0=Dom 1=Seg 2=Ter 3=Qua 4=Qui 5=Sex 6=Sáb
  opening_time: string | null;
  closing_time: string | null;
  is_closed: boolean;
}

export interface Barbershop {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  phone: string;
  address: string | null;
  whatsapp: string;
  /** Chave pública MercadoPago da barbearia. Null = MP não configurado → desabilitar cartão. */
  mp_public_key: string | null;
  opening_hours?: OpeningHour[];
  theme?: {
    primary: string;
    secondary: string;
  };
}

export interface Barber {
  id: number;
  name: string;
  avatar: string | null;
  email?: string;
  bio?: string;
  role?: string;
  rating?: number;
  barbershop_id?: number;
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
  status: 'confirmed' | 'completed' | 'canceled' | 'no_show' | 'pending';
  scheduled_at: string; // Data vem como string do backend
  total_price: number | string;
  payment_method: 'pix' | null;
  notes: string | null;

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

export interface Subscription {
  id: number;
  user_id?: number;
  plan_id?: number;
  barbershop_id?: number;
  status: 'active' | 'pending' | 'canceled' | 'expired';
  payment_method?: 'pix' | 'card' | null;
  starts_at?: string;
  expires_at: string;
  uses_this_month: number;
  remaining_cuts: number;
  plan?: Plan;
}