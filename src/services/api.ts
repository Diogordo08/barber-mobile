import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Barbershop, Barber, ServiceItem, Appointment } from '../types';

// ⚠️ IMPORTANTE: Use o IP que funcionou para você anteriormente (192.168.0.191)
// Se mudar de rede Wi-Fi, lembre-se de atualizar aqui.
const BASE_URL = 'http://192.168.0.191/api';

// 1. Criamos a instância do Axios (A "axiosInstance")
const apiInstance = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 2. Configuração Mágica (Interceptor)
// Antes de cada requisição, ele vai no storage, pega o token e anexa no cabeçalho.
apiInstance.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('@BarberSaaS:token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 3. O Objeto API com todas as funções do App
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
    const response = await apiInstance.put('/user', data); // Requer Auth
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

  getPlans: async (slug: string) => {
    try {
      const response = await apiInstance.get(`/${slug}/plans`);
      return response.data;
    } catch (e) {
      return []; // Retorna vazio se der erro
    }
  },

  // --- AGENDAMENTOS ---
  getAvailableSlots: async (slug: string, date: string, barberId: string | number) => {
    // Ex: /victor-azambuja/slots?date=2023-10-01&barber_id=1&service_id=1
    // (Ajuste os parâmetros conforme seu backend espera)
    const response = await apiInstance.get(`/${slug}/slots`, {
      params: { date, barber_id: barberId, service_id: 1 } // service_id fixo por enquanto ou passar por parametro
    });
    return response.data;
  },

  createAppointment: async (data: any) => {
    const response = await apiInstance.post('/appointments', data); // Requer Auth
    return response.data;
  },

  getMyAppointments: async () => {
    const response = await apiInstance.get('/appointments'); // Requer Auth
    return response.data;
  },

  // --- ASSINATURAS ---
  getSubscription: async () => {
    // Se o backend ainda não tiver a rota, vai dar erro 404 (menos pior que crashar)
    // Mas pelo menos a tela abre e você consegue clicar em SAIR.
    try {
      const response = await apiInstance.get('/user/subscription');
      return response.data;
    } catch (e) {
      return null; // Retorna nulo se der erro, assim a tela não trava
    }
  }
};