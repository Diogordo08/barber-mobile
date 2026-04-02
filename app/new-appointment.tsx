import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router'; 
import { ArrowLeft, Scissors, User, Calendar, Clock, CheckCircle, ChevronRight, AlertCircle } from 'lucide-react-native';
import { api, storageUrl } from '../src/services/api';
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
            // Filtra horários já passados quando a data selecionada é hoje
            const todayStr = (() => {
              const t = new Date();
              return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
            })();
            if (selectedDate === todayStr) {
              const now = new Date();
              const nowMinutes = now.getHours() * 60 + now.getMinutes() + 15; // 15min de margem
              data = data.filter((slot: string) => {
                const [h, m] = slot.split(':').map(Number);
                return h * 60 + m > nowMinutes;
              });
            }
            setSlots(data);
        })
        .catch(err => {
            const status = err.response?.status;
            const msg = err.response?.data?.message || err.message || 'Erro de rede';
            console.log(`[Slots] ERRO [${status}]:`, msg, JSON.stringify(err.response?.data));
            setSlots([]);
            if (!status) {
              Alert.alert(
                'Erro de conexão',
                'Não foi possível buscar os horários.\n\nSe estiver testando pelo navegador, use o Expo Go no celular — o browser bloqueia requisições por CORS.'
              );
            } else if (status !== 404) {
              Alert.alert('Erro ao buscar horários', `[${status}] ${msg}`);
            }
        })
        .finally(() => {
            setLoadingSlots(false);
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
        fullDate: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
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
      // Backend espera formato "Y-m-d H:i:s" (espaço, não T)
      const fullDateISO = `${selectedDate} ${selectedTime}:00`;

      // 1. Envia para a API
      await api.createAppointment({
        barberId: selectedBarber!.id,
        serviceId: selectedService!.id,
        dateISO: fullDateISO,
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
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          {step === 1 && 'Escolha o Serviço'}
          {step === 2 && 'Escolha o Profissional'}
          {step === 3 && 'Data e Horário'}
          {step === 4 && 'Confirmar'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* PROGRESSO */}
      <View style={[styles.progressContainer, { backgroundColor: theme.surface }]}>
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
              { backgroundColor: theme.surface, borderColor: theme.border },
              selectedService?.id === service.id && { borderColor: theme.primary, borderWidth: 2 }
            ]}
            onPress={() => setSelectedService(service)}
          >
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
                <Scissors size={24} color={theme.textSecondary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{service.name}</Text>
                <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
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
              { backgroundColor: theme.surface, borderColor: theme.border },
              selectedBarber?.id === barber.id && { borderColor: theme.primary, borderWidth: 2 }
            ]}
            onPress={() => setSelectedBarber(barber)}
          >
            <View style={styles.cardRow}>
              {storageUrl(barber.avatar) ? (
                <Image source={{ uri: storageUrl(barber.avatar) }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
                  <User size={28} color={theme.textSecondary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>{barber.name}</Text>
                <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>{barber.role}</Text>
              </View>
              {selectedBarber?.id === barber.id && <CheckCircle color={theme.primary} size={20} />}
            </View>
          </TouchableOpacity>
        ))}

        {/* PASSO 3: DATA E HORA */}
        {step === 3 && (
          <View>
            <Text style={[styles.label, { color: theme.text }]}>Selecione o Dia</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              {nextDays.map(day => (
                <TouchableOpacity
                  key={day.fullDate}
                  style={[
                    styles.dateChip,
                    { backgroundColor: theme.surface, borderColor: theme.border },
                    selectedDate === day.fullDate && { backgroundColor: theme.primary, borderColor: theme.primary }
                  ]}
                  onPress={() => {
                    setSelectedDate(day.fullDate);
                    setSelectedTime('');
                  }}
                >
                  <Text style={[styles.dateWeek, { color: theme.textSecondary }, selectedDate === day.fullDate && { color: 'white' }]}>
                    {day.weekDay}
                  </Text>
                  <Text style={[styles.dateNumber, { color: theme.text }, selectedDate === day.fullDate && { color: 'white' }]}>
                    {day.day}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={[styles.label, { color: theme.text }]}>Horários Disponíveis</Text>
            
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
                {slots.map((slot) => (
                  <TouchableOpacity
                    key={`slot-${slot}`}
                    style={[
                      styles.timeChip,
                      { backgroundColor: theme.surface, borderColor: theme.border },
                      selectedTime === slot && { backgroundColor: theme.primary, borderColor: theme.primary }
                    ]}
                    onPress={() => setSelectedTime(slot)}
                  >
                    <Text style={[styles.timeText, { color: theme.text }, selectedTime === slot && { color: 'white' }]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* PASSO 4: RESUMO */}
        {step === 4 && (
          <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.summaryTitle, { color: theme.text }]}>Resumo do Pedido</Text>
            <View style={styles.summaryRow}>
              <Scissors size={20} color={theme.primary} />
              <View>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Serviço</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>{selectedService?.name}</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <User size={20} color={theme.primary} />
              <View>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Profissional</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>{selectedBarber?.name}</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <Calendar size={20} color={theme.primary} />
              <View>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Data</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>{selectedDate.split('-').reverse().join('/')}</Text>
              </View>
            </View>
            <View style={styles.summaryRow}>
              <Clock size={20} color={theme.primary} />
              <View>
                <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Horário</Text>
                <Text style={[styles.summaryValue, { color: theme.text }]}>{selectedTime}</Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.text }}>Total</Text>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: theme.primary }}>
                R$ {Number(selectedService?.price).toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* BOTÃO FLUTUANTE */}
      <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
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
  },
  backButton: { padding: 5 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  progressContainer: {
    flexDirection: 'row', gap: 8, paddingHorizontal: 20, paddingBottom: 20,
  },
  progressDot: { height: 4, borderRadius: 2 },
  content: { padding: 20 },
  card: {
    padding: 15, borderRadius: 12, marginBottom: 15,
    borderWidth: 1,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconBox: { padding: 10, borderRadius: 8 },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardSubtitle: { fontSize: 14, marginTop: 2 },
  label: { fontSize: 16, fontWeight: '600', marginBottom: 10, marginTop: 10 },
  dateChip: {
    width: 60, height: 70, justifyContent: 'center', alignItems: 'center',
    borderRadius: 12, marginRight: 10, borderWidth: 1,
  },
  dateWeek: { fontSize: 12, textTransform: 'uppercase' },
  dateNumber: { fontSize: 20, fontWeight: 'bold' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  timeChip: {
    width: '30%', paddingVertical: 12,
    borderRadius: 8, borderWidth: 1, alignItems: 'center',
  },
  timeText: { fontWeight: '600' },
  summaryCard: { padding: 20, borderRadius: 16 },
  summaryTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  summaryLabel: { fontSize: 12 },
  summaryValue: { fontSize: 16, fontWeight: 'bold' },
  divider: { height: 1, marginVertical: 10 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20,
    borderTopWidth: 1,
  },
  footerBtn: {
    padding: 16, borderRadius: 12, flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center', gap: 10,
  },
  footerBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' }
});