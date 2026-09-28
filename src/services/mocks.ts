/* Exemplos legados, não utilizados pelos fluxos da API. */
import type { Barber, ServiceItem, Appointment } from '../types';
import type { Plan } from '../types';

export const MOCK_BARBERS: Barber[] = [
  { id: 1, name: 'João Navalha', avatar: 'https://i.pravatar.cc/150?u=1', rating: 4.8 },
  { id: 2, name: 'Mestre Bigode', avatar: 'https://i.pravatar.cc/150?u=2', rating: 5.0 },
  { id: 3, name: 'Ana Cortes', avatar: 'https://i.pravatar.cc/150?u=3', rating: 4.7 },
];

export const MOCK_SERVICES: ServiceItem[] = [
  { id: 1, name: 'Corte de Cabelo', price: 35, duration_minutes: 30, description: 'Corte social ou degradê.' },
  { id: 2, name: 'Barba Completa', price: 25, duration_minutes: 20, description: 'Barba modelada com toalha quente.' },
  { id: 3, name: 'Combo (Cabelo + Barba)', price: 50, duration_minutes: 50, description: 'O pacote completo.' },
];

// Alguns agendamentos de exemplo para preencher a tela
export const MOCK_APPOINTMENTS: Appointment[] = [
  { 
    id: 101,
    scheduled_at: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), // Amanhã
    status: 'pending',
    total_price: 35,
    payment_method: null,
    notes: null
  },
  { 
    id: 102,
    scheduled_at: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), // 2 dias atrás
    status: 'completed',
    total_price: 25,
    payment_method: null,
    notes: null
  }
];


export const MOCK_PLANS: Plan[] = [
  {
    id: 1,
    name: 'Homem Moderno',
    price: 59.90,
    description: 'Para quem mantém o corte em dia.',
    cuts_per_month: 2
  },
  {
    id: 2,
    name: 'Estilo VIP',
    price: 99.90,
    description: 'Cabelo e barba sempre alinhados.',
    cuts_per_month: null
  }
];

// Configuração da Loja (Isso viria do backend baseado na URL ou ID da loja)
export const MOCK_SHOP_CONFIG = {
  id: 1,
  name: 'Barber King',
  logo: 'https://github.com/shadcn.png',
  primaryColor: '#7c3aed', 
  secondaryColor: '#1e293b', 
  accentColor: '#fbbf24' 
};
