import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useFocusEffect } from 'expo-router'; // Hook mágico para recarregar quando a aba ganha foco
import { Calendar, Clock, Scissors, User, AlertCircle, XCircle } from 'lucide-react-native';
import { api } from '../../src/services/api';
import { useTheme } from '../../src/contexts/ThemeContext';
import { Appointment } from '../../src/types';

export default function Agenda() {
  const { theme } = useTheme();
  
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Mapas para traduzir IDs (Na vida real viria do "include" do backend)
  // Como estamos usando Mock, vamos simplificar e exibir o ID ou um nome fixo se não tiver o join
  // Mas para ficar bonito, vou assumir que o objeto Appointment já tem os nomes (veja nota abaixo do código)

  async function loadData() {
    try {
      const data = await api.getMyAppointments();
      // Ordena por data (mais recente primeiro)
      const sorted = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setAppointments(sorted);
    } catch (error) {
      console.log('Erro ao carregar agenda');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // Carrega ao abrir a primeira vez
  // E também recarrega toda vez que você clica na aba "Agenda" (useFocusEffect)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  // Função de Puxar para Atualizar
  function onRefresh() {
    setRefreshing(true);
    loadData();
  }

  // Função de Cancelar
  function handleCancel(id: string) {
    Alert.alert(
      "Cancelar Agendamento",
      "Tem certeza que deseja cancelar? Essa ação não pode ser desfeita.",
      [
        { text: "Não", style: "cancel" },
        { 
          text: "Sim, Cancelar", 
          style: "destructive",
          onPress: async () => {
            try {
              await api.cancelAppointment(id);
              loadData(); // Recarrega a lista
              Alert.alert("Cancelado", "Agendamento cancelado com sucesso.");
            } catch (err) {
              Alert.alert("Erro", "Não foi possível cancelar.");
            }
          }
        }
      ]
    );
  }

  // Renderiza cada cartão da lista
  const renderItem = ({ item }: { item: Appointment }) => {
    // Cores e Textos baseados no status
    let statusColor = '#94a3b8';
    let statusText = item.status;

    switch (item.status) {
      case 'pendente': statusColor = '#f59e0b'; statusText = 'pendente'; break;
      case 'confirmado': statusColor = '#2563eb'; statusText = 'confirmado'; break;
      case 'concluido': statusColor = '#10b981'; statusText = 'concluido'; break;
      case 'cancelado': statusColor = '#ef4444'; statusText = 'cancelado'; break;
    }

    const dateObj = new Date(item.date);
    const dateFormatted = dateObj.toLocaleDateString('pt-BR');
    const timeFormatted = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    // Mock de nomes para preencher visualmente (já que o endpoint getMyAppointments retorna IDs)
    // Na API real, você retornaria o objeto Barber dentro do Appointment
    const barberName = item.barberId === '1' ? 'Mestre Bigode' : 'Ana Navalha'; 
    const serviceName = item.serviceId === '1' ? 'Corte de Cabelo' : item.serviceId === '2' ? 'Barba Completa' : 'Serviço';

    return (
      <View style={[styles.card, { borderLeftColor: statusColor }]}>
        
        {/* Header do Card: Data e Badge */}
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.dateText}>{dateFormatted}</Text>
            <View style={styles.row}>
              <Clock size={14} color="#64748b" />
              <Text style={styles.timeText}>{timeFormatted}</Text>
            </View>
          </View>
          <View style={[styles.badge, { backgroundColor: statusColor + '20' }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>{statusText}</Text>
          </View>
        </View>

        {/* Detalhes: Serviço e Barbeiro */}
        <View style={styles.detailsBox}>
          <View style={styles.row}>
            <Scissors size={16} color="#64748b" />
            <Text style={styles.detailText}>{serviceName}</Text>
          </View>
          <View style={[styles.row, { marginTop: 4 }]}>
            <User size={16} color="#64748b" />
            <Text style={styles.detailText}>{barberName}</Text>
          </View>
        </View>

        {/* Footer: Preço e Ação */}
        <View style={styles.cardFooter}>
          <Text style={[styles.price, { color: theme.primary }]}>
            R$ {item.totalPrice?.toFixed(2)}
          </Text>

          {/* Botão de Cancelar (Só aparece se não for passado/cancelado) */}
          {(item.status === 'pendente' || item.status === 'confirmado') && (
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => handleCancel(item.id)}
            >
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          )}

           {item.status === 'cancelado' && (
             <View style={styles.row}>
               <AlertCircle size={14} color="#ef4444" />
               <Text style={{ fontSize: 12, color: '#ef4444', marginLeft: 4 }}>Cancelado</Text>
             </View>
           )}
        </View>
      </View>
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={styles.pageTitle}>Meus Agendamentos</Text>

      <FlatList
        data={appointments}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        // Pull to Refresh (Puxar pra atualizar)
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />
        }
        // Estado Vazio
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Calendar size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>Sua agenda está livre</Text>
            <Text style={styles.emptyText}>Que tal marcar um trato no visual?</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 20, paddingTop: 60 },
  pageTitle: { fontSize: 24, fontWeight: 'bold', color: '#1e293b', marginBottom: 20 },
  
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 5, // Faixa colorida lateral
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateText: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  timeText: { fontSize: 14, color: '#64748b', marginLeft: 4 },
  
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },

  row: { flexDirection: 'row', alignItems: 'center' },

  detailsBox: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  detailText: { marginLeft: 8, color: '#475569', fontSize: 14 },

  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  price: { fontSize: 18, fontWeight: 'bold' },
  
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 6,
  },
  cancelText: { color: '#ef4444', fontSize: 12, fontWeight: '600' },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#64748b', marginTop: 10 },
  emptyText: { color: '#94a3b8', marginTop: 5 },
});