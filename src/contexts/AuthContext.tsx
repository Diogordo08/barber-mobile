import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthContextType, Barbershop, Subscription } from '../types';
import { api, apiInstance } from '../services/api';

interface AuthContextProps {
  user: User | null;
  shop: Barbershop | null;
  subscription: Subscription | null;
  loadingSubscription: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, password_confirmation: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  selectShop: (data: Barbershop) => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Barbershop | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);
  const [loading, setLoading] = useState(true);

  // 1. Carregar dados salvos ao abrir o app
  useEffect(() => {
    async function loadStorageData() {
      try {
        const [storedUser, storedToken, storedShop] = await Promise.all([
           AsyncStorage.getItem('@BarberSaaS:user'),
           AsyncStorage.getItem('@BarberSaaS:token'),
           AsyncStorage.getItem('@BarberSaaS:shop')
        ]);
        
        if (storedUser && storedToken) {
          // Injeta o token recuperado direto no Axios
          apiInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          setUser(JSON.parse(storedUser));
          // Busca assinatura em background
          api.getSubscription()
            .then(setSubscription)
            .catch(() => setSubscription(null))
            .finally(() => setLoadingSubscription(false));
        } else {
          setLoadingSubscription(false);
        }

        if (storedShop) {
          const parsedShop = JSON.parse(storedShop);
          setShop(parsedShop);
          // Atualiza em background para pegar campos novos (description, opening_hours, etc.)
          api.getBarbershop(parsedShop.slug).then(async (freshShop) => {
            setShop(freshShop);
            await AsyncStorage.setItem('@BarberSaaS:shop', JSON.stringify(freshShop));
          }).catch(() => { /* mantém cache se offline */ });
        }

      } catch (error) {
        console.log('Erro ao carregar dados', error);
      } finally {
        setLoading(false);
      }
    }

    loadStorageData();
  }, []);

  // Função auxiliar para salvar sessão
  async function handleSession(user: User, accessToken: string) {
    // 1. Configura Header (Imediato)
    apiInstance.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
    
    // 2. Atualiza Estado
    setUser(user);

    // 3. Persiste no Disco
    await AsyncStorage.setItem('@BarberSaaS:token', accessToken);
    await AsyncStorage.setItem('@BarberSaaS:user', JSON.stringify(user));
  }

  // 2. Login
  async function signIn(email: string, password: string) {
    try {
      const response = await api.login({ email, password });
      
      // 🚨 CORREÇÃO CRÍTICA AQUI:
      // O Laravel retorna 'access_token', mas a gente renomeia para 'token'
      const { user, access_token } = response; 

      await handleSession(user, access_token);
      
    } catch (error: any) {
      console.error("Erro no login:", error);
      const status = error.response?.status;
      let message: string;
      if (status === 429) {
        message = 'Muitas tentativas. Aguarde 1 minuto e tente novamente.';
      } else {
        message =
          error.response?.data?.errors?.email?.[0] ||
          error.response?.data?.message ||
          'Credenciais inválidas.';
      }
      throw new Error(message);
    }
  }

  // 3. Cadastro (Agora Otimizado!)
  async function signUp(name: string, email: string, password: string, password_confirmation: string) {
    try {
      // O Laravel já retorna o token no registro! Não precisa logar de novo.
      const response = await api.register({ name, email, password, password_confirmation });
      
      const { user, access_token } = response; // Pega o token direto do cadastro

      await handleSession(user, access_token); // Já loga o usuário direto

    } catch (error: any) {
      console.error("Erro no cadastro:", error.response?.data || error.message);
      
      // Tratamento de erros de validação do Laravel
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        const firstErrorKey = Object.keys(errors)[0];
        const firstErrorMessage = errors[firstErrorKey][0];
        throw new Error(firstErrorMessage);
      }
      
      const message = error.response?.data?.message || 'Falha ao criar conta.';
      throw new Error(message);
    }
  }

  // 4. Logout
  const signOut = useCallback(async () => {
    delete apiInstance.defaults.headers.common['Authorization'];
    setUser(null);
    setShop(null);
    setSubscription(null);
    setLoadingSubscription(false);
    
    await AsyncStorage.multiRemove([
      '@BarberSaaS:user', 
      '@BarberSaaS:token',
      '@BarberSaaS:shop'
    ]);
  }, []);

  // Interceptor de Erro 401
  useEffect(() => {
    const responseInterceptor = apiInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && !error.config.url?.includes('/login')) {
          console.log('🚨 Sessão expirada. Deslogando...');
          await signOut();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      apiInstance.interceptors.response.eject(responseInterceptor);
    };
  }, [signOut]);

  // 5. Atualizar Usuário
  async function updateUser(data: Partial<User>) {
    if (!user) return;
    try {
      const updatedUserFromApi = await api.updateUser({ 
        name: data.name !== undefined ? data.name : user.name, 
        email: data.email !== undefined ? data.email : user.email,
      });
      setUser(updatedUserFromApi);
      await AsyncStorage.setItem('@BarberSaaS:user', JSON.stringify(updatedUserFromApi));
    } catch (error) {
      throw new Error("Erro ao atualizar perfil.");
    }
  }

  // 6. Atualizar Assinatura (chamado após checkout aprovado)
  async function refreshSubscription() {
    setLoadingSubscription(true);
    try {
      const sub = await api.getSubscription();
      setSubscription(sub);
    } catch {
      setSubscription(null);
    } finally {
      setLoadingSubscription(false);
    }
  }

  async function selectShop(data: Barbershop) {
    setShop(data);
    await AsyncStorage.setItem('@BarberSaaS:shop', JSON.stringify(data));
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      shop,
      subscription,
      loadingSubscription,
      signIn, 
      signUp,
      signOut, 
      updateUser, 
      selectShop,
      refreshSubscription,
      isAuthenticated: !!user,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  return context;
}