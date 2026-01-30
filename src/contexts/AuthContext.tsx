import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthContextType, Barbershop } from '../types'; // <--- Adicionei Barbershop aqui
import { api } from '../services/api';

// Adicionei shop e selectShop na tipagem se ela não estiver no arquivo de types
// Se já estiver no arquivo types/Auth.ts, ignore essa interface local
interface AuthContextProps extends AuthContextType {
  shop: Barbershop | null;
  selectShop: (data: Barbershop) => Promise<void>;
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
          // Configura o token no header da API imediatamente
          // api.defaults.headers.Authorization = `Bearer ${storedToken}`; 
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
      
      setUser(user);
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || 'E-mail ou senha incorretos.';
      throw new Error(message);
    }
  }

  // 3. Logout (Limpa tudo)
  async function signOut() {
    setUser(null)
    setShop(null) // <--- Limpa a loja também (opcional, depende da regra de negócio)
    await AsyncStorage.multiRemove([
      '@BarberSaaS:user', 
      '@BarberSaaS:token',
      '@BarberSaaS:shop'
    ]);
  }

  // 4. Atualizar Usuário
  async function updateUser(data: Partial<User>) {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    await AsyncStorage.setItem('@BarberSaaS:user', JSON.stringify(updatedUser));
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