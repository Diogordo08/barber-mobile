import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Scissors, User, Calendar, Clock, CheckCircle, ChevronRight } from 'lucide-react-native';
import { api } from '../src/services/api';
import { useTheme } from '../src/contexts/ThemeContext';
import { Barber, ServiceItem } from '../src/types';

export default function NewAppointment() {
  const router = useRouter();
  const { theme } = useTheme();

  // Estados de Dados
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Estados de Controle (O Wizard)
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null); // null = "Qualquer um" se quiser implementar lógica de 'any'
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  // 1. Carrega Serviços e Barbeiros ao abrir
  useEffect(() => {
    async function loadData() {
      try {
        const [sData, bData] = await Promise.all([api.getServices(), api.getBarbers()]);
        setServices(sData);
        setBarbers(bData);
      } catch (err) {
        Alert.alert("Erro", "Não foi possível carregar os dados.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // 2. Carrega horários quando muda data ou barbeiro
  useEffect(() => {
    if (step === 3 && selectedDate && selectedBarber) {
      setSlots([]); // Limpa para dar feedback visual
      api.getAvailableSlots(selectedDate, selectedBarber.id).then(data => {
        setSlots(data);
      });
    }
  }, [selectedDate, selectedBarber, step]);

  // Helper: Gera os próximos 14 dias para o scroll horizontal
  const generateNextDays = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push({
        fullDate: d.toISOString().split('T')[0], // 2023-10-25
        day: d.getDate(),
        weekDay: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      });
    }
    return dates;
  };

  const nextDays = generateNextDays();

  // Navegação do Wizard
  function handleNext() {
    if (step === 1 && selectedService) setStep(2);
    else if (step === 2 && selectedBarber) {
        // Seleciona automaticamente hoje ao entrar no passo 3
        if (!selectedDate) setSelectedDate(nextDays[0].fullDate); 
        setStep(3);
    }
    else if (step === 3 && selectedDate && selectedTime) setStep(4);
  }

  function handleBack() {
    if (step > 1) setStep(step - 1);
    else router.back();
  }

  async function handleConfirm() {
    setSubmitting(true);
    try {
      // Cria a data completa ISO
      const fullDateISO = `${selectedDate}T${selectedTime}:00`;
      
      await api.createAppointment({
        userId: '1', // Fixo por enquanto
        barberId: selectedBarber!.id,
        serviceId: selectedService!.id,
        date: fullDateISO,
        totalPrice: selectedService!.price
      });

      Alert.alert("Sucesso! 🎉", "Agendamento confirmado.", [
        { text: "OK", onPress: () => router.replace('/(tabs)/agenda') }
      ]);
    } catch (error) {
      Alert.alert("Erro", "Falha ao agendar.");
      setSubmitting(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={theme.primary} /></View>;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {step === 1 && 'Escolha o Serviço'}
          {step === 2 && 'Escolha o Profissional'}
          {step === 3 && 'Data e Horário'}
          {step === 4 && 'Confirmar'}
        </Text>
        <View style={{ width: 24 }} /> 
      </View>

      {/* BARRA DE PROGRESSO */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((s) => (
          <View 
            key={s} 
            style={[
              styles.progressDot, 
              { backgroundColor: step >= s ? theme.primary : '#e2e8f0', flex: step >= s ? 2 : 1 }
            ]} 
          />
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* PASSO 1: SERVIÇOS */}
        {step === 1 && services.map(service => (
          <TouchableOpacity 
            key={service.id} 
            style={[
              styles.card, 
              selectedService?.id === service.id && { borderColor: theme.primary, borderWidth: 2 }
            ]}
            onPress={() => setSelectedService(service)}
          >
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: '#f1f5f9' }]}>
                <Scissors size={24} color="#64748b" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{service.name}</Text>
                <Text style={styles.cardSubtitle}>{service.durationMinutes} min • R$ {service.price.toFixed(2)}</Text>
              </View>
              {selectedService?.id === service.id && <CheckCircle color={theme.primary} size={20} />}
            </View>
          </TouchableOpacity>
        ))}

        {/* PASSO 2: BARBEIROS */}
        {step === 2 && barbers.map(barber => (
          <TouchableOpacity 
            key={barber.id} 
            style={[
              styles.card, 
              selectedBarber?.id === barber.id && { borderColor: theme.primary, borderWidth: 2 }
            ]}
            onPress={() => setSelectedBarber(barber)}
          >
            <View style={styles.cardRow}>
              <Image source={{ uri: barber.avatar }} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{barber.name}</Text>
              </View>
              {selectedBarber?.id === barber.id && <CheckCircle color={theme.primary} size={20} />}
            </View>
          </TouchableOpacity>
        ))}

        {/* PASSO 3: DATA E HORA */}
        {step === 3 && (
          <View>
            <Text style={styles.label}>Selecione o Dia</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {nextDays.map(day => (
                <TouchableOpacity
                  key={day.fullDate}
                  style={[
                    styles.dateChip,
                    selectedDate === day.fullDate && { backgroundColor: theme.primary }
                  ]}
                  onPress={() => {
                    setSelectedDate(day.fullDate);
                    setSelectedTime(''); // Reseta horário ao mudar dia
                  }}
                >
                  <Text style={[styles.dateWeek, selectedDate === day.fullDate && { color: 'white' }]}>
                    {day.weekDay}
                  </Text>
                  <Text style={[styles.dateNumber, selectedDate === day.fullDate && { color: 'white' }]}>
                    {day.day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.label}>Horários Disponíveis</Text>
            {slots.length === 0 ? (
                <Text style={{ color: '#94a3b8', textAlign: 'center', marginTop: 20 }}>Carregando horários...</Text>
            ) : (
                <View style={styles.grid}>
                {slots.map(time => (
                    <TouchableOpacity
                    key={time}
                    style={[
                        styles.timeChip,
                        selectedTime === time && { backgroundColor: theme.primary, borderColor: theme.primary }
                    ]}
                    onPress={() => setSelectedTime(time)}
                    >
                    <Text style={[styles.timeText, selectedTime === time && { color: 'white' }]}>
                        {time}
                    </Text>
                    </TouchableOpacity>
                ))}
                </View>
            )}
          </View>
        )}

        {/* PASSO 4: RESUMO */}
        {step === 4 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resumo do Pedido</Text>
            
            <View style={styles.summaryRow}>
              <Scissors size={20} color={theme.primary} />
              <View>
                <Text style={styles.summaryLabel}>Serviço</Text>
                <Text style={styles.summaryValue}>{selectedService?.name}</Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <User size={20} color={theme.primary} />
              <View>
                <Text style={styles.summaryLabel}>Profissional</Text>
                <Text style={styles.summaryValue}>{selectedBarber?.name}</Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <Calendar size={20} color={theme.primary} />
              <View>
                <Text style={styles.summaryLabel}>Data</Text>
                <Text style={styles.summaryValue}>{selectedDate.split('-').reverse().join('/')}</Text>
              </View>
            </View>

            <View style={styles.summaryRow}>
              <Clock size={20} color={theme.primary} />
              <View>
                <Text style={styles.summaryLabel}>Horário</Text>
                <Text style={styles.summaryValue}>{selectedTime}</Text>
              </View>
            </View>

            <View style={styles.divider} />
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Total</Text>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.primary }}>
                    R$ {selectedService?.price.toFixed(2)}
                </Text>
            </View>
          </View>
        )}
        
        {/* Espaço extra pro scroll não ficar atrás do botão */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* BOTÃO FLUTUANTE DE CONTINUAR */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.footerBtn, 
            { backgroundColor: theme.primary },
            (step === 1 && !selectedService) || (step === 2 && !selectedBarber) || (step === 3 && !selectedTime) 
            ? { opacity: 0.5 } : { opacity: 1 }
          ]}
          onPress={step === 4 ? handleConfirm : handleNext}
          disabled={
            (step === 1 && !selectedService) || 
            (step === 2 && !selectedBarber) || 
            (step === 3 && !selectedTime) ||
            submitting
          }
        >
            {submitting ? (
                <ActivityIndicator color="white" />
            ) : (
                <>
                    <Text style={styles.footerBtnText}>
                        {step === 4 ? 'Confirmar Agendamento' : 'Continuar'}
                    </Text>
                    {step < 4 && <ChevronRight color="white" size={20} />}
                </>
            )}
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  
  progressContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: 'white',
  },
  progressDot: {
    height: 4,
    borderRadius: 2,
  },
  
  content: {
    padding: 20,
  },
  
  // Cards
  card: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  iconBox: {
    padding: 10,
    borderRadius: 8,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  cardSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 2,
  },

  // Date & Time
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 10,
    marginTop: 10,
  },
  dateChip: {
    width: 60,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  dateWeek: { fontSize: 12, color: '#64748b', textTransform: 'uppercase' },
  dateNumber: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeChip: {
    width: '30%',
    paddingVertical: 12,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  timeText: {
    fontWeight: '600',
    color: '#334155',
  },

  // Summary
  summaryCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
  },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  summaryLabel: { fontSize: 12, color: '#64748b' },
  summaryValue: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 10 },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerBtn: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  footerBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  }
});