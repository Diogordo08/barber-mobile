/* Vamos criar os dados fixos que vão aparecer no app */
import type { Barber, ServiceItem, Appointment } from '../types';
import type { Plan } from '../types';

export const MOCK_BARBERS: Barber[] = [
  { id: '1', name: 'João Navalha', avatar: 'https://i.pravatar.cc/150?u=1', rating: 4.8 },
  { id: '2', name: 'Mestre Bigode', avatar: 'https://i.pravatar.cc/150?u=2', rating: 5.0 },
  { id: '3', name: 'Ana Cortes', avatar: 'https://i.pravatar.cc/150?u=3', rating: 4.7 },
];

export const MOCK_SERVICES: ServiceItem[] = [
  { id: '1', name: 'Corte de Cabelo', price: 35, durationMinutes: 30, description: 'Corte social ou degradê.' },
  { id: '2', name: 'Barba Completa', price: 25, durationMinutes: 20, description: 'Barba modelada com toalha quente.' },
  { id: '3', name: 'Combo (Cabelo + Barba)', price: 50, durationMinutes: 50, description: 'O pacote completo.' },
];

// Alguns agendamentos de exemplo para preencher a tela
export const MOCK_APPOINTMENTS: Appointment[] = [
  { 
    id: '101', 
    userId: '1', 
    barberId: '1', 
    serviceId: '1', 
    date: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(), // Amanhã
    status: 'pendente',
    totalPrice: 35
  },
  { 
    id: '102', 
    userId: '1', 
    barberId: '2', 
    serviceId: '2', 
    date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(), // 2 dias atrás
    status: 'concluido',
    totalPrice: 25
  }
];


export const MOCK_PLANS: Plan[] = [
  {
    id: 'basic',
    name: 'Homem Moderno',
    price: 59.90,
    description: 'Para quem mantém o corte em dia.',
    features: ['2 Cortes por mês', 'Agenda prioritária', '5% off em produtos']
  },
  {
    id: 'vip',
    name: 'Estilo VIP',
    price: 99.90,
    description: 'Cabelo e barba sempre alinhados.',
    features: ['Cortes ilimitados', 'Barba ilimitada', 'Bebida grátis', 'Toalha quente'],
    recommended: true
  }
];

// Configuração da Loja (Isso viria do backend baseado na URL ou ID da loja)
export const MOCK_SHOP_CONFIG = {
  id: '1',
  name: 'Barber King',
  logo: 'https://github.com/shadcn.png',
  primaryColor: '#7c3aed', 
  secondaryColor: '#1e293b', 
  accentColor: '#fbbf24' 
};
