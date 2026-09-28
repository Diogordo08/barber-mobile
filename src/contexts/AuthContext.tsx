import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { User, Barbershop, Subscription } from '../types';
import { api, apiInstance, apiErrorMessage, isSessionExpired } from '../services/api';

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

  const sessionVersion = useRef(0);

  const clearSession = useCallback(async () => {
    sessionVersion.current++;
    delete apiInstance.defaults.headers.common.Authorization;
    setUser(null);
    setSubscription(null);
    setLoadingSubscription(false);
    await AsyncStorage.multiRemove(['@BarberSaaS:user', '@BarberSaaS:token']);
  }, []);

  useEffect(() => {
    const interceptor = apiInstance.interceptors.response.use(response => response, async error => {
      const authorization = error.config?.headers?.Authorization;
      if (isSessionExpired(error) && authorization &&
          authorization === apiInstance.defaults.headers.common.Authorization &&
          !['/login', '/register', '/logout'].includes(error.config?.url)) {
        await clearSession().catch(() => {});
      }
      return Promise.reject(error);
    });
    return () => apiInstance.interceptors.response.eject(interceptor);
  }, [clearSession]);

  function isValidStoredShop(data: any): data is Barbershop {
    return !!data && typeof data === 'object' && typeof data.slug === 'string' && data.slug.trim().length > 0;
  }

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
          const version = sessionVersion.current;
          api.getUser().then(async freshUser => {
            if (version !== sessionVersion.current) return;
            await AsyncStorage.setItem('@BarberSaaS:user', JSON.stringify(freshUser));
            if (version === sessionVersion.current) setUser(freshUser);
          }).catch(() => {}); // Offline mantém o cache; o interceptor trata 401.

        } else {
          setLoadingSubscription(false);
        }

        if (storedShop) {
          const parsedShop = JSON.parse(storedShop);

          if (isValidStoredShop(parsedShop)) {
            setShop(parsedShop);

            // Atualiza em background para pegar campos novos (description, opening_hours, etc.)
            api.getBarbershop(parsedShop.slug)
              .then(async (freshShop) => {
                setShop(freshShop);
                await AsyncStorage.setItem('@BarberSaaS:shop', JSON.stringify(freshShop));
              })
              .catch(async (error: any) => {
                const status = error?.response?.status;

                // Se a barbearia não existe mais/slug mudou, limpa o cache inválido
                if (status === 404) {
                  setShop(null);
                  await AsyncStorage.removeItem('@BarberSaaS:shop');
                }
                // Outros erros mantêm o cache local (ex: offline)
              });
          } else {
            setShop(null);
            await AsyncStorage.removeItem('@BarberSaaS:shop');
          }
        }

      } catch (error) {
        await clearSession().catch(() => {});
      } finally {
        setLoading(false);
      }
    }

    loadStorageData();
  }, []);

  // Função auxiliar para salvar sessão
  async function handleSession(user: User, accessToken: string) {
    if (!user?.id || !accessToken) throw new Error('Resposta de autenticação inválida.');
    await AsyncStorage.multiSet([
      ['@BarberSaaS:token', accessToken],
      ['@BarberSaaS:user', JSON.stringify(user)],
    ]);
    sessionVersion.current++;
    apiInstance.defaults.headers.common.Authorization = 'Bearer ' + accessToken;
    setUser(user);
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
      throw new Error(apiErrorMessage(error, 'E-mail ou senha inválidos. Tente novamente.'));
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
      throw new Error(apiErrorMessage(error, 'Não foi possível criar sua conta. Tente novamente.'));
    }
  }

  // A falha na revogação remota não impede a saída local.
  const signOut = useCallback(async () => {
    const authorization = apiInstance.defaults.headers.common.Authorization;
    if (typeof authorization === 'string') void api.logout(authorization).catch(() => {});
    await clearSession().catch(() => {});
  }, [clearSession]);

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
      throw error;
    }
  }

  // 6. Atualizar Assinatura (chamado após checkout aprovado)
  async function refreshSubscription() {
    setLoadingSubscription(true);
    const version = sessionVersion.current;
    try {
      const sub = await api.getSubscription();
      if (version === sessionVersion.current) setSubscription(sub);
    } catch (error) {
      // Preserva a assinatura conhecida durante falhas temporárias.
      if (version === sessionVersion.current && !isSessionExpired(error)) {
        Alert.alert('Assinatura', apiErrorMessage(error, 'Não foi possível consultar sua assinatura. Tente novamente.'));
      }
    } finally {
      if (version === sessionVersion.current) setLoadingSubscription(false);
    }
  }

  useEffect(() => {
    if (user?.id) void refreshSubscription();
  }, [user?.id]);

  async function selectShop(data: Barbershop) {
    if (!isValidStoredShop(data)) {
      setShop(null);
      await AsyncStorage.removeItem('@BarberSaaS:shop');
      throw new Error('Barbearia inválida.');
    }

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
