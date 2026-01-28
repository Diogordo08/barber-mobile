import { Tabs } from 'expo-router';
import { Home, Calendar, User } from 'lucide-react-native';
import { useTheme } from '../../src/contexts/ThemeContext'; // Ajuste o caminho se necessário

export default function TabLayout() {
  const { shop } = useTheme();
  // Usa a cor da loja ou o azul padrão como fallback
  const primaryColor = shop?.primaryColor || '#2563eb';

  return (
    <Tabs
      screenOptions={{
        headerShown: false, // Esconde o cabeçalho padrão (vamos criar o nosso nas telas)
        tabBarActiveTintColor: primaryColor, // Cor do ícone quando selecionado
        tabBarInactiveTintColor: '#94a3b8', // Cor cinza quando não selecionado
        tabBarStyle: {
          borderTopColor: '#e2e8f0', // Linha sutil no topo
          backgroundColor: '#ffffff',
          height: 60, // Altura um pouco maior para ficar bom de clicar
          paddingBottom: 10, // Espaço para não colar na borda do iPhone
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        }
      }}
    >
      {/* 1. Rota INÍCIO (Dashboard) */}
      {/* O nome "index" refere-se ao arquivo index.tsx desta pasta */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ color, size }) => <Home color={color} size={size} />,
        }}
      />

      {/* 2. Rota AGENDA (Meus Agendamentos) */}
      {/* O nome "agenda" refere-se ao arquivo agenda.tsx */}
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Agenda',
          tabBarIcon: ({ color, size }) => <Calendar color={color} size={size} />,
        }}
      />

      {/* 3. Rota PERFIL */}
      {/* O nome "perfil" refere-se ao arquivo perfil.tsx */}
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => <User color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}