import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthContextType, Barbershop } from '../types';
import { api, apiInstance } from '../services/api';

interface AuthContextProps {
  user: User | null;
  shop: Barbershop | null;
  loading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string, password_confirmation: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  selectShop: (data: Barbershop) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [shop, setShop] = useState<Barbershop | null>(null);
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
        }

        if (storedShop) {
          setShop(JSON.parse(storedShop));
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
      const message = error.response?.data?.message || 'Credenciais inválidas.';
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
        name: data.name || user.name, 
        email: data.email || user.email 
      });

      setUser(updatedUserFromApi);
      await AsyncStorage.setItem('@BarberSaaS:user', JSON.stringify(updatedUserFromApi));
    } catch (error) {
      throw new Error("Erro ao atualizar perfil.");
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
      signIn, 
      signUp,
      signOut, 
      updateUser, 
      selectShop,
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