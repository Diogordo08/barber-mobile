import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme as useDeviceColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Paleta de Cores
const Colors = {
  light: {
    background: '#ffffff',
    surface: '#f8fafc',       // Cinza muito claro para cards
    surfaceHighlight: '#e2e8f0',
    text: '#0f172a',          // Azul noturno quase preto
    textSecondary: '#64748b', // Cinza médio
    primary: '#0f172a',       // Botão principal escuro no modo light
    primaryText: '#ffffff',
    accent: '#d97706',        // Um tom de âmbar/dourado para detalhes
    border: '#e2e8f0',
    error: '#ef4444',
    success: '#22c55e',
  },
  dark: {
    background: '#0f172a',    // Azul noturno profundo
    surface: '#1e293b',       // Um pouco mais claro que o fundo
    surfaceHighlight: '#334155',
    text: '#f1f5f9',          // Branco gelo
    textSecondary: '#94a3b8', // Cinza azulado claro
    primary: '#fbbf24',       // Dourado vibrante para destaque no escuro
    primaryText: '#0f172a',   // Texto escuro no botão dourado
    accent: '#fbbf24',
    border: '#334155',
    error: '#f87171',
    success: '#4ade80',
  }
};

type ThemeType = typeof Colors.light;

interface ThemeContextData {
  theme: ThemeType;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const deviceScheme = useDeviceColorScheme();
  const [isDark, setIsDark] = useState(deviceScheme === 'dark');

  // Carrega preferência salva
  useEffect(() => {
    async function loadTheme() {
      const savedTheme = await AsyncStorage.getItem('@BarberSaaS:theme');
      if (savedTheme) {
        setIsDark(savedTheme === 'dark');
      }
    }
    loadTheme();
  }, []);

  const toggleTheme = async () => {
    const newMode = !isDark;
    setIsDark(newMode);
    await AsyncStorage.setItem('@BarberSaaS:theme', newMode ? 'dark' : 'light');
  };

  const theme = isDark ? Colors.dark : Colors.light;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}