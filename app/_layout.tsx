
import { cssInterop } from "nativewind";
import { StyleSheet } from "react-native";

try {
  // Tenta configurar o modo escuro para evitar o crash na web
  // @ts-ignore
  if (StyleSheet.setFlag) {
     // @ts-ignore
     StyleSheet.setFlag('darkMode', 'class');
  }
} catch (e) {
  console.log("Erro ao configurar NativeWind", e);
}

import { useEffect, useState } from 'react'; // <--- Adicionei useState aqui
import { View, ActivityIndicator } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import "../global.css";

// Componente Interno: Faz a lógica de proteção de rotas
function InitialLayout() {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isCheckingSlug, setIsCheckingSlug] = useState(true); // Agora vai funcionar

  useEffect(() => {
    async function checkSlug() {
      try {
        const slug = await AsyncStorage.getItem('@BarberSaaS:slug');
        
        // Lógica de proteção de rota
        const inAuthGroup = segments[0] === '(auth)';
        const inWelcome = segments[0] === 'welcome';

        if (loading) return;

        if (!slug && !inWelcome) {
          // Sem slug -> Tela de Welcome
          router.replace('/welcome');
        } else if (slug && !isAuthenticated && segments[0] !== 'login') {
          // Tem slug mas não tá logado -> Login
          router.replace('/login');
        } else if (isAuthenticated && segments[0] === 'login') {
          // Logado tentando ir pro login -> Home
          router.replace('/(tabs)');
        }
      } catch (error) {
        console.error("Erro ao verificar slug:", error);
      } finally {
        setIsCheckingSlug(false);
      }
    }

    checkSlug();
  }, [isAuthenticated, loading, segments]);

  if (loading || isCheckingSlug) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return <Slot />;
}

// Componente Raiz
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <InitialLayout />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}