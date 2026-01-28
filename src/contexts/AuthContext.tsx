import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthContextType } from '../types/Auth' // Certifique-se do caminho

const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true) // <--- Começa carregando

  // 1. Ao carregar a tela, verifica se já tem usuário salvo
  useEffect(() => {
    async function loadStorageData() {
      try {
        const storedUser = await AsyncStorage.getItem('@BarberSaaS:user')
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.log('Erro ao carregar usuário', error)
      } finally {
        // Isso roda sempre, tendo usuário ou não, para liberar a tela
        setLoading(false) 
      }
    }

    loadStorageData()
  }, [])

  // 2. Função de Login
  async function signIn(email: string, password: string) {
    // Simula delay de API
    await new Promise(resolve => setTimeout(resolve, 1000))

    if (password === '123456') {
      const fakeUser: User = {
        id: '1',
        name: 'Cliente Teste',
        email: email,
        avatar: 'https://github.com/shadcn.png'
      }

      setUser(fakeUser)
      // É importante usar o await aqui
      await AsyncStorage.setItem('@BarberSaaS:user', JSON.stringify(fakeUser))
    } else {
      throw new Error('Email ou senha inválidos')
    }
  }

  // 3. Função de Logout
  async function signOut() {
    setUser(null)
    await AsyncStorage.removeItem('@BarberSaaS:user')
  }

  // 4. Atualizar Usuário
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
      loading // Exportando o estado de carregamento
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  return context
}