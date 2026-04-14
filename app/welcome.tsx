import React, { useEffect, useState } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ImageBackground, StatusBar, 
  Modal, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { QrCode, Keyboard, ArrowRight, X, ZapOff } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useTheme } from '../src/contexts/ThemeContext';
import { useAuth } from '../src/contexts/AuthContext';
import { api } from '../src/services/api';

export default function LandingScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { selectShop, signOut } = useAuth();

  const [modalVisible, setModalVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    signOut().catch((error) => {
      console.log('Erro ao resetar sessão na welcome:', error);
    });
  }, [signOut]);

  async function enterWithSlug(slugValue: string) {
    if (!slugValue.trim()) return;
    setLoading(true);
    try {
      const shopData = await api.getBarbershop(slugValue.trim().toLowerCase());
      if (shopData && shopData.id) {
        await selectShop(shopData);
        setModalVisible(false);
        setScannerVisible(false);
        router.push('/login');
      } else {
        Alert.alert("Não encontrada", "Nenhuma barbearia encontrada com este código.");
      }
    } catch (error) {
      Alert.alert("Erro", "Falha ao buscar barbearia. Verifique o código.");
    } finally {
      setLoading(false);
      setScanning(false);
    }
  }

  async function handleScanQr() {
    if (!permission?.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert("Permissão negada", "Permita o acesso à câmera nas configurações do dispositivo.");
        return;
      }
    }
    setScannerVisible(true);
  }

  function handleBarCodeScanned({ data }: { data: string }) {
    if (scanning) return;
    setScanning(true);

    // O QR Code pode conter a URL completa ou apenas o slug
    // Ex: "https://barbearia-api.on-forge.com/minha-barbearia" ou "minha-barbearia"
    let extractedSlug = data.trim();
    const urlMatch = data.match(/\/([^/]+)\/?$/);
    if (urlMatch) extractedSlug = urlMatch[1];

    enterWithSlug(extractedSlug);
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=2070&auto=format&fit=crop' }} 
        style={styles.background}
        resizeMode="cover"
      >
        <View style={styles.overlay}>
          <View style={styles.header}>
            <Text style={styles.brand}>Barber<Text style={{ color: theme.primary }}>Easy</Text></Text>
            <Text style={styles.title}>Encontre sua Barbearia</Text>
            <Text style={styles.subtitle}>
              Escaneie o QR Code no balcão ou digite o código da barbearia para começar.
            </Text>
          </View>

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

      {/* === SCANNER DE QR CODE === */}
      <Modal visible={scannerVisible} animationType="slide" onRequestClose={() => setScannerVisible(false)}>
        <View style={styles.scannerContainer}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleBarCodeScanned}
          />

          {/* Overlay escuro com janela de scan */}
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerWindow} />
          </View>

          <View style={styles.scannerHeader}>
            <TouchableOpacity onPress={() => { setScannerVisible(false); setScanning(false); }} style={styles.closeBtn}>
              <X size={24} color="white" />
            </TouchableOpacity>
            <Text style={styles.scannerTitle}>Aponte para o QR Code</Text>
          </View>

          {loading && (
            <View style={styles.scannerLoading}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={{ color: 'white', marginTop: 10 }}>Buscando barbearia...</Text>
            </View>
          )}
        </View>
      </Modal>

      {/* === MODAL DIGITAR CÃ“DIGO === */}
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
          <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
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
              style={[styles.input, { borderColor: theme.border, color: theme.text, backgroundColor: theme.surface }]}
              placeholder="Ex: barbearia-do-jorge"
              placeholderTextColor="#94a3b8"
              autoCapitalize="none"
              autoCorrect={false}
              value={slug}
              onChangeText={setSlug}
            />

            <TouchableOpacity 
              style={[styles.confirmBtn, { backgroundColor: theme.primary }]}
              onPress={() => enterWithSlug(slug)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.confirmBtnText}>Entrar na Barbearia</Text>
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
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
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
  iconBox: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  btnTitle: { fontSize: 18, fontWeight: 'bold', color: 'white', marginBottom: 4 },
  btnDesc: { fontSize: 14, color: '#94a3b8' },
  // Scanner
  scannerContainer: { flex: 1, backgroundColor: 'black' },
  scannerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  scannerWindow: {
    width: 250, height: 250, borderRadius: 16,
    borderWidth: 2, borderColor: 'white',
    backgroundColor: 'transparent',
    shadowColor: '#fff', shadowOpacity: 0.3, shadowRadius: 10,
  },
  scannerHeader: {
    position: 'absolute', top: 60, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, gap: 16,
  },
  closeBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center',
  },
  scannerTitle: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  scannerLoading: {
    position: 'absolute', bottom: 80, left: 0, right: 0,
    alignItems: 'center',
  },
  // Modal
  modalContainer: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
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
  confirmBtn: { height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  confirmBtnText: { fontSize: 16, fontWeight: 'bold', color: 'white' },
});
