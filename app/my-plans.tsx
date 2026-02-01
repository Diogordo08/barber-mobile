import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CreditCard, Calendar, XCircle, RefreshCw, CheckCircle, Crown } from 'lucide-react-native';
import { api } from '../src/services/api';
import { useTheme } from '../src/contexts/ThemeContext';
import { Plan } from '../src/types';

export default function MyPlan() {
  const router = useRouter();
  const { theme, shop } = useTheme(); // 1. Pegamos o shop aqui
  
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [planDetails, setPlanDetails] = useState<Plan | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const sub = await api.getSubscription();
      // 2. Só continua se tiver assinatura E o slug da loja
      if (sub && shop?.slug) {
        setSubscription(sub);
        // 3. Passa o slug para buscar os planos
        const plans = await api.getPlans(shop.slug);
        const details = plans.find((p: Plan) => p.id === sub.planId);
        setPlanDetails(details || null);
      } else {
        // Se não tiver plano, volta pro perfil
        Alert.alert("Aviso", "Você não possui um plano ativo.");
        router.back();
      }
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    Alert.alert(
      "Cancelar Assinatura",
      "Tem certeza? Você perderá os benefícios de cortes ilimitados ao fim do ciclo.",
      [
        { text: "Manter Plano", style: "cancel" },
        { 
          text: "Sim, Cancelar", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            await api.cancelSubscription();
            Alert.alert("Cancelado", "Sua assinatura foi cancelada com sucesso.");
            router.back();
          }
        }
      ]
    );
  }

  function handleChangePlan() {
    // Redireciona para a vitrine de planos
    router.push('/plans');
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={theme.primary} /></View>;
  if (!planDetails) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Gerenciar Assinatura</Text>
      </View>

      <ScrollView>
        {/* Cartão do Plano Atual */}
        <View style={styles.activeCard}>
          <View style={styles.statusBadge}>
            <CheckCircle size={12} color="white" />
            <Text style={styles.statusText}>ATIVO</Text>
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.iconBox}>
              <Crown size={32} color="#fbbf24" fill="#fbbf24" />
            </View>
            <View>
              <Text style={styles.planLabel}>Plano Atual</Text>
              <Text style={styles.planName}>{planDetails.name}</Text>
              <Text style={styles.planPrice}>R$ {planDetails.price.toFixed(2)}/mês</Text>
            </View>
          </View>

          <View style={styles.divider} />
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Calendar size={16} color="#94a3b8" />
              <Text style={styles.infoLabel}>Próxima Cobrança</Text>
              <Text style={styles.infoValue}>{new Date(subscription.nextBillingDate).toLocaleDateString('pt-BR')}</Text>
            </View>
            <View style={styles.infoItem}>
              <CreditCard size={16} color="#94a3b8" />
              <Text style={styles.infoLabel}>Método</Text>
              <Text style={styles.infoValue}>Cartão Final 4242</Text>
            </View>
          </View>
        </View>

        {/* Ações */}
        <Text style={styles.sectionTitle}>Opções</Text>
        
        <TouchableOpacity style={styles.actionBtn} onPress={handleChangePlan}>
          <View style={[styles.iconCircle, { backgroundColor: '#eff6ff' }]}>
            <RefreshCw size={20} color="#2563eb" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Trocar de Plano</Text>
            <Text style={styles.actionDesc}>Faça upgrade ou downgrade</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={handleCancel}>
          <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
            <XCircle size={20} color="#ef4444" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.actionTitle, { color: '#ef4444' }]}>Cancelar Assinatura</Text>
            <Text style={styles.actionDesc}>Encerre a renovação automática</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  backBtn: { marginRight: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },

  activeCard: {
    backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 30,
    elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10,
    position: 'relative', overflow: 'hidden', borderWidth: 1, borderColor: '#fbbf24'
  },
  statusBadge: {
    position: 'absolute', top: 0, right: 0, backgroundColor: '#10b981',
    paddingHorizontal: 12, paddingVertical: 6, borderBottomLeftRadius: 12,
    flexDirection: 'row', alignItems: 'center', gap: 4
  },
  statusText: { color: 'white', fontSize: 10, fontWeight: 'bold' },

  cardContent: { flexDirection: 'row', alignItems: 'center', gap: 15, marginBottom: 20 },
  iconBox: { backgroundColor: '#fffbeb', padding: 12, borderRadius: 50 },
  planLabel: { color: '#64748b', fontSize: 12, textTransform: 'uppercase', marginBottom: 2 },
  planName: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  planPrice: { fontSize: 16, color: '#334155', fontWeight: '500' },

  divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 15 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoItem: { gap: 4 },
  infoLabel: { fontSize: 12, color: '#94a3b8' },
  infoValue: { fontSize: 14, fontWeight: '600', color: '#334155' },

  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#334155', marginBottom: 15 },
  
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 15,
    backgroundColor: 'white', padding: 15, borderRadius: 12, marginBottom: 15,
    elevation: 1
  },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  actionTitle: { fontSize: 16, fontWeight: '600', color: '#1e293b' },
  actionDesc: { fontSize: 12, color: '#64748b' },
});