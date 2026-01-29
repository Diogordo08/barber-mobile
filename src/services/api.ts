import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appointment, Barber, ServiceItem, Plan, Barbershop, User } from '../types';

// ⚠️ IMPORTANTE:
// No Android Emulator use: 'http://10.0.2.2:8000/api'
// No iPhone Físico/Simulador: 'http://localhost:8000/api' ou o IP da sua máquina 'http://192.168.x.x:8000/api'
const BASE_URL = 'http://192.168.0.191/api'; 

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor: Injeta o Token automaticamente em toda requisição
apiClient.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@BarberSaaS:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Funções da API
export const api = {
  // 1. Buscar dados da Barbearia pelo Slug (Tela de Entrada)
// 1. Buscar dados da Barbearia pelo Slug (Tela de Entrada)
  getBarbershop: async (slug: string): Promise<Barbershop> => {
    // CORREÇÃO: Removemos o "/barbershop" pois sua rota no Laravel é direta "/{slug}"
    const { data } = await apiClient.get(`/${slug}`);
    return data;
  },

  // 2. Buscar Barbeiros (Público)
  getBarbers: async (slug: string): Promise<Barber[]> => {
    const { data } = await apiClient.get(`/${slug}/barbers`);
    return data.data; 
  },

  // 3. Buscar Serviços (Público)
  getServices: async (slug: string): Promise<ServiceItem[]> => {
    const { data } = await apiClient.get(`/${slug}/services`);
    return data;
  },

  // 4. Buscar Horários Livres
  getAvailableSlots: async (slug: string, date: string, barberId: number, serviceId: number): Promise<string[]> => {
    const { data } = await apiClient.get(`/${slug}/slots`, {
      params: { date, barber_id: barberId, service_id: serviceId }
    });
    return data;
  },

  // 5. Autenticação
  login: async (credentials: any) => {
    const { data } = await apiClient.post('/login', credentials);
    return data; // Espera retornar { user, token }
  },

  register: async (userData: any) => {
    const { data } = await apiClient.post('/register', userData);
    return data;
  },

  // 6. Agendamentos
  createAppointment: async (payload: any): Promise<Appointment> => {
    const { data } = await apiClient.post('/appointments', payload);
    return data.appointment;
  },

  getMyAppointments: async (): Promise<{ upcoming: Appointment[], history: Appointment[] }> => {
    const { data } = await apiClient.get('/appointments');
    return data; 
  },

  cancelAppointment: async (id: number): Promise<void> => {
    await apiClient.delete(`/appointments/${id}`);
  }
};