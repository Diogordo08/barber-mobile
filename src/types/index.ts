/* Vamos definir como são os dados de Barbeiros, Serviços e Agendamentos. */
export interface Barber {
  id: string;
  name: string;
  avatar: string; // URL da foto
  rating: number; // 4.5, 5.0
}

export interface ServiceItem {
  id: string;
  name: string;
  price: number;
  durationMinutes: number;
  description?: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[]; // Ex: ["Cortes ilimitados", "Bebida grátis"]
  recommended?: boolean;
}

export type AppointmentStatus = 'pendente' | 'confirmado' | 'cancelado' | 'concluido';

export interface Appointment {
  id: string;
  userId: string;
  barberId: string;
  serviceId: string;
  date: string; // Vamos usar ISO string: "2023-10-30T14:00:00"
  status: AppointmentStatus;
  totalPrice: number;
}