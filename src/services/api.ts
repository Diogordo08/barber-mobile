import axios from 'axios';
import { User, Barbershop, Barber, ServiceItem, Appointment, Plan, Subscription } from '../types';

const SERVER_URL = 'https://barbearia-api-xxvv.onrender.com';
const BASE_URL = `${SERVER_URL}/api`;
const STORAGE_URL = `${SERVER_URL}/storage`;
export const PAYMENTS_DISABLED_MESSAGE = 'Pagamentos estão desativados nesta versão demonstrativa.';

export function apiErrorMessage(error: unknown, fallback: string, options: { notFound?: string; rateLimit?: string; validation?: string } = {}): string {
  if (!axios.isAxiosError(error)) return fallback;
  const status = error.response?.status;
  if (!error.response) return 'Não foi possível conectar ao servidor. Tente novamente.';
  if (status === 403) return 'Esta ação não está disponível nesta conta demonstrativa.';
  if (status === 429) return options.rateLimit || 'Muitas tentativas em pouco tempo. Aguarde alguns instantes.';
  if (status === 404) return options.notFound || 'Recurso não encontrado. Atualize e tente novamente.';
  if (status === 422) {
    const data = error.response?.data;
    const messages = Object.values(data?.errors || {}).flat();
    const message = messages[0] || data?.message;
    if (typeof message === 'string' && message.length <= 300 && !/[{}<>]|SQLSTATE|Exception|Stack trace|axios/i.test(message)) return message;
    return options.validation || fallback;
  }
  return fallback;
}

export function isSessionExpired(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}

/** Converte caminho relativo retornado pelo backend (ex: "avatars/foo.jpg") em URL completa. */
export function storageUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (path.startsWith('http')) return path;
  return `${STORAGE_URL}/${path}`;
}

// Exportando para usar no AuthContext
export const apiInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// AuthContext restaura o header antes de liberar as telas protegidas.

export const api = {
  getUser: async (): Promise<User> => (await apiInstance.get('/user')).data,
  
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
    return response.data.user;
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
    const params = { date, barber_id: barberId, service_id: serviceId };
    const response = await apiInstance.get(`/${slug}/slots`, { params });
    // Suporta tanto array direto quanto { data: [...] } (Laravel Resource)
    const raw = response.data;
    return Array.isArray(raw) ? raw : (raw?.data ?? []);
  },

  createAppointment: async (data: { 
    barberId: number, 
    serviceId: number, 
    dateISO: string
  }) => {
    const payload = {
      barber_id: data.barberId,
      service_id: data.serviceId,
      scheduled_at: data.dateISO,
    };

    const response = await apiInstance.post('/appointments', payload);
    return response.data;
  },

  getMyAppointments: async (): Promise<Appointment[]> => {
    const response = await apiInstance.get('/appointments');
    return response.data; // Retorna direto o array que o Controller mandou
  },

  cancelAppointment: async (id: string | number) => {
    const response = await apiInstance.delete(`/appointments/${id}`);
    return response.data;
  },

  // --- ASSINATURAS ---
  getSubscription: async (): Promise<Subscription | null> => {
    try {
      const response = await apiInstance.get('/user/subscription');
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) return null;
      throw error;
    }
  },

  // Busca os planos da barbearia atual
  getPlans: async (slug: string): Promise<Plan[]> => {
    const response = await apiInstance.get(`/${slug}/plans`);
    return response.data;
  },

  // Realiza a assinatura
  subscribeToPlan: async (data: { 
    plan_id: number; 
    payment_method?: string; 
    card_token?: string; 
    installments?: number;
  }) => {
    const response = await apiInstance.post('/subscribe', data);
    return response.data;
  },

  // Cancela assinatura ativa
  cancelSubscription: async () => {
    const response = await apiInstance.post('/subscribe/cancel');
    return response.data;
  },

  // --- SUPORTE ---
  createReport: async (data: { type: 'bug' | 'suggestion' | 'other'; title: string; description: string }) => {
    const response = await apiInstance.post('/support/report', data);
    return response.data;
  },

  // Revoga o token atual
  logout: async (authorization: string) => {
    const response = await apiInstance.post('/logout', undefined, { headers: { Authorization: authorization } });
    return response.data;
  },
};
