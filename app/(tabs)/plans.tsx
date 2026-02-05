import React, { useState, useCallback } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, ImageBackground, StatusBar, RefreshControl 
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { Crown, Check, CreditCard, Calendar, Star, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { api } from '../../src/services/api';
import { Plan } from '../../src/types';

export default function PlansTab() {
  const router = useRouter();
  const { theme } = useTheme();
  const { shop, user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<any>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    if (!shop?.slug) return;
    try {
      const subData = await api.getSubscription();
      setSubscription(subData);

      if (!subData) {
        const plansData = await api.getPlans(shop.slug);
        setPlans(plansData);
      }
    } catch (error) {
      console.log("Erro ao carregar planos", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [shop])
  );

  const handleSubscribe = (plan: Plan) => {
    if (!user) return router.push('/login');
    router.push(`/checkout/${plan.id}`);
  };

  const renderHeader = (title: string, subtitle: string) => (
    <View style={styles.headerContainer}>
      <ImageBackground
        source={{ uri: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop' }}
        style={styles.headerBg}
        resizeMode="cover"
      >
        <View style={styles.headerOverlay}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSubtitle}>{subtitle}</Text>
        </View>
      </ImageBackground>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // === CENÁRIO 1: CARTÃO VIP (Mantido igual) ===
  if (subscription) {
    const plan = subscription.plan;
    const usage = subscription.uses_this_month;
    const limit = plan?.monthly_limit || plan?.cuts_per_month;
    const percent = limit ? (usage / limit) * 100 : 0;
    const renewsDate = new Date(subscription.renews_at || Date.now()).toLocaleDateString('pt-BR');

    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <ScrollView 
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={theme.primary} />}
        >
          {renderHeader("Seu Clube VIP", "Você é parte da elite.")}

          <View style={styles.floatingContainer}>
            <View style={[styles.vipCard, { backgroundColor: '#0f172a', borderColor: '#334155' }]}>
              <View style={styles.cardPatternCircle} />
              <View style={styles.cardHeaderRow}>
                <View style={styles.brandRow}>
                  <Crown size={24} color="#fbbf24" fill="#fbbf24" />
                  <Text style={styles.cardBrandText}>BARBER<Text style={{ color: '#fbbf24' }}>VIP</Text></Text>
                </View>
                <View style={styles.activeBadge}>
                  <View style={styles.pulseDot} />
                  <Text style={styles.activeBadgeText}>ATIVO</Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <Text style={styles.cardLabel}>PLANO ATUAL</Text>
                <Text style={styles.cardPlanName}>{plan?.name}</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressRow}>
                    <Text style={styles.progressLabel}>Cortes utilizados</Text>
                    <Text style={styles.progressValue}>{usage} <Text style={{color:'#64748b'}}>/</Text> {limit || '∞'}</Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${Math.min(percent, 100)}%` }]} />
                  </View>
                </View>
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.footerItem}>
                  <Calendar size={14} color="#64748b" />
                  <Text style={styles.footerText}>Renova em {renewsDate}</Text>
                </View>
              </View>
            </View>
            <TouchableOpacity style={styles.manageButton} onPress={() => router.push('/(tabs)/perfil')}>
              <Text style={{ color: theme.textSecondary }}>Gerenciar Assinatura</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  }

  // === CENÁRIO 2: VITRINE DE PLANOS (SUPER CLEAN) ===
  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={theme.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {renderHeader("Planos Exclusivos", "Economia inteligente para o seu estilo.")}

        <View style={styles.floatingContainer}>
          <View style={styles.plansGrid}>
            {plans.map((plan) => (
              <TouchableOpacity 
                key={plan.id}
                style={[
                  styles.planCard, 
                  { 
                    backgroundColor: theme.surface, 
                    borderColor: theme.border,
                    shadowColor: theme.isDark ? "#000" : "#cbd5e1"
                  }
                ]}
                activeOpacity={0.9}
                onPress={() => handleSubscribe(plan)}
              >
                {/* Nome do Plano */}
                <Text style={[styles.planName, { color: theme.text }]} numberOfLines={1}>
                  {plan.name}
                </Text>
                
                {/* Preço (Visual Clean & Sênior) */}
                <View style={styles.priceContainer}>
                  <Text style={[styles.planPrice, { color: theme.primary }]}>
                    R$ {Number(plan.price).toFixed(0)}
                  </Text>
                  <Text style={[styles.perMonth, { color: theme.textSecondary }]}>/mês</Text>
                </View>

                {/* Limite de Cortes */}
                <View style={styles.limitContainer}>
                   <Check size={14} color={theme.success} />
                   <Text style={[styles.limitText, { color: theme.text }]}>
                     {plan.monthly_limit || plan.cuts_per_month 
                       ? `${plan.monthly_limit || plan.cuts_per_month} Cortes mensais` 
                       : 'Cortes Ilimitados'}
                   </Text>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                {/* === DESCRIÇÃO CLEAN (Sem fundo, sem título) === */}
                {plan.description && (
                  <Text style={[styles.cleanDescription, { color: theme.textSecondary }]} numberOfLines={3}>
                    {plan.description}
                  </Text>
                )}

                {/* Botão */}
                <View style={[styles.subscribeBtn, { backgroundColor: theme.primary }]}>
                  <Text style={[styles.subscribeBtnText, { color: theme.primaryText }]}>Assinar</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // HEADER
  headerContainer: { height: 260, width: '100%' },
  headerBg: { width: '100%', height: '100%' },
  headerOverlay: { 
    flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.75)', 
    justifyContent: 'center', alignItems: 'center', padding: 24 
  },
  headerTitle: { fontSize: 30, fontWeight: '800', color: 'white', marginBottom: 8 },
  headerSubtitle: { fontSize: 15, color: '#cbd5e1', textAlign: 'center', opacity: 0.9 },

  // FLUTUANTE
  floatingContainer: { marginTop: -50, paddingHorizontal: 16, paddingBottom: 20 },

  // GRID
  plansGrid: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12,
  },
  planCard: {
    width: '48%', 
    borderRadius: 16, 
    padding: 16, 
    borderWidth: 1,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    marginBottom: 0,
  },

  // Estilos do Card
  planName: { 
    fontSize: 16, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 
  },
  priceContainer: { 
    flexDirection: 'row', alignItems: 'baseline', marginBottom: 8, justifyContent: 'center' 
  },
  planPrice: { 
    fontSize: 28, fontWeight: '900', // Negrito forte
    letterSpacing: -1 
  },
  perMonth: { 
    fontSize: 12, fontWeight: 'normal', marginLeft: 2 
  },

  limitContainer: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  limitText: { fontSize: 13, fontWeight: '600' },

  divider: { width: '100%', height: 1, marginBottom: 12, opacity: 0.5 },

  // === DESCRIÇÃO CLEAN (O Ajuste) ===
  cleanDescription: {
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
    marginBottom: 16, // Espaço antes do botão
    paddingHorizontal: 4,
  },

  // Botão
  subscribeBtn: { 
    width: '100%', height: 40, borderRadius: 20, 
    justifyContent: 'center', alignItems: 'center',
    marginTop: 'auto' // Empurra para o fundo
  },
  subscribeBtnText: { fontSize: 14, fontWeight: 'bold' },

  // VIP CARD (Inalterado)
  vipCard: {
    borderRadius: 24, padding: 24, borderWidth: 1,
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10,
    minHeight: 220, justifyContent: 'space-between', overflow: 'hidden'
  },
  cardPatternCircle: { position: 'absolute', top: -100, right: -50, width: 300, height: 300, backgroundColor: 'rgba(251, 191, 36, 0.05)', borderRadius: 150 },
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardBrandText: { fontSize: 16, fontWeight: '900', color: 'white', letterSpacing: 2 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(34, 197, 94, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#4ade80' },
  activeBadgeText: { color: '#4ade80', fontSize: 10, fontWeight: 'bold' },
  cardBody: { marginTop: 30, marginBottom: 20 },
  cardLabel: { color: '#64748b', fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  cardPlanName: { color: 'white', fontSize: 32, fontWeight: '300', letterSpacing: -1 },
  progressContainer: { marginTop: 20 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { color: '#94a3b8', fontSize: 12 },
  progressValue: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  progressBarTrack: { height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3 },
  progressBarFill: { height: '100%', backgroundColor: '#fbbf24', borderRadius: 3 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  footerText: { color: '#94a3b8', fontSize: 12 },
  manageButton: { alignSelf: 'center', marginTop: 20, padding: 10 },
  emptyState: { alignItems: 'center', marginTop: 40 },
});