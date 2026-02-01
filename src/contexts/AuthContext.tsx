import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthContextType, Barbershop } from '../types'; // <--- Adicionei Barbershop aqui
import { api, apiInstance } from '../services/api';

// Adicionei shop e selectShop na tipagem se ela não estiver no arquivo de types
// Se já estiver no arquivo types/Auth.ts, ignore essa interface local
interface AuthContextProps extends AuthContextType {
    shop: Barbershop | null;
    selectShop: (data: Barbershop) => Promise<void>;
    signUp: (name: string, email: string, password: string, password_confirmation: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextProps>({} as AuthContextProps)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [shop, setShop] = useState<Barbershop | null>(null) // <--- O ESTADO QUE FALTAVA
  const [loading, setLoading] = useState(true)

  // 1. Ao carregar o App, recupera Usuário E Loja
  useEffect(() => {
    async function loadStorageData() {
      try {
        // Carregamos tudo em paralelo
        const [storedUser, storedToken, storedShop] = await Promise.all([
           AsyncStorage.getItem('@BarberSaaS:user'),
           AsyncStorage.getItem('@BarberSaaS:token'),
           AsyncStorage.getItem('@BarberSaaS:shop') // <--- Recupera a loja
        ]);
        
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          // Configura o token no header da API para todas as requisições futuras
          apiInstance.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }

        if (storedShop) {
          setShop(JSON.parse(storedShop)); // <--- Restaura a loja
        }

      } catch (error) {
        console.log('Erro ao carregar dados do storage', error)
      } finally {
        setLoading(false)
      }
    }

    loadStorageData()
  }, [])

  // 2. Login Real
  async function signIn(email: string, password: string) {
    try {
      const response = await api.login({ email, password });
      const { user, token } = response; 

      await AsyncStorage.setItem('@BarberSaaS:token', token);
      await AsyncStorage.setItem('@BarberSaaS:user', JSON.stringify(user));

      // Configura o token no header da API para todas as requisições futuras
      apiInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || 'E-mail ou senha incorretos.';
      throw new Error(message);
    }
  }

  // Função de Cadastro
  async function signUp(name: string, email: string, password: string, password_confirmation: string) {
    try {
      // 1. Chama a API para registrar o novo usuário
      await api.register({ name, email, password, password_confirmation });

      // 2. Se o registro foi bem-sucedido, faz o login para obter o token
      await signIn(email, password);
      
    } catch (error: any) {
      console.error("Erro no cadastro:", error.response?.data || error.message);
      // Tratamento de erro mais inteligente para o Laravel
      if (error.response?.data?.errors) {
        const errors = error.response.data.errors;
        // Pega a primeira mensagem de erro do primeiro campo que falhou
        const firstErrorKey = Object.keys(errors)[0];
        const firstErrorMessage = errors[firstErrorKey][0];
        throw new Error(firstErrorMessage);
      }
      const message = error.response?.data?.message || 'Não foi possível criar a conta.';
      throw new Error(message);
    }
  }

  // 3. Logout (Limpa tudo)
  const signOut = useCallback(async () => {
    // Limpa o AsyncStorage PRIMEIRO para evitar "race conditions" com o redirecionamento.
    await AsyncStorage.multiRemove([
      '@BarberSaaS:user', 
      '@BarberSaaS:token',
      '@BarberSaaS:shop'
    ]);
    // Remove o token dos headers para garantir que o usuário está realmente deslogado.
    delete apiInstance.defaults.headers.common['Authorization'];
    setUser(null);
    setShop(null); // Limpa o estado, o que vai disparar a navegação para a tela de Welcome.
  }, []);

  // Efeito para lidar com erros de autenticação globalmente
  useEffect(() => {
    const responseInterceptor = apiInstance.interceptors.response.use(
      (response) => response, // Passa adiante respostas de sucesso
      async (error) => {
        // Verifica se o erro é 401 e não é uma falha na tela de login (para evitar loops)
        if (error.response?.status === 401 && error.config.url !== '/login') {
          console.log('🚨 Interceptor: Erro 401 detectado. Deslogando usuário.');
          await signOut();
        }
        return Promise.reject(error);
      }
    );

    // Função de limpeza para remover o interceptor quando o componente desmontar
    return () => {
      apiInstance.interceptors.response.eject(responseInterceptor);
    };
  }, [signOut]);

  // 4. Atualizar Usuário
  async function updateUser(data: Partial<User>) {
    if (!user) return; // Segurança
    try {
      // 1. Chama a API para atualizar no backend, garantindo que name e email não sejam undefined
      const updatedUserFromApi = await api.updateUser({ name: data.name || user.name, email: data.email || user.email });

      // 2. Atualiza o estado local e o AsyncStorage com os dados retornados pela API
      setUser(updatedUserFromApi);
      await AsyncStorage.setItem('@BarberSaaS:user', JSON.stringify(updatedUserFromApi));
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      throw new Error("Não foi possível atualizar o perfil. Tente novamente.");
    }
  }

  // 5. NOVA FUNÇÃO: Selecionar Loja (Chamada na tela Welcome ou Login)
  async function selectShop(data: Barbershop) {
    setShop(data);
    await AsyncStorage.setItem('@BarberSaaS:shop', JSON.stringify(data));
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      shop,          // <--- Exportando o shop
      signUp,
      signIn, 
      signOut, 
      updateUser, 
      selectShop,    // <--- Exportando a função de salvar shop
      isAuthenticated: !!user,
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  return context
}