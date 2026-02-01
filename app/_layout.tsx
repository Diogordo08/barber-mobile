import { cssInterop } from "nativewind";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import "../global.css";

// Configuração para evitar crash do NativeWind na Web
try {
  // @ts-ignore
  if (StyleSheet.setFlag) {
     // @ts-ignore
     StyleSheet.setFlag('darkMode', 'class');
  }
} catch (e) {
  console.log("Erro ao configurar NativeWind", e);
}

// Componente Interno: Proteção de Rotas
function InitialLayout() {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isCheckingSlug, setIsCheckingSlug] = useState(true);

  useEffect(() => {
    async function checkSlug() {
      try {
        const shopData = await AsyncStorage.getItem('@BarberSaaS:shop');
        const inWelcome = segments[0] === 'welcome';

        if (loading) return;

        // Regras de Redirecionamento
        if (!shopData && !inWelcome) {
          router.replace('/welcome');
        } else if (shopData && !isAuthenticated && segments[0] !== 'login' && segments[0] !== 'register') {
          router.replace('/login');
        } else if (isAuthenticated && segments[0] === 'login') {
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

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      {/* 🟢 CORREÇÃO: AuthProvider PRIMEIRO (Pai) */}
      <AuthProvider>
        {/* 🟢 ThemeProvider DEPOIS (Filho) */}
        <ThemeProvider>
          <InitialLayout />
        </ThemeProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}