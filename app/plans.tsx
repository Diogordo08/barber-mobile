import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Crown } from 'lucide-react-native';
import { api } from '../src/services/api';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';
import { Plan } from '../src/types';

export default function PlansScreen() {
  const router = useRouter();
  const { shop, user } = useAuth();
  const { theme } = useTheme();
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      if (!shop?.slug) return;
      try {
        const data = await api.getPlans(shop.slug);
        setPlans(data);
      } catch (error) {
        Alert.alert("Erro", "Não foi possível carregar os planos.");
      } finally {
        setLoading(false);
      }
    }
    fetchPlans();
  }, [shop]);

  function handleSelectPlan(plan: Plan) {
    if (!user) {
      Alert.alert("Login necessário", "Você precisa entrar para assinar um plano.", [
        { text: "Fazer Login", onPress: () => router.push('/login') }
      ]);
      return;
    }
    // Redireciona para o checkout com o ID do plano
    router.push(`/checkout/${plan.id}`);
  }

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Planos & Assinaturas</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.subtitle}>
          Economize e mantenha o estilo em dia com nossos planos mensais.
        </Text>

        {plans.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ color: '#94a3b8' }}>Nenhum plano disponível no momento.</Text>
          </View>
        ) : (
          plans.map((plan) => (
            <View key={plan.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.planName}>{plan.name}</Text>
                {/* Destaque visual simples */}
                <Crown size={24} color={theme.primary} />
              </View>

              <Text style={[styles.planPrice, { color: theme.primary }]}>
                R$ {Number(plan.price).toFixed(2)}
                <Text style={styles.period}>/mês</Text>
              </Text>

              <View style={styles.features}>
                <View style={styles.featureRow}>
                  <Check size={18} color="#10b981" />
                  <Text style={styles.featureText}>
                    {plan.cuts_per_month ? `${plan.cuts_per_month} cortes por mês` : 'Cortes Ilimitados'}
                  </Text>
                </View>
                
                {/* Se houver descrição, exibe */}
                {plan.description && (
                  <View style={styles.featureRow}>
                    <Check size={18} color="#10b981" />
                    <Text style={styles.featureText} numberOfLines={2}>
                      {plan.description}
                    </Text>
                  </View>
                )}
              </View>

              <TouchableOpacity 
                style={[styles.button, { backgroundColor: theme.primary }]}
                onPress={() => handleSelectPlan(plan)}
              >
                <Text style={styles.buttonText}>Assinar Agora</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'white'
  },
  backBtn: { padding: 5 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  content: { padding: 20 },
  subtitle: { fontSize: 16, color: '#64748b', textAlign: 'center', marginBottom: 24 },
  emptyState: { alignItems: 'center', marginTop: 50 },
  
  card: {
    backgroundColor: 'white', borderRadius: 16, padding: 24, marginBottom: 20,
    borderWidth: 1, borderColor: '#e2e8f0',
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  planName: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  planPrice: { fontSize: 32, fontWeight: 'bold', marginBottom: 20 },
  period: { fontSize: 16, color: '#64748b', fontWeight: 'normal' },
  features: { gap: 12, marginBottom: 24 },
  featureRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  featureText: { fontSize: 15, color: '#334155', flex: 1 },
  button: { height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
});