import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { CheckCircle, Calendar, User, Home, CalendarDays } from 'lucide-react-native';
import { useTheme } from '../src/contexts/ThemeContext';

export default function AppointmentSuccess() {
  const router = useRouter();
  const { theme } = useTheme();
  
  // Recebe os dados passados pela tela anterior para confirmar visualmente
  const { date, time, barberName, serviceName } = useLocalSearchParams();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Ícone de Sucesso */}
        <View style={styles.iconContainer}>
          <View style={[styles.circle, { backgroundColor: '#dcfce7' }]}>
            <CheckCircle size={80} color="#16a34a" />
          </View>
        </View>

        <Text style={[styles.title, { color: theme.text }]}>Agendamento Confirmado!</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Seu horário foi reservado com sucesso.
        </Text>

        {/* Card de Detalhes */}
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <View style={styles.row}>
            <User size={20} color={theme.primary} />
            <Text style={[styles.cardText, { color: theme.text }]}>{barberName || 'Barbeiro'}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.row}>
            <Calendar size={20} color={theme.primary} />
            <Text style={[styles.cardText, { color: theme.text }]}>{date} às {time}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.row}>
            <CheckCircle size={20} color={theme.primary} />
            <Text style={[styles.cardText, { color: theme.text }]}>{serviceName || 'Serviço'}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Botões de Ação */}
      <View style={[styles.footer, { backgroundColor: theme.surface, borderTopWidth: 1, borderTopColor: theme.border }]}>
        <TouchableOpacity 
          style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
          onPress={() => router.replace('/(tabs)/agenda')}
        >
          <CalendarDays size={20} color="white" />
          <Text style={styles.primaryBtnText}>Ver na Agenda</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryBtn}
          onPress={() => router.replace('/(tabs)')}
        >
          <Home size={20} color="#64748b" />
          <Text style={[styles.secondaryBtnText, { color: theme.textSecondary }]}>Voltar ao Início</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  
  iconContainer: { marginBottom: 24 },
  circle: { width: 120, height: 120, borderRadius: 60, justifyContent: 'center', alignItems: 'center' },
  
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 40, lineHeight: 24 },

  card: { width: '100%', borderRadius: 16, padding: 20, elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  cardText: { fontSize: 16, fontWeight: '500' },
  divider: { height: 1 },

  footer: { padding: 20, gap: 12 },
  primaryBtn: { flexDirection: 'row', height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: { flexDirection: 'row', height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  secondaryBtnText: { fontSize: 16, fontWeight: '600' },
});