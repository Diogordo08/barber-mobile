import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthContextType } from '../types/Auth';
import { api } from '../services/api'; // Importante: Importando a API real

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // 1. Ao carregar o App, recupera o usuário salvo
  useEffect(() => {
    async function loadStorageData() {
      try {
        const storedUser = await AsyncStorage.getItem('@BarberSaaS:user')
        const storedToken = await AsyncStorage.getItem('@BarberSaaS:token')
        
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.log('Erro ao carregar usuário', error)
      } finally {
        setLoading(false)
      }
    }

    loadStorageData()
  }, [])

  // 2. Login Real (Conectado com Laravel)
  async function signIn(email: string, password: string) {
    try {
      // Chama a API que configuramos
      const response = await api.login({ email, password });
      
      // O backend retorna { user, token }
      const { user, token } = response; 

      await AsyncStorage.setItem('@BarberSaaS:token', token);
      await AsyncStorage.setItem('@BarberSaaS:user', JSON.stringify(user));
      
      setUser(user);
    } catch (error: any) {
      console.error(error);
      const message = error.response?.data?.message || 'E-mail ou senha incorretos.';
      throw new Error(message); // A tela de login vai pegar esse erro
    }
  }

  // 3. Logout
  async function signOut() {
    setUser(null)
    await AsyncStorage.removeItem('@BarberSaaS:user')
    await AsyncStorage.removeItem('@BarberSaaS:token')
  }

  // 4. Atualizar Usuário (A função que estava faltando!)
  async function updateUser(data: Partial<User>) {
    if (!user) return;

    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    await AsyncStorage.setItem('@BarberSaaS:user', JSON.stringify(updatedUser));
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      signIn, 
      signOut, 
      updateUser, 
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