import React, { createContext, useContext, ReactNode } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from './AuthContext'; // <--- Importamos o AuthContext

interface ThemeContextType {
  theme: {
    primary: string;
    background: string;
    text: string;
    card: string;
  };
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Pegamos o shop direto do AuthContext (onde ele já está salvo!)
  const { shop, loading: authLoading } = useAuth(); 

  const theme = {
    primary: shop?.theme?.primary || '#2563eb', 
    background: '#0f172a', 
    text: '#ffffff',       
    card: '#1e293b'
  };

  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}