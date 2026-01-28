import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { api } from '../services/api';

// Tipagem das configurações da loja
interface ShopConfig {
  name: string;
  logo: string;
  primaryColor: string;
  secondaryColor?: string;
}

interface ThemeContextType {
  shop: ShopConfig | null;
  theme: {
    primary: string;
    background: string;
    text: string;
    card: string;
  };
  loading: boolean;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [shop, setShop] = useState<ShopConfig | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTheme() {
      try {
        const config = await api.getShopConfig();
        setShop(config);
      } catch (error) {
        console.log('Erro ao carregar tema da loja', error);
      } finally {
        setLoading(false);
      }
    }
    loadTheme();
  }, []);

  // Define as cores dinamicamente baseadas na API
  // Se a API falhar, usa um fallback (Azul #2563eb)
  const theme = {
    primary: shop?.primaryColor || '#2563eb', 
    background: '#f8fafc', // Fundo cinza clarinho padrão
    text: '#1e293b',       // Texto escuro padrão
    card: '#ffffff'
  };

  // Opcional: Mostra loading enquanto busca a cor da marca para não "piscar" azul
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={{ shop, theme, loading }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}