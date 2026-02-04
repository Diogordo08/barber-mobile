import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CreditCard, Store } from 'lucide-react-native';
import { api } from '../../src/services/api';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { Plan } from '../../src/types';

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams(); // Pega o ID da URL
  const router = useRouter();
  const { theme } = useTheme();
  const { shop } = useAuth();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'store'>('store');

  useEffect(() => {
    async function fetchPlanDetails() {
      if (!shop?.slug || !id) return;
      try {
        // Busca o plano específico (precisa ter essa rota no backend ou filtrar do getPlans)
        // Se a rota getDetails não existir, usamos getPlans e filtramos:
        const plans = await api.getPlans(shop.slug);
        const found = plans.find((p: Plan) => p.id === Number(id));
        
        if (found) {
          setPlan(found);
        } else {
          Alert.alert("Erro", "Plano não encontrado.");
          router.back();
        }
      } catch (error) {
        Alert.alert("Erro", "Falha ao carregar detalhes.");
        router.back();
      } finally {
        setLoading(false);
      }
    }
    fetchPlanDetails();
  }, [id, shop]);

  async function handleSubscribe() {
    if (!plan) return;
    setSubmitting(true);

    try {
      await api.subscribeToPlan({
        plan_id: plan.id,
        payment_method: paymentMethod // 'store' = Pagar no balcão, 'credit_card' = Gateway
      });

      Alert.alert("Sucesso! 🎉", `Você assinou o plano ${plan.name}.`, [
        { text: "OK", onPress: () => router.replace('/(tabs)/perfil') }
      ]);
    } catch (error: any) {
      const msg = error.response?.data?.message || "Erro ao processar assinatura.";
      Alert.alert("Ops!", msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={theme.primary} /></View>;
  if (!plan) return <View style={styles.center}><Text>Plano não encontrado</Text></View>;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        
        {/* Resumo do Plano */}
        <View style={styles.summaryCard}>
          <Text style={styles.label}>Você está assinando:</Text>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={[styles.planPrice, { color: theme.primary }]}>
            R$ {Number(plan.price).toFixed(2)}
            <Text style={{ fontSize: 14, color: '#64748b' }}>/mês</Text>
          </Text>
          <View style={styles.divider} />
          <Text style={styles.description}>{plan.description || "Sem descrição"}</Text>
        </View>

        {/* Método de Pagamento */}
        <Text style={styles.sectionTitle}>Forma de Pagamento</Text>
        
        <TouchableOpacity 
          style={[styles.methodCard, paymentMethod === 'store' && { borderColor: theme.primary, backgroundColor: '#f0f9ff' }]}
          onPress={() => setPaymentMethod('store')}
        >
          <Store size={24} color={paymentMethod === 'store' ? theme.primary : '#64748b'} />
          <View style={{ flex: 1 }}>
            <Text style={styles.methodTitle}>Pagar na Barbearia</Text>
            <Text style={styles.methodDesc}>Ative agora e pague no balcão.</Text>
          </View>
          {paymentMethod === 'store' && <View style={[styles.radio, { backgroundColor: theme.primary }]} />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.methodCard, paymentMethod === 'credit_card' && { borderColor: theme.primary, backgroundColor: '#f0f9ff' }]}
          onPress={() => setPaymentMethod('credit_card')}
        >
          <CreditCard size={24} color={paymentMethod === 'credit_card' ? theme.primary : '#64748b'} />
          <View style={{ flex: 1 }}>
            <Text style={styles.methodTitle}>Cartão de Crédito</Text>
            <Text style={styles.methodDesc}>Cobrança recorrente automática.</Text>
          </View>
          {paymentMethod === 'credit_card' && <View style={[styles.radio, { backgroundColor: theme.primary }]} />}
        </TouchableOpacity>

      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.confirmBtn, { backgroundColor: theme.primary }]}
          onPress={handleSubscribe}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.confirmBtnText}>Confirmar e Assinar</Text>
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
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'white',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  content: { padding: 20 },
  
  summaryCard: {
    backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 30,
    borderWidth: 1, borderColor: '#e2e8f0'
  },
  label: { color: '#64748b', marginBottom: 5 },
  planName: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  planPrice: { fontSize: 28, fontWeight: 'bold', marginVertical: 5 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 15 },
  description: { color: '#334155', lineHeight: 20 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
  
  methodCard: {
    flexDirection: 'row', alignItems: 'center', gap: 15,
    backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 15,
    borderWidth: 1, borderColor: '#e2e8f0'
  },
  methodTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  methodDesc: { fontSize: 13, color: '#64748b' },
  radio: { width: 12, height: 12, borderRadius: 6 },

  footer: {
    padding: 20, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#f1f5f9'
  },
  confirmBtn: {
    height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center'
  },
  confirmBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' }
});