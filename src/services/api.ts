// src/services/api.ts
// const BASE_URL = 'http://localhost:3000/api'; // O Backend vai rodar aqui

// Seus mocks continuam aqui embaixo...

/* Aqui acontece a mágica. Vamos criar funções que devolvem esses dados, mas com um pequeno atraso (delay) para simular a internet. */
import type { Barber, ServiceItem, Appointment, Plan } from '../types';
import { MOCK_BARBERS, MOCK_SERVICES, MOCK_APPOINTMENTS, MOCK_PLANS, MOCK_SHOP_CONFIG } from './mocks';

const delay = () => new Promise(resolve => setTimeout(resolve, 500));

let MOCK_SUBSCRIPTION = {
  planId: 'vip',
  status: 'active',
  nextBillingDate: '2026-02-28'
};


export const api = {
  getBarbers: async (): Promise<Barber[]> => {
    await delay();
    return MOCK_BARBERS;
  },

  // Buscar serviços
  getServices: async (): Promise<ServiceItem[]> => {
    await delay();
    return MOCK_SERVICES;
  },

  // Buscar agendamentos do usuário logado
  getMyAppointments: async (): Promise<Appointment[]> => {
    await delay();
    // Aqui estamos filtrando na memória, no real seria: /appointments?userId=...
    return MOCK_APPOINTMENTS;
  },

  getAvailableSlots: async (date: string, barberId: string): Promise<string[]> => {
    await delay();
    // Simula que o backend calculou os horários livres
    return ['09:00', '10:00', '13:00', '14:30', '16:00', '19:00'];
  },
  
  getPlans: async (): Promise<Plan[]> => {
    await delay();
    return MOCK_PLANS;
  },

  // 1. Busca a assinatura atual
  getSubscription: async () => {
    await delay();
    // Retorna null se não tiver plano ou se estiver cancelado
    if (!MOCK_SUBSCRIPTION || MOCK_SUBSCRIPTION.status === 'canceled') return null;
    return MOCK_SUBSCRIPTION;
  },

  getShopConfig: async () => {
    // Simula delay de rede
    await new Promise(resolve => setTimeout(resolve, 500)); 
    return MOCK_SHOP_CONFIG;
  },

  // --------------------------------------

  createAppointment: async (data: Omit<Appointment, 'id' | 'status'>): Promise<Appointment> => {
    await delay();
    const newAppointment: Appointment = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      status: 'pendente'
    };
    // Adiciona na lista local (memória temporária)
    MOCK_APPOINTMENTS.push(newAppointment);
    return newAppointment;
  },

  cancelAppointment: async (appointmentId: string): Promise<void> => {
    await delay();
    // Encontra o agendamento na memória e muda o status
    const appIndex = MOCK_APPOINTMENTS.findIndex(a => a.id === appointmentId);
    if (appIndex >= 0) {
      MOCK_APPOINTMENTS[appIndex].status = 'cancelado';
    } else {
      throw new Error('Agendamento não encontrado');
    }
  },

  cancelSubscription: async () => {
    await delay();
    MOCK_SUBSCRIPTION.status = 'canceled';
    return;
  },

  subscribeToPlan: async (planId: string, paymentMethod: string) => {
    await delay();
    // Reativa ou cria nova assinatura
    MOCK_SUBSCRIPTION = {
      planId,
      status: 'active',
      nextBillingDate: '2026-02-28'
    };
  }
};
