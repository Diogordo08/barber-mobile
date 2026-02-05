import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Alert, Platform } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { Calendar, Clock, MapPin, User, AlertCircle, XCircle } from 'lucide-react-native';
import { api } from '../../src/services/api';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Appointment } from '../../src/types';

export default function AgendaScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tab, setTab] = useState<'upcoming' | 'history'>('upcoming');

  async function fetchAppointments() {
    try {
      const data = await api.getMyAppointments();
      const list = Array.isArray(data) ? data : (data.data || []);
      setAppointments(list);
    } catch (error) {
      console.log("Erro ao buscar agenda:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [])
  );

  // 🚨 Lógica unificada de cancelamento (API)
  async function executeCancellation(id: number) {
    try {
      setLoading(true); // Mostra spinner
      await api.cancelAppointment(id);
      
      // Pequeno delay para garantir que o banco atualizou
      setTimeout(() => {
        Alert.alert("Sucesso", "Agendamento cancelado!");
        fetchAppointments(); 
      }, 500);
      
    } catch (error) {
      setLoading(false);
      Alert.alert("Erro", "Não foi possível cancelar.");
    }
  }

  // 🚨 Botão Cancelar Híbrido (Funciona na Web e no App)
  function handleCancel(id: number) {
    if (Platform.OS === 'web') {
      // No navegador, usamos o confirm padrão
      const confirmed = window.confirm("Tem certeza que deseja cancelar este agendamento?");
      if (confirmed) {
        executeCancellation(id);
      }
    } else {
      // No celular, usamos o Alert nativo bonito
      Alert.alert(
        "Cancelar Agendamento",
        "Tem certeza que deseja cancelar? Essa ação não pode ser desfeita.",
        [
          { text: "Voltar", style: "cancel" },
          { 
            text: "Sim, Cancelar", 
            style: "destructive", 
            onPress: () => executeCancellation(id) 
          }
        ]
      );
    }
  }

  const parseDate = (dateString: string) => {
    if (!dateString) return new Date();
    return new Date(dateString.replace(' ', 'T'));
  };

  const now = new Date();
  const filteredData = appointments.filter(app => {
    const appDate = parseDate(app.scheduled_at);
    // Filtramos para não mostrar cancelados na aba de próximos
    const isActive = !['cancelled', 'no_show', 'completed'].includes(app.status);
    const isFuture = appDate >= now;

    if (tab === 'upcoming') {
      return isFuture && isActive;
    } else {
      return !isFuture || !isActive;
    }
  }).sort((a, b) => {
    const dateA = parseDate(a.scheduled_at).getTime();
    const dateB = parseDate(b.scheduled_at).getTime();
    return tab === 'upcoming' ? dateA - dateB : dateB - dateA;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return '#16a34a';
      case 'completed': return '#2563eb';
      case 'cancelled': return '#dc2626';
      default: return '#64748b';
    }
  };

  const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
      confirmed: 'Confirmado',
      completed: 'Concluído',
      cancelled: 'Cancelado',
      pending: 'Pendente',
      no_show: 'Não Compareceu'
    };
    return map[status] || status;
  };

  const renderItem = ({ item }: { item: Appointment }) => {
    const dateObj = parseDate(item.scheduled_at);
    const dateStr = dateObj.toLocaleDateString('pt-BR');
    const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
              {getStatusLabel(item.status)}
            </Text>
          </View>
          <Text style={[styles.price, { color: theme.primary }]}>
            R$ {Number(item.total_price || 0).toFixed(2)}
          </Text>
        </View>

        <View style={styles.row}>
          <User size={18} color="#64748b" />
          <Text style={styles.text}>{item.barber?.name || 'Profissional'}</Text>
        </View>

        <View style={styles.row}>
          <Calendar size={18} color="#64748b" />
          <Text style={styles.text}>{dateStr} às {timeStr}</Text>
        </View>

        <View style={styles.row}>
          <MapPin size={18} color="#64748b" />
          <Text style={styles.text}>{item.barbershop?.name || 'Barbearia'}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <Text style={styles.serviceName}>{item.service?.name}</Text>
          
          {tab === 'upcoming' && item.status !== 'cancelled' && (
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => handleCancel(item.id)}
            >
              <XCircle size={16} color="#dc2626" />
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Agendamentos</Text>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tabBtn, tab === 'upcoming' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
          onPress={() => setTab('upcoming')}
        >
          <Text style={[styles.tabText, tab === 'upcoming' && { color: theme.primary, fontWeight: 'bold' }]}>
            Próximos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tabBtn, tab === 'history' && { borderBottomColor: theme.primary, borderBottomWidth: 2 }]}
          onPress={() => setTab('history')}
        >
          <Text style={[styles.tabText, tab === 'history' && { color: theme.primary, fontWeight: 'bold' }]}>
            Histórico
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={theme.primary} /></View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAppointments(); }} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <AlertCircle size={40} color="#cbd5e1" />
              <Text style={{ color: '#94a3b8', marginTop: 10 }}>
                {tab === 'upcoming' ? 'Nenhum agendamento futuro.' : 'Histórico vazio.'}
              </Text>
              {tab === 'upcoming' && (
                <TouchableOpacity onPress={() => router.push('/new-appointment')} style={{ marginTop: 20 }}>
                  <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Agendar Novo</Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'white',
    borderBottomWidth: 1, borderBottomColor: '#f1f5f9'
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  tabs: { flexDirection: 'row', backgroundColor: 'white' },
  tabBtn: { flex: 1, paddingVertical: 15, alignItems: 'center' },
  tabText: { fontSize: 16, color: '#64748b' },
  card: {
    backgroundColor: 'white', borderRadius: 12, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 2
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  badgeText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  price: { fontSize: 16, fontWeight: 'bold' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  text: { color: '#334155', fontSize: 14 },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginVertical: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  serviceName: { fontWeight: 'bold', color: '#1e293b', fontSize: 16 },
  cancelButton: { flexDirection: 'row', alignItems: 'center', gap: 5, padding: 5 },
  cancelText: { color: '#dc2626', fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 50 }
});