import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router'; // Importante para atualizar ao focar
import { Calendar, Clock, PlusCircle, ChevronRight, Star } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { api } from '../../src/services/api';
import { Appointment } from '../../src/types';

export default function Dashboard() {
  const { user } = useAuth();
  const { theme, shop } = useTheme();
  const router = useRouter();

  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);

  // Busca os dados toda vez que a tela ganha foco
  useFocusEffect(
    useCallback(() => {
      async function loadDashboardData() {
        try {
          const allAppointments = await api.getMyAppointments();
          
          // 1. Filtra apenas os futuros e não cancelados
          const now = new Date();
          const upcoming = allAppointments
            .filter(a => {
              const apptDate = new Date(a.date);
              return apptDate > now && a.status !== 'cancelado';
            })
            // 2. Ordena do mais próximo para o mais distante
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

          // 3. Pega o primeiro (o mais próximo)
          setNextAppointment(upcoming[0] || null);
        } catch (error) {
          console.log("Erro ao carregar dashboard", error);
        } finally {
          setLoading(false);
        }
      }

      loadDashboardData();
    }, [])
  );

  // Helpers para exibir nomes bonitos (já que a API retorna IDs)
  const getServiceName = (id: string) => id === '1' ? 'Corte de Cabelo' : 'Barba Completa';
  const getBarberName = (id: string) => id === '1' ? 'Mestre Bigode' : 'Ana Navalha';

  // Formata Data e Hora
  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return {
      day: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      time: d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* 1. Header (Topo) */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0] || 'Cliente'} 👋</Text>
          <Text style={styles.subGreeting}>Bem-vindo à {shop?.name || 'Barbearia'}</Text>
        </View>
        <Image 
          source={{ uri: user?.avatar || 'https://github.com/shadcn.png' }} 
          style={styles.avatar} 
        />
      </View>

      {/* 2. Card de Próximo Agendamento */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Seu Próximo Corte</Text>
        
        {loading ? (
           <ActivityIndicator color={theme.primary} style={{ margin: 20 }} />
        ) : nextAppointment ? (
          <View style={[styles.card, styles.appointmentCard, { borderLeftColor: theme.primary }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: theme.primary + '20' }]}>
                <Calendar size={24} color={theme.primary} />
              </View>
              <View>
                <Text style={styles.cardTitle}>{getServiceName(nextAppointment.serviceId)}</Text>
                <Text style={styles.cardSubtitle}>com {getBarberName(nextAppointment.barberId)}</Text>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.cardFooter}>
              <View style={styles.timeInfo}>
                <Clock size={16} color="#64748b" />
                <Text style={styles.timeText}>
                  {formatDate(nextAppointment.date).day} às {formatDate(nextAppointment.date).time}
                </Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/(tabs)/agenda')}>
                <Text style={[styles.linkText, { color: theme.primary }]}>Ver detalhes</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Estado vazio (sem agendamento)
          <View style={styles.emptyState}>
            <Text style={{ color: '#64748b' }}>Nenhum agendamento futuro.</Text>
            <Text style={{ color: '#94a3b8', fontSize: 12, marginTop: 4 }}>Que tal marcar um horário?</Text>
          </View>
        )}
      </View>

      {/* 3. Ações Rápidas */}
      <View style={styles.actionsGrid}>
        {/* Botão Novo Agendamento */}
        <TouchableOpacity 
          style={[styles.actionButton, { backgroundColor: theme.primary }]}
          onPress={() => router.push('/new-appointment')}
        >
          <PlusCircle size={32} color="white" />
          <Text style={styles.actionTextMain}>Novo Agendamento</Text>
        </TouchableOpacity>

        <View style={styles.row}>
          {/* Botão Planos */}
          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/plans')}
          >
            <Star size={24} color="#eab308" />
            <Text style={styles.secondaryButtonText}>Planos</Text>
          </TouchableOpacity>

           {/* Botão Histórico */}
           <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => router.push('/(tabs)/agenda')}
          >
            <Calendar size={24} color="#64748b" />
            <Text style={styles.secondaryButtonText}>Histórico</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={{ height: 40 }} /> 
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  subGreeting: {
    fontSize: 14,
    color: '#64748b',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: 'white',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  appointmentCard: {
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconBox: {
    padding: 10,
    borderRadius: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  cardSubtitle: {
    color: '#64748b',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 15,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontWeight: '500',
    color: '#334155',
  },
  linkText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  emptyState: {
    padding: 20,
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    alignItems: 'center',
  },
  actionsGrid: {
    gap: 15,
    marginBottom: 25,
  },
  actionButton: {
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    elevation: 4,
  },
  actionTextMain: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    gap: 15,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    elevation: 2,
  },
  secondaryButtonText: {
    fontWeight: '600',
    color: '#475569',
  },
  promoBanner: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  promoContent: {
    flex: 1,
  },
  promoTitle: {
    color: '#fbbf24',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  promoText: {
    color: '#cbd5e1',
    fontSize: 12,
  },
});