import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Barbershop, Barber, ServiceItem, Appointment } from '../types'; 

// ⚠️ CONFIRA SE SEU IP AINDA É ESSE
const BASE_URL = 'http://192.168.0.191/api'; 

export const apiInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/* A lógica de interceptação de erros 401 (Unauthorized) foi movida 
   para o AuthContext para centralizar o controle de autenticação e 
   evitar dependências circulares e estado inconsistente. */

export const api = {
  
  // --- AUTENTICAÇÃO ---
  login: async (credentials: any) => {
    const response = await apiInstance.post('/login', credentials);
    return response.data;
  },

  register: async (data: any) => {
    const response = await apiInstance.post('/register', data);
    return response.data;
  },

  updateUser: async (data: { name: string; email: string }) => {
    // Rota: PUT /api/user
    const response = await apiInstance.put('/user', data);
    return response.data;
  },

  // --- DADOS DA BARBEARIA (PÚBLICO) ---
  getBarbershop: async (slug: string): Promise<Barbershop> => {
    const response = await apiInstance.get(`/${slug}`);
    return response.data;
  },

  getBarbers: async (slug: string): Promise<Barber[]> => {
    const response = await apiInstance.get(`/${slug}/barbers`);
    return response.data;
  },

  getServices: async (slug: string): Promise<ServiceItem[]> => {
    const response = await apiInstance.get(`/${slug}/services`);
    return response.data;
  },

  // 👇 AQUI ESTÃO AS FUNÇÕES QUE FALTAVAM
  getPlans: async (slug: string) => {
    try {
      const response = await apiInstance.get(`/${slug}/plans`);
      return response.data;
    } catch (error) {
      console.log("Erro ao buscar planos", error);
      return [];
    }
  },

  // --- AGENDAMENTOS ---
  getAvailableSlots: async (slug: string, date: string, barberId: string | number) => {
    const response = await apiInstance.get(`/${slug}/slots`, {
      params: { date, barber_id: barberId, service_id: 1 } 
    });
    return response.data;
  },

  createAppointment: async (data: any) => {
    const response = await apiInstance.post('/appointments', data);
    return response.data;
  },

  getMyAppointments: async () => {
    const response = await apiInstance.get('/appointments');
    return response.data;
  },

  // 👇 NOVA FUNÇÃO: Cancelar Agendamento
  cancelAppointment: async (id: string) => {
    const response = await apiInstance.delete(`/appointments/${id}`);
    return response.data;
  },

  // --- ASSINATURAS (CRÍTICO PRO PERFIL) ---
  getSubscription: async () => {
    try {
      // Tenta buscar. Se der erro (404 ou 500), retorna null para não travar a tela
      const response = await apiInstance.get('/user/subscription');
      return response.data;
    } catch (error) {
      // Retorna null para o Perfil saber que não tem plano (e não crashar)
      return null;
    }
  },

  subscribeToPlan: async (planId: string, paymentMethod: string) => {
    // Rota: POST /api/subscribe
    const response = await apiInstance.post('/subscribe', {
      plan_id: planId,
      payment_method: paymentMethod,
    });
    return response.data;
  },

  cancelSubscription: async () => {
    // Rota: POST /api/subscribe/cancel
    // No seu backend, você pode usar uma rota como DELETE /user/subscription
    const response = await apiInstance.post('/subscribe/cancel');
    return response.data;
  }
};