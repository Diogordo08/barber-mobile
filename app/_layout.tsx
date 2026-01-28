import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Slot, useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { ThemeProvider } from '../src/contexts/ThemeContext'; // Se estiver usando o tema
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Componente Interno: Faz a lógica de proteção de rotas
function InitialLayout() {
  const { isAuthenticated, loading } = useAuth();
  const segments = useSegments(); // Pega em qual tela estamos
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Se está carregando o storage, não faz nada ainda

    const inAuthGroup = segments[0] === '(auth)'; // Verifica se está na tela de login

    if (isAuthenticated && !inAuthGroup) {
    } else if (!isAuthenticated) {
      if (segments[0] !== 'login') {
        router.replace('/login');
      }
    }
  }, [isAuthenticated, loading, segments]);

  // Enquanto carrega o Storage (AsyncStorage), mostra um spinner
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  // Slot é o "Outlet" do Expo Router. Renderiza a rota atual.
  return <Slot />;
}

// Componente Raiz: Envolve tudo nos Providers
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