import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ImageBackground, StatusBar, 
  Modal, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { QrCode, Keyboard, ArrowRight, X } from 'lucide-react-native';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { api } from '../src/services/api';

export default function LandingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { selectShop } = useAuth(); // Importante: Função para salvar a loja escolhida

  const [modalVisible, setModalVisible] = useState(false);
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);

  // Função para validar e entrar na loja
  async function handleEnterShop() {
    if (!slug.trim()) {
      Alert.alert("Ops!", "Digite o código da barbearia.");
      return;
    }

    setLoading(true);
    try {
      // 1. Busca a barbearia na API pelo slug
      const shopData = await api.getBarbershop(slug.trim().toLowerCase());
      
      if (shopData && shopData.id) {
        // 2. Salva no Contexto (Global)
        await selectShop(shopData);
        
        // 3. Fecha modal e vai para o Login/Welcome
        setModalVisible(false);
        router.push('/login'); // Ou '/welcome' se preferir a tela de boas-vindas da loja
      } else {
        Alert.alert("Não encontrada", "Nenhuma barbearia encontrada com este código.");
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao buscar barbearia. Verifique o código.");
    } finally {
      setLoading(false);
    }
  }

  function handleScanQr() {
    // Futuramente aqui você abre a câmera
    Alert.alert("Em breve", "A funcionalidade de câmera será ativada na próxima atualização.");
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* Fundo Premium */}
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop' }} 
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          
          {/* Texto de Boas-vindas */}
          <View style={styles.header}>
            <Text style={styles.brand}>BARBER<Text style={{ color: theme.primary }}>SaaS</Text></Text>
            <Text style={styles.title}>Encontre sua Barbearia</Text>
            <Text style={styles.subtitle}>
              Escaneie o QR Code no balcão ou digite o código da barbearia para começar.
            </Text>
          </View>

          {/* Botões de Ação */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cardBtn} onPress={handleScanQr}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <QrCode size={32} color={theme.primary} />
              </View>
              <View>
                <Text style={styles.btnTitle}>Escanear QR Code</Text>
                <Text style={styles.btnDesc}>Use a câmera do celular</Text>
              </View>
              <ArrowRight size={20} color="rgba(255,255,255,0.5)" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.cardBtn} onPress={() => setModalVisible(true)}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <Keyboard size={32} color={theme.primary} />
              </View>
              <View>
                <Text style={styles.btnTitle}>Digitar Código</Text>
                <Text style={styles.btnDesc}>Insira o ID manualmente</Text>
              </View>
              <ArrowRight size={20} color="rgba(255,255,255,0.5)" style={{ marginLeft: 'auto' }} />
            </TouchableOpacity>
          </View>

        </View>
      </ImageBackground>

      {/* Modal para Digitar Código */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.isDark ? '#1e293b' : 'white' }]}>
            
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Código da Loja</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { color: theme.textSecondary }]}>
              Digite o identificador (slug) da barbearia:
            </Text>

            <TextInput
              style={[
                styles.input, 
                { 
                  borderColor: theme.border, 
                  color: theme.text,
                  backgroundColor: theme.surface 
                }
              ]}
              placeholder="Ex: barbearia-do-jorge"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
              value={slug}
              onChangeText={setSlug}
            />

            <TouchableOpacity 
              style={[styles.confirmBtn, { backgroundColor: theme.primary }]}
              onPress={handleEnterShop}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.primaryText} />
              ) : (
                <Text style={[styles.confirmBtnText, { color: theme.primaryText }]}>
                  Entrar na Barbearia
                </Text>
              )}
            </TouchableOpacity>

          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, width: '100%', height: '100%' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.85)', // Fundo escuro elegante
    padding: 24,
    justifyContent: 'center',
  },
  
  header: { marginBottom: 60 },
  brand: { 
    fontSize: 14, fontWeight: 'bold', color: 'rgba(255,255,255,0.7)', 
    letterSpacing: 2, marginBottom: 10, textTransform: 'uppercase' 
  },
  title: { fontSize: 40, fontWeight: 'bold', color: 'white', marginBottom: 12, lineHeight: 44 },
  subtitle: { fontSize: 16, color: '#94a3b8', lineHeight: 24 },

  actions: { gap: 16 },
  cardBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 20, borderRadius: 16,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  iconBox: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
  },
  btnTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  btnDesc: { fontSize: 14, color: '#94a3b8' },

  // Modal
  modalContainer: {
    flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    padding: 24, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 40, elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalLabel: { fontSize: 14, marginBottom: 10 },
  input: {
    height: 56, borderRadius: 12, borderWidth: 1, paddingHorizontal: 16,
    fontSize: 16, marginBottom: 20,
  },
  confirmBtn: {
    height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center',
  },
  confirmBtnText: { fontSize: 16, fontWeight: 'bold' },
});