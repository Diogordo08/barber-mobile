import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router'; 
import { ArrowLeft, Scissors, User, Calendar, Clock, CheckCircle, ChevronRight, AlertCircle } from 'lucide-react-native';
import { api } from '../src/services/api';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext'; 
import { Barber, ServiceItem } from '../src/types';

export default function NewAppointment() {
  const router = useRouter();
  const { theme } = useTheme();
  const { shop, user } = useAuth(); 

  const [services, setServices] = useState<ServiceItem[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [slots, setSlots] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(true); // Carregamento inicial da tela
  const [loadingSlots, setLoadingSlots] = useState(false); // <--- NOVO: Carregamento dos horários
  const [submitting, setSubmitting] = useState(false);

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  useFocusEffect(
    useCallback(() => {
      async function loadData() {
        if (!shop?.slug) return;
        try {
          const [barbersData, servicesData] = await Promise.all([
            api.getBarbers(shop.slug),
            api.getServices(shop.slug)
          ]);
          setBarbers(barbersData);
          setServices(servicesData);
        } catch (error) {
          Alert.alert("Erro", "Falha ao carregar dados da barbearia.");
        } finally {
          setLoading(false);
        }
      }
      loadData();
    }, [shop])
  );

  // Busca horários dinâmicos
  useEffect(() => {
    if (step === 3 && selectedDate && selectedBarber && selectedService && shop?.slug) {
      setSlots([]);
      setLoadingSlots(true); // <--- Começa a carregar
      
      api.getAvailableSlots(shop.slug, selectedDate, selectedBarber.id, selectedService.id)
        .then(data => {
            setSlots(data);
        })
        .catch(err => {
            console.log("Erro slots:", err);
            setSlots([]); 
        })
        .finally(() => {
            setLoadingSlots(false); // <--- Termina de carregar
        });
    }
  }, [selectedDate, selectedBarber, selectedService, step, shop?.slug]);

  const generateNextDays = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push({
        fullDate: d.toISOString().split('T')[0],
        day: d.getDate(),
        weekDay: d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', ''),
      });
    }
    return dates;
  };
  const nextDays = generateNextDays();

  function handleNext() {
    if (step === 1 && selectedService) setStep(2);
    else if (step === 2 && selectedBarber) {
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
    if (!shop?.slug || !user) return;

    setSubmitting(true);
    try {
      const fullDateISO = `${selectedDate} ${selectedTime}:00`;

      // 1. Envia para a API
      await api.createAppointment({
        barberId: selectedBarber!.id,
        serviceId: selectedService!.id,
        dateISO: fullDateISO,
        // @ts-ignore
        clientPhone: user.phone || '11999999999' 
      });

      // 2. Formata a data para exibir bonito na tela de sucesso
      const dateFormatted = selectedDate.split('-').reverse().join('/');

      // 3. Sucesso! Navega para a tela de confirmação passando os dados
      router.replace({
        pathname: '/appointment-success',
        params: {
          date: dateFormatted,
          time: selectedTime,
          barberName: selectedBarber?.name,
          serviceName: selectedService?.name
        }
      });

    } catch (error: any) {
      console.log(error.response?.data);
      
      // Tratamento de erro específico do Backend
      let msg = "Falha ao agendar.";
      if (error.response?.data?.message) {
        msg = error.response.data.message;
        
        // Se o erro for de limite de agendamentos (monthly_limit)
        if (msg.includes('limit')) {
            msg = "Você atingiu o limite de agendamentos do seu plano.";
        }
      }
      
      Alert.alert("Não foi possível agendar", msg);
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

      {/* PROGRESSO */}
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
                <Text style={styles.cardSubtitle}>
                  {/* @ts-ignore */}
                  {service.duration_minutes || service.durationMinutes} min • R$ {Number(service.price).toFixed(2)}
                </Text>
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
                <Text style={styles.cardSubtitle}>{barber.role}</Text>
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
                    setSelectedTime('');
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
            
            {/* Lógica de UI Corrigida: Carregando vs Vazio */}
            {loadingSlots ? (
                <View style={{ padding: 40, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color={theme.primary} />
                    <Text style={{ color: '#94a3b8', marginTop: 10 }}>Buscando horários...</Text>
                </View>
            ) : slots.length === 0 ? (
                <View style={{ padding: 20, alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12 }}>
                    <AlertCircle size={32} color="#94a3b8" />
                    <Text style={{ color: '#64748b', marginTop: 10, textAlign: 'center' }}>
                      Nenhum horário disponível nesta data.
                    </Text>
                    <Text style={{ color: '#94a3b8', fontSize: 12 }}>Tente outro dia ou barbeiro.</Text>
                </View>
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
                R$ {Number(selectedService?.price).toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* BOTÃO FLUTUANTE */}
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
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: 'white',
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  progressContainer: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'white',
  },
  progressDot: { height: 4, borderRadius: 2 },
  content: { padding: 20 },
  card: {
    backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 15,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconBox: { padding: 10, borderRadius: 8 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  cardSubtitle: { fontSize: 14, color: '#64748b', marginTop: 2 },
  label: { fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 10, marginTop: 10 },
  dateChip: {
    width: 60, height: 70, justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'white', borderRadius: 12, marginRight: 10,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  dateWeek: { fontSize: 12, color: '#64748b', textTransform: 'uppercase' },
  dateNumber: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeChip: {
    width: '30%', paddingVertical: 12, backgroundColor: 'white',
    borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'center',
  },
  timeText: { fontWeight: '600', color: '#334155' },
  summaryCard: { backgroundColor: 'white', padding: 20, borderRadius: 16 },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  summaryLabel: { fontSize: 12, color: '#64748b' },
  summaryValue: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 10 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20,
    backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#f1f5f9',
  },
  footerBtn: {
    padding: 16, borderRadius: 12, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 10,
  },
  footerBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});