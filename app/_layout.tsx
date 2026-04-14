import { cssInterop } from "nativewind";
import { StyleSheet, View, ActivityIndicator } from "react-native";
import { useEffect } from 'react';
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
  const { isAuthenticated, loading, shop } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  useEffect(() => {
    if (loading) return;

    const currentRoute = segments[0] ?? '';
    const inTabsRoute = currentRoute === '(tabs)';
    const inWelcome = currentRoute === 'welcome';
    const inAuthRoute = currentRoute === 'login' || currentRoute === 'register';
    const hasValidShop = !!shop?.slug;

    try {
      if (!hasValidShop) {
        if (!inWelcome) {
          router.replace('/welcome');
        }
        return;
      }

      if (!isAuthenticated) {
        if (!inAuthRoute) {
          router.replace('/login');
        }
        return;
      }

      if (!inTabsRoute) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error("Erro ao verificar slug:", error);
    }
  }, [isAuthenticated, loading, router, segments, shop]);

  if (loading) {
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
