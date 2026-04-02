import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Image, Switch, Alert, StatusBar, Modal, TextInput, 
  ActivityIndicator, Linking, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  User, Moon, Sun, LogOut, ChevronRight, 
  CreditCard, HelpCircle, MessageCircle, Camera,
  Crown, X, Save, Bug, Lightbulb, FileText, Send
} from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { api } from '../../src/services/api';

type ReportType = 'bug' | 'suggestion' | 'other';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut, shop, updateUser, subscription, loadingSubscription } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

  const isVip = subscription?.status === 'active';

  // ---- Edit modal ----
  const [editVisible, setEditVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);

  // ---- Report modal ----
  const [reportVisible, setReportVisible] = useState(false);
  const [reportType, setReportType] = useState<ReportType>('bug');
  const [reportTitle, setReportTitle] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [sending, setSending] = useState(false);

  // ---- Helpers ----
  function openWhatsApp() {
    const url = shop?.whatsapp || '';
    if (url) {
      Linking.openURL(url).catch(() =>
        Alert.alert('Erro', 'Não foi possível abrir o WhatsApp.')
      );
    } else {
      Alert.alert(shop?.name || 'Barbearia', shop?.phone ? `Telefone: ${shop.phone}` : 'Entre em contacto na recepção.');
    }
  }

  function openEditModal() {
    setEditName(user?.name || '');
    setEditEmail(user?.email || '');
    setEditVisible(true);
  }

  async function handleSaveEdit() {
    const name = editName.trim();
    const email = editEmail.trim();

    if (!name) {
      Alert.alert('Atenção', 'O nome não pode estar vazio.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !emailRegex.test(email)) {
      Alert.alert('Atenção', 'Informe um e-mail válido.');
      return;
    }

    setSaving(true);
    try {
      await updateUser({ name, email });
      setEditVisible(false);
      Alert.alert('Sucesso', 'Dados atualizados com sucesso!');
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  }

  function openReportModal() {
    setReportType('bug');
    setReportTitle('');
    setReportDescription('');
    setReportVisible(true);
  }

  async function handleSendReport() {
    const title = reportTitle.trim();
    const description = reportDescription.trim();

    if (!title) {
      Alert.alert('Atenção', 'Informe um título para o reporte.');
      return;
    }
    if (title.length > 150) {
      Alert.alert('Atenção', 'O título deve ter no máximo 150 caracteres.');
      return;
    }
    if (!description) {
      Alert.alert('Atenção', 'Descreva o problema ou sugestão.');
      return;
    }

    setSending(true);
    try {
      await api.createReport({ type: reportType, title, description });
      setReportVisible(false);
      Alert.alert('Enviado!', 'Recebemos o seu reporte. Obrigado pelo feedback!');
    } catch (error: any) {
      const status = error?.response?.status;
      console.error('[createReport] erro:', status, error?.response?.data);
      if (status === 429) {
        Alert.alert('Limite atingido', 'Muitos reportes em pouco tempo. Aguarde alguns minutos.');
      } else {
        Alert.alert('Erro', 'Não foi possível enviar o reporte. Tente novamente.');
      }
    } finally {
      setSending(false);
    }
  }

  function handleLogout() {
    Alert.alert(
      "Sair da conta",
      "Tem a certeza que deseja sair?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Sair", 
          style: "destructive", 
          onPress: () => {
            signOut();
            router.replace('/login');
          } 
        }
      ]
    );
  }

  const MenuItem = ({ icon: Icon, label, value, onPress, isDestructive = false, showArrow = true }: any) => (
    <TouchableOpacity 
      style={[styles.menuItem, { backgroundColor: theme.surface }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.menuItemLeft}>
        <View style={[styles.iconBox, { backgroundColor: isDestructive ? '#fee2e2' : theme.background }]}>
          <Icon size={20} color={isDestructive ? '#ef4444' : theme.textSecondary} />
        </View>
        <Text style={[styles.menuItemText, { color: isDestructive ? '#ef4444' : theme.text }]}>
          {label}
        </Text>
      </View>
      <View style={styles.menuItemRight}>
        {value && <Text style={[styles.menuValue, { color: theme.textSecondary }]}>{value}</Text>}
        {showArrow && <ChevronRight size={18} color={theme.textSecondary} />}
      </View>
    </TouchableOpacity>
  );

  const reportTypes: { key: ReportType; label: string; Icon: any }[] = [
    { key: 'bug', label: 'Bug', Icon: Bug },
    { key: 'suggestion', label: 'Sugestão', Icon: Lightbulb },
    { key: 'other', label: 'Outro', Icon: FileText },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      
      {/* === MODAL: Editar Dados Pessoais === */}
      <Modal visible={editVisible} animationType="slide" transparent onRequestClose={() => setEditVisible(false)}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Editar Dados</Text>
              <TouchableOpacity onPress={() => setEditVisible(false)}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Nome</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={editName}
              onChangeText={setEditName}
              placeholder="Seu nome"
              placeholderTextColor={theme.textSecondary}
              autoCapitalize="words"
              returnKeyType="next"
            />

            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>E-mail</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="seu@email.com"
              placeholderTextColor={theme.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="done"
              onSubmitEditing={handleSaveEdit}
            />

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.primary }, saving && { opacity: 0.7 }]}
              onPress={handleSaveEdit}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Save size={18} color="white" />
                  <Text style={styles.saveBtnText}>Salvar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* === MODAL: Relatar Problema === */}
      <Modal visible={reportVisible} animationType="slide" transparent onRequestClose={() => setReportVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={[styles.modalCard, { backgroundColor: theme.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Relatar Problema</Text>
              <TouchableOpacity onPress={() => setReportVisible(false)}>
                <X size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* Tipo */}
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Tipo</Text>
            <View style={styles.typeRow}>
              {reportTypes.map(({ key, label, Icon }) => {
                const active = reportType === key;
                return (
                  <TouchableOpacity
                    key={key}
                    style={[
                      styles.typeBtn,
                      { borderColor: theme.border, backgroundColor: theme.background },
                      active && { borderColor: theme.primary, backgroundColor: theme.primary + '15' }
                    ]}
                    onPress={() => setReportType(key)}
                  >
                    <Icon size={16} color={active ? theme.primary : theme.textSecondary} />
                    <Text style={[styles.typeBtnText, { color: active ? theme.primary : theme.textSecondary }]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Título */}
            <View style={styles.fieldLabelRow}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Título</Text>
              <Text style={[styles.charCount, { color: reportTitle.length > 130 ? '#ef4444' : theme.textSecondary }]}>
                {reportTitle.length}/150
              </Text>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={reportTitle}
              onChangeText={(t) => setReportTitle(t.slice(0, 150))}
              placeholder="Descreva brevemente o problema"
              placeholderTextColor={theme.textSecondary}
              returnKeyType="next"
            />

            {/* Descrição */}
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Descrição</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
              value={reportDescription}
              onChangeText={setReportDescription}
              placeholder="Conte com detalhes o que aconteceu ou sugere..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: theme.primary }, sending && { opacity: 0.7 }]}
              onPress={handleSendReport}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Send size={18} color="white" />
                  <Text style={styles.saveBtnText}>Enviar Reporte</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* === HEADER DO PERFIL === */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'U')}&background=random&size=200` }} 
              style={[styles.avatar, { borderColor: theme.surface }]} 
            />
            <TouchableOpacity style={[styles.editBadge, { backgroundColor: theme.primary }]} onPress={openEditModal}>
              <Camera size={14} color={theme.primaryText} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.userName, { color: theme.text }]}>
            {user?.name || 'Convidado'}
          </Text>
          <Text style={[styles.userEmail, { color: theme.textSecondary }]}>
            {user?.email || 'email@exemplo.com'}
          </Text>
          
          {loadingSubscription ? (
            <ActivityIndicator size="small" color={theme.primary} style={{ marginTop: 12 }} />
          ) : isVip ? (
            <View style={styles.vipBadge}>
              <Crown size={13} color="#92400e" fill="#92400e" />
              <Text style={styles.vipText}>VIP</Text>
            </View>
          ) : (
            <View style={[styles.roleBadge, { backgroundColor: theme.primary + '15' }]}>
              <Text style={[styles.roleText, { color: theme.primary }]}>CLIENTE</Text>
            </View>
          )}
        </View>

        {/* === SECÇÃO: ASSINATURA (só para VIP) === */}
        {isVip && subscription && (
          <View style={[styles.vipSection, { backgroundColor: '#fffbeb', borderColor: '#fde68a' }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Crown size={22} color="#d97706" fill="#d97706" />
              <View>
                <Text style={{ fontSize: 15, fontWeight: 'bold', color: '#92400e' }}>
                  {subscription.plan?.name || 'Plano VIP'}
                </Text>
                <Text style={{ fontSize: 12, color: '#b45309' }}>
                  Válido até {new Date(subscription.expires_at).toLocaleDateString('pt-BR')}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/my-plans')} style={styles.manageBtn}>
              <Text style={{ color: '#d97706', fontSize: 12, fontWeight: '600' }}>Gerenciar</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* === SECÇÃO: CONTA === */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>CONTA</Text>
          <View style={styles.menuGroup}>
            <MenuItem icon={User} label="Dados Pessoais" onPress={openEditModal} />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <MenuItem icon={CreditCard} label="Planos e Pagamentos" onPress={() => router.push('/(tabs)/plans')} />
          </View>
        </View>

        {/* === SECÇÃO: PREFERÊNCIAS === */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PREFERÊNCIAS</Text>
          <View style={[styles.menuGroup, { backgroundColor: theme.surface }]}>
            <View style={styles.menuItem}>
              <View style={styles.menuItemLeft}>
                <View style={[styles.iconBox, { backgroundColor: theme.background }]}>
                  {isDark ? <Moon size={20} color={theme.primary} /> : <Sun size={20} color="#f59e0b" />}
                </View>
                <Text style={[styles.menuItemText, { color: theme.text }]}>Modo Escuro</Text>
              </View>
              <Switch 
                value={isDark} 
                onValueChange={toggleTheme}
                trackColor={{ false: "#e2e8f0", true: theme.primary }}
                thumbColor={"#fff"}
              />
            </View>
          </View>
        </View>

        {/* === SECÇÃO: SUPORTE === */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SUPORTE</Text>
          <View style={styles.menuGroup}>
            <MenuItem icon={HelpCircle} label="Relatar Problema" onPress={openReportModal} />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <MenuItem icon={MessageCircle} label="Contactar a Barbearia" onPress={openWhatsApp} />
          </View>
        </View>

        {/* === LOGOUT === */}
        <View style={[styles.section, { marginTop: 20 }]}>
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: '#fee2e2' }]} 
            onPress={handleLogout}
          >
            <LogOut size={20} color="#ef4444" />
            <Text style={styles.logoutText}>Terminar Sessão</Text>
          </TouchableOpacity>
          <Text style={[styles.versionText, { color: theme.textSecondary }]}>Versão 1.0.0 (Build 2026)</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  header: { alignItems: 'center', paddingTop: 80, paddingBottom: 30 },
  avatarContainer: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4 },
  editBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'white',
  },
  userName: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  userEmail: { fontSize: 14, marginBottom: 12 },
  roleBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  roleText: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1 },
  vipBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fde68a',
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  vipText: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1, color: '#92400e' },

  vipSection: {
    marginHorizontal: 20, marginBottom: 16, borderRadius: 12, borderWidth: 1,
    padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  manageBtn: { padding: 8, borderRadius: 8, backgroundColor: '#fde68a' },

  section: { marginBottom: 24, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 12, fontWeight: 'bold', marginBottom: 10, marginLeft: 4, letterSpacing: 1 },
  menuGroup: { borderRadius: 16, overflow: 'hidden' },
  menuItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  menuItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  menuItemText: { fontSize: 16, fontWeight: '500' },
  menuItemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  menuValue: { fontSize: 14 },
  divider: { height: 1, marginLeft: 68 },

  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderRadius: 16 },
  logoutText: { color: '#ef4444', fontSize: 16, fontWeight: 'bold' },
  versionText: { textAlign: 'center', marginTop: 20, fontSize: 12 },

  // Shared modal styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  fieldLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { fontSize: 13, fontWeight: '600', marginBottom: 6, marginTop: 4 },
  charCount: { fontSize: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 16, marginBottom: 16 },
  textArea: { height: 100, marginBottom: 16 },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 16, borderRadius: 12, marginTop: 8 },
  saveBtnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },

  // Report type selector
  typeRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5 },
  typeBtnText: { fontSize: 13, fontWeight: '600' },
});
