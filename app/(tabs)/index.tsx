import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, 
  ImageBackground, ActivityIndicator, StatusBar, FlatList, RefreshControl, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  Calendar, Crown, MapPin, Clock, Star, ChevronRight, Phone, Scissors, Search 
} from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { api } from '../../src/services/api';
import { Barber, ServiceItem } from '../../src/types';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { user, shop } = useAuth();
  const { theme } = useTheme();

  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
      console.log("Erro ao carregar home:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [shop]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ScrollView 
        contentContainerStyle={{ paddingBottom: 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* === 1. HEADER HERO (FOTO DE FUNDO) === */}
        <View style={styles.headerContainer}>
          <ImageBackground
            source={{ uri: shop?.logo || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=2074&auto=format&fit=crop' }}
            style={styles.headerBg}
            resizeMode="cover"
          >
            <View style={styles.headerOverlay}>
              <View style={styles.headerContent}>
                <View style={styles.headerTop}>
                  <View>
                    <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]}</Text>
                    <Text style={styles.shopTitle}>{shop?.name || 'Barbearia'}</Text>
                  </View>
                  <View style={[styles.avatarBorder, { borderColor: theme.primary }]}>
                    <Image 
                      source={{ uri: `https://ui-avatars.com/api/?name=${user?.name}&background=random` }} 
                      style={styles.userAvatar} 
                    />
                  </View>
                </View>

                <View style={styles.locationContainer}>
                  <MapPin size={16} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {shop?.address || 'Localização da barbearia'}
                  </Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        </View>

        {/* === 2. AÇÕES FLUTUANTES (OVERLAP) === */}
        <View style={styles.floatingActionsContainer}>
          {/* Botão Agendar (Destaque) */}
          <TouchableOpacity 
            style={[styles.mainActionCard, { backgroundColor: theme.surface }]}
            onPress={() => router.push('/new-appointment')}
          >
            <View style={styles.actionRow}>
              <View style={[styles.iconBoxLarge, { backgroundColor: theme.primary + '15' }]}>
                <Calendar size={28} color={theme.primary} strokeWidth={2.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionTitleLarge, { color: theme.text }]}>Novo Agendamento</Text>
                <Text style={styles.actionSubtitle}>Reserve seu horário agora</Text>
              </View>
              <View style={[styles.arrowCircle, { backgroundColor: theme.primary }]}>
                <ChevronRight size={20} color={theme.primaryText} />
              </View>
            </View>
          </TouchableOpacity>

          {/* Botão Assinatura (Secundário) */}
          <TouchableOpacity 
            style={[styles.secondaryActionCard, { backgroundColor: theme.surface, borderColor: theme.primary }]}
            onPress={() => router.push('/plans')}
          >
            <View style={[styles.iconBoxSmall, { backgroundColor: '#FFFBEB' }]}>
              <Crown size={20} color="#d97706" fill="#d97706" />
            </View>
            <Text style={[styles.secondaryActionText, { color: theme.text }]}>
              Seja <Text style={{ color: theme.primary, fontWeight: 'bold' }}>VIP</Text> e economize
            </Text>
          </TouchableOpacity>
        </View>

        {/* === 3. NOSSOS PROFISSIONAIS (ESTILO STORIES) === */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Nossos Talentos</Text>
          
          <FlatList 
            horizontal
            data={barbers}
            keyExtractor={item => String(item.id)}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.barberStory}>
                <View style={[styles.barberImageContainer, { borderColor: theme.primary }]}>
                  <Image 
                    source={{ uri: item.avatar || `https://ui-avatars.com/api/?name=${item.name}&background=0D8ABC&color=fff` }} 
                    style={styles.barberImage} 
                  />
                  {/* Badge de Nota */}
                  <View style={styles.ratingFloat}>
                    <Star size={8} color="#fff" fill="#fff" />
                    <Text style={styles.ratingFloatText}>5.0</Text>
                  </View>
                </View>
                <Text style={[styles.barberName, { color: theme.text }]} numberOfLines={1}>
                  {item.name.split(' ')[0]}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* === 4. SERVIÇOS & PREÇOS (LISTA LIMPA) === */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Serviços</Text>
            <Scissors size={18} color={theme.textSecondary} />
          </View>
          
          <View style={[styles.servicesContainer, { backgroundColor: theme.surface }]}>
            {services.map((service, index) => (
              <View key={service.id}>
                <TouchableOpacity style={styles.serviceItem}>
                  <View style={styles.serviceInfo}>
                    <Text style={[styles.serviceName, { color: theme.text }]}>{service.name}</Text>
                    <Text style={styles.serviceDuration}>
                      <Clock size={12} color="#94a3b8" />{' '}
                      {/* @ts-ignore */}
                      {service.duration_minutes || service.durationMinutes || 30} min
                    </Text>
                  </View>
                  <View style={styles.priceTag}>
                    <Text style={[styles.servicePrice, { color: theme.primary }]}>
                      R$ {Number(service.price).toFixed(2)}
                    </Text>
                  </View>
                </TouchableOpacity>
                {/* Divisor sutil, exceto no último item */}
                {index < services.length - 1 && <View style={[styles.divider, { backgroundColor: theme.border }]} />}
              </View>
            ))}
          </View>
        </View>

        {/* === 5. SOBRE A BARBEARIA === */}
        <View style={[styles.section, { marginBottom: 20 }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Sobre nós</Text>
          <View style={[styles.aboutCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.description, { color: theme.textSecondary }]}>
              {shop?.description || "Ambiente climatizado, cerveja gelada e os melhores profissionais da região. Aqui o seu estilo é nossa prioridade."}
            </Text>
            
            <View style={[styles.divider, { backgroundColor: theme.border, marginVertical: 15 }]} />
            
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Clock size={20} color={theme.primary} />
                <View>
                  <Text style={[styles.infoLabel, { color: theme.text }]}>Aberto hoje</Text>
                  <Text style={styles.infoValue}>09:00 às 20:00</Text>
                </View>
              </View>
              <View style={styles.infoItem}>
                <Phone size={20} color={theme.primary} />
                <View>
                  <Text style={[styles.infoLabel, { color: theme.text }]}>Contato</Text>
                  <Text style={styles.infoValue}>{shop?.whatsapp || '(11) 99999-9999'}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // === HEADER ===
  headerContainer: { height: 320, width: '100%' },
  headerBg: { width: '100%', height: '100%' },
  headerOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(15, 23, 42, 0.65)', // Escurece a foto
    paddingTop: 60,
    paddingHorizontal: 24 
  },
  headerContent: { marginTop: 10 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting: { color: '#e2e8f0', fontSize: 16, fontWeight: '500', marginBottom: 4 },
  shopTitle: { color: 'white', fontSize: 34, fontWeight: 'bold', lineHeight: 40 },
  avatarBorder: { borderWidth: 2, borderRadius: 27, padding: 2 },
  userAvatar: { width: 46, height: 46, borderRadius: 23 },
  locationContainer: { 
    flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.15)', alignSelf: 'flex-start',
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20
  },
  locationText: { color: 'white', fontSize: 13, fontWeight: '500' },

  // === FLOATING ACTIONS ===
  floatingActionsContainer: {
    paddingHorizontal: 20,
    marginTop: -70, // Faz os cards "subirem" na imagem
    gap: 12
  },
  mainActionCard: {
    padding: 20, borderRadius: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15, shadowRadius: 10, elevation: 8
  },
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  iconBoxLarge: { width: 56, height: 56, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  actionTitleLarge: { fontSize: 18, fontWeight: 'bold' },
  actionSubtitle: { fontSize: 14, color: '#94a3b8', marginTop: 2 },
  arrowCircle: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  
  secondaryActionCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: 14, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed'
  },
  iconBoxSmall: { padding: 4, borderRadius: 8 },
  secondaryActionText: { fontSize: 14, fontWeight: '500' },

  // === SECTIONS GLOBAL ===
  section: { marginTop: 32 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, marginBottom: 16, alignItems: 'center' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', paddingHorizontal: 20, marginBottom: 16 },

  // === BARBERS ===
  barberStory: { alignItems: 'center', width: 80 },
  barberImageContainer: {
    width: 76, height: 76, borderRadius: 38, borderWidth: 2,
    justifyContent: 'center', alignItems: 'center', marginBottom: 8,
    position: 'relative'
  },
  barberImage: { width: 68, height: 68, borderRadius: 34 },
  ratingFloat: {
    position: 'absolute', bottom: -5,
    backgroundColor: '#0f172a', flexDirection: 'row', alignItems: 'center', gap: 2,
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: '#334155'
  },
  ratingFloatText: { color: 'white', fontSize: 10, fontWeight: 'bold' },
  barberName: { fontSize: 13, fontWeight: '600' },

  // === SERVICES ===
  servicesContainer: { marginHorizontal: 20, borderRadius: 20, padding: 10 },
  serviceItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  serviceName: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  serviceDuration: { fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center' },
  priceTag: { 
    backgroundColor: '#f1f5f9', paddingHorizontal: 12, paddingVertical: 6, 
    borderRadius: 8 
  },
  servicePrice: { fontSize: 15, fontWeight: 'bold' },
  divider: { height: 1, marginHorizontal: 16, opacity: 0.6 },

  // === ABOUT ===
  aboutCard: { marginHorizontal: 20, borderRadius: 20, padding: 24 },
  description: { fontSize: 15, lineHeight: 24 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between' },
  infoItem: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  infoLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  infoValue: { fontSize: 14, color: '#64748b', fontWeight: '500' },
});