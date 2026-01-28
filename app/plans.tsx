import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Check, Star } from 'lucide-react-native';
import { api } from '../src/services/api';
import { useTheme } from '../src/contexts/ThemeContext';
import { Plan } from '../src/types';

export default function Plans() {
  const router = useRouter();
  const { theme } = useTheme();
  
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPlans().then(data => {
      setPlans(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <View style={styles.center}><ActivityIndicator color={theme.primary} /></View>;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Clube de Assinatura 💎</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.subtitle}>
          Economize e mantenha o visual sempre em dia.
        </Text>

        <View style={styles.grid}>
          {plans.map(plan => (
            <View 
              key={plan.id}
              style={[
                styles.card,
                plan.recommended && { borderColor: theme.primary, borderWidth: 2, transform: [{ scale: 1.02 }] }
              ]}
            >
              {plan.recommended && (
                <View style={[styles.badge, { backgroundColor: theme.primary }]}>
                  <Star size={12} color="white" fill="white" />
                  <Text style={styles.badgeText}>RECOMENDADO</Text>
                </View>
              )}

              <Text style={styles.planName}>{plan.name}</Text>
              <Text style={styles.planDesc}>{plan.description}</Text>
              
              <View style={styles.priceContainer}>
                <Text style={styles.currency}>R$</Text>
                <Text style={styles.price}>{plan.price.toFixed(2)}</Text>
                <Text style={styles.period}>/mês</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.features}>
                {plan.features.map((feature, index) => (
                  <View key={index} style={styles.featureRow}>
                    <Check size={18} color="green" />
                    <Text style={styles.featureText}>{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity 
                style={[
                  styles.button,
                  { backgroundColor: plan.recommended ? theme.primary : 'white', borderColor: theme.primary, borderWidth: 1 }
                ]}
                onPress={() => router.push(`/checkout/${plan.id}`)}
              >
                <Text style={[
                  styles.btnText,
                  { color: plan.recommended ? 'white' : theme.primary }
                ]}>
                  Assinar Agora
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  backBtn: { marginRight: 15 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#1e293b' },
  subtitle: { color: '#64748b', marginBottom: 25, fontSize: 16 },
  
  grid: { gap: 20 },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10,
    position: 'relative',
    marginTop: 10, // espaço para o badge
  },
  badge: {
    position: 'absolute', top: -12, right: 20,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    zIndex: 10,
  },
  badgeText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  
  planName: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  planDesc: { color: '#64748b', marginTop: 4, marginBottom: 15 },
  
  priceContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, marginBottom: 15 },
  currency: { fontSize: 18, color: '#64748b', paddingBottom: 6 },
  price: { fontSize: 36, fontWeight: 'bold', color: '#1e293b' },
  period: { fontSize: 14, color: '#64748b', paddingBottom: 6 },
  
  divider: { height: 1, backgroundColor: '#f1f5f9', marginBottom: 15 },
  
  features: { gap: 10, marginBottom: 20 },
  featureRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  featureText: { color: '#334155', fontSize: 14 },
  
  button: { padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { fontWeight: 'bold', fontSize: 16 },
});