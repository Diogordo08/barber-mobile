import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Barbershop, Barber, ServiceItem, Appointment } from '../types'; 

const BASE_URL = 'http://192.168.0.191/api'; 

// Exportando para usar no AuthContext
export const apiInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 👇 INTERCEPTOR MAIS INTELIGENTE
apiInstance.interceptors.request.use(async (config) => {
  // 1. Se o Header já tiver Authorization (colocado pelo Login), NÃO mexe!
  // Isso evita o delay do AsyncStorage e o erro 401 na transição imediata.
  if (config.headers.Authorization) {
    return config;
  }

  // 2. Só busca no disco se não tiver header (ex: ao recarregar o app)
  const token = await AsyncStorage.getItem('@BarberSaaS:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

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
    const response = await apiInstance.put('/user', data);
    return response.data;
  },

  // --- DADOS PÚBLICOS ---
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

  // --- AGENDAMENTOS ---
  getAvailableSlots: async (slug: string, date: string, barberId: number, serviceId: number) => {
    const response = await apiInstance.get(`/${slug}/slots`, {
      params: { 
        date: date, 
        barber_id: barberId, 
        service_id: serviceId 
      } 
    });
    return response.data;
  },

  createAppointment: async (data: { 
    barberId: number, 
    serviceId: number, 
    dateISO: string, 
    clientPhone: string 
  }) => {
    const payload = {
      barber_id: data.barberId,
      service_id: data.serviceId,
      scheduled_at: data.dateISO,
      client_phone: data.clientPhone
    };

    const response = await apiInstance.post('/appointments', payload);
    return response.data;
  },

getMyAppointments: async () => {
    const response = await apiInstance.get('/appointments');
    return response.data; // Retorna direto o array que o Controller mandou
  },

  cancelAppointment: async (id: string | number) => {
    const response = await apiInstance.delete(`/appointments/${id}`);
    return response.data;
  },

  // --- ASSINATURAS ---
  getSubscription: async () => {
    try {
      const response = await apiInstance.get('/user/subscription');
      return response.data;
    } catch (error) {
      return null;
    }
  },

  // Busca os planos da barbearia atual
  getPlans: async (slug: string) => {
    try {
      const response = await apiInstance.get(`/${slug}/plans`);
      return response.data;
    } catch (error) {
      console.log("Erro ao buscar planos:", error);
      return []; // Retorna array vazio para não quebrar a tela
    }
  },

  // Busca detalhes de UM plano específico (para o checkout)
  getPlanDetails: async (slug: string, planId: string | number) => {
    const response = await apiInstance.get(`/${slug}/plans/${planId}`);
    return response.data;
  },

  // Realiza a assinatura
  subscribeToPlan: async (data: { plan_id: number; payment_method: string }) => {
    // POST para /api/subscriptions
    const response = await apiInstance.post('/subscriptions', data);
    return response.data;
  },
};