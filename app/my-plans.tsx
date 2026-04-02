import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Platform, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CreditCard, Calendar, XCircle, RefreshCw, CheckCircle, Crown } from 'lucide-react-native';
import { api } from '../src/services/api';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { Plan } from '../src/types';

const TOP_PADDING = Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight ?? 24) + 16;

export default function MyPlan() {
  const router = useRouter();
  const { theme } = useTheme();
  const { shop, subscription } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [planDetails, setPlanDetails] = useState<Plan | null>(null);

  useEffect(() => {
    loadData();
  }, [subscription]);

  async function loadData() {
    if (!subscription) {
      setLoading(false);
      Alert.alert("Aviso", "Você não possui um plano ativo.");
      router.back();
      return;
    }
    if (!shop?.slug) { setLoading(false); return; }
    try {
      const plans = await api.getPlans(shop.slug);
      const details = plans.find((p: Plan) => p.id === subscription.plan_id);
      setPlanDetails(details || subscription.plan || null);
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
            try {
              await api.cancelSubscription();
              Alert.alert("Cancelado", "Sua assinatura foi cancelada com sucesso.");
              router.back();
            } catch {
              setLoading(false);
              Alert.alert("Erro", "Não foi possível cancelar. Tente novamente.");
            }
          }
        }
      ]
    );
  }

  function handleChangePlan() {
    // Redireciona para a vitrine de planos
    router.push('/plans');
  }

  const { expires_at, payment_method, plan_id } = subscription ?? {};

  if (loading) return <View style={styles.center}><ActivityIndicator color={theme.primary} /></View>;
  if (!planDetails || !subscription) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.background, paddingTop: TOP_PADDING }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Gerenciar Assinatura</Text>
      </View>

      <ScrollView>
        {/* Cartão do Plano Atual */}
        <View style={[styles.activeCard, { backgroundColor: theme.surface }]}>
          <View style={styles.statusBadge}>
            <CheckCircle size={12} color="white" />
            <Text style={styles.statusText}>ATIVO</Text>
          </View>
          
          <View style={styles.cardContent}>
            <View style={styles.iconBox}>
              <Crown size={32} color="#fbbf24" fill="#fbbf24" />
            </View>
            <View>
              <Text style={[styles.planLabel, { color: theme.textSecondary }]}>Plano Atual</Text>
              <Text style={[styles.planName, { color: theme.text }]}>{planDetails.name}</Text>
              <Text style={[styles.planPrice, { color: theme.textSecondary }]}>R$ {Number(planDetails.price).toFixed(2)}/mês</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Calendar size={16} color={theme.textSecondary} />
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Próxima Cobrança</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{subscription?.expires_at ? new Date(subscription.expires_at).toLocaleDateString('pt-BR') : '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <CreditCard size={16} color={theme.textSecondary} />
              <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>Método</Text>
              <Text style={[styles.infoValue, { color: theme.text }]}>{subscription?.payment_method === 'pix' ? 'PIX' : subscription?.payment_method === 'card' ? 'Cartão' : 'Não informado'}</Text>
            </View>
          </View>
        </View>

        {/* Ações */}
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Opções</Text>
        
        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.surface }]} onPress={handleChangePlan}>
          <View style={[styles.iconCircle, { backgroundColor: '#eff6ff' }]}>
            <RefreshCw size={20} color="#2563eb" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.actionTitle, { color: theme.text }]}>Trocar de Plano</Text>
            <Text style={[styles.actionDesc, { color: theme.textSecondary }]}>Faça upgrade ou downgrade</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.surface }]} onPress={handleCancel}>
          <View style={[styles.iconCircle, { backgroundColor: '#fee2e2' }]}>
            <XCircle size={20} color="#ef4444" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.actionTitle, { color: '#ef4444' }]}>Cancelar Assinatura</Text>
            <Text style={[styles.actionDesc, { color: theme.textSecondary }]}>Encerre a renovação automática</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 20 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 25 },
  backBtn: { marginRight: 15 },
  title: { fontSize: 20, fontWeight: 'bold' },

  activeCard: {
    borderRadius: 16, padding: 20, marginBottom: 30,
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
  planName: { fontSize: 22, fontWeight: 'bold' },
  planPrice: { fontSize: 16, fontWeight: '500' },

  divider: { height: 1, marginBottom: 15 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoItem: { gap: 4 },
  infoLabel: { fontSize: 12 },
  infoValue: { fontSize: 14, fontWeight: '600' },

  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 15 },
  
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 15,
    padding: 15, borderRadius: 12, marginBottom: 15,
    elevation: 1
  },
  iconCircle: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  actionTitle: { fontSize: 16, fontWeight: '600' },
  actionDesc: { fontSize: 12 },
});