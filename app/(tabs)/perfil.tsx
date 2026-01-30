import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useRouter, useFocusEffect  } from 'expo-router';
import { Camera, Mail, User, LogOut, ChevronRight, Save, Crown, Shield, HelpCircle } from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';
import { api } from '../../src/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Profile() {
  const { user, signOut, updateUser, shop } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [hasPlan, setHasPlan] = useState(false);
  const [planName, setPlanName] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [loading, setLoading] = useState(false);

useFocusEffect(
  useCallback(() => {
      async function checkSub() {
        try {
          // Agora essa função existe no api.ts!
          const sub = await api.getSubscription();
          
          if (sub) {
            setHasPlan(true);
            
            // CORREÇÃO: Passar o slug da loja para buscar os planos
            // Se o shop não estiver carregado, usamos um fallback ou não buscamos
            if (shop?.slug) {
                const plans = await api.getPlans(shop.slug);
                const p = plans.find((x: any) => x.id === sub.planId);
                setPlanName(p?.name || 'Plano Ativo');
            } else {
                setPlanName('Plano Ativo');
            }
          } else {
            setHasPlan(false);
          }
        } catch (error) {
          console.log("Erro ao buscar assinatura:", error);
          setHasPlan(false);
        }
      }
      
      checkSub();
    }, [shop]) // Adicione shop nas dependências
  );

  // Função para Salvar Alterações
  async function handleSave() {
    if (!name.trim() || !email.trim()) {
      return Alert.alert("Erro", "Nome e Email são obrigatórios.");
    }

    setLoading(true);
    try {
      await updateUser({ name, email });
      setIsEditing(false);
      Alert.alert("Sucesso", "Perfil atualizado!");
    } catch (error) {
      Alert.alert("Erro", "Não foi possível atualizar.");
    } finally {
      setLoading(false);
    }
  }

  // Função de Logout
  function handleLogout() {
    Alert.alert("Sair", "Deseja realmente sair do aplicativo?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: signOut }
    ]);
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      
      {/* 1. HEADER (Foto e Nome) */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image 
            source={{ uri: user?.avatar || "https://github.com/shadcn.png" }} 
            style={styles.avatar} 
          />
          {/* Botão fake de trocar foto */}
          <TouchableOpacity style={[styles.cameraBtn, { backgroundColor: theme.primary }]}>
            <Camera size={16} color="white" />
          </TouchableOpacity>
        </View>
        
        {!isEditing ? (
          <View style={{ alignItems: 'center', marginTop: 10 }}>
            <Text style={styles.name}>{user?.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Text style={[styles.editLink, { color: theme.primary }]}>Editar Perfil</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={{ color: '#64748b', marginTop: 10 }}>Editando informações...</Text>
        )}
      </View>

      {/* 2. FORMULÁRIO (Só aparece inputs visíveis se estiver editando) */}
      <View style={styles.section}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome Completo</Text>
          <View style={[styles.inputContainer, isEditing && { borderColor: theme.primary, backgroundColor: 'white' }]}>
            <User size={20} color="#94a3b8" />
            <TextInput
              value={name}
              onChangeText={setName}
              editable={isEditing}
              style={[styles.input, !isEditing && { color: '#64748b' }]}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>E-mail</Text>
          <View style={[styles.inputContainer, isEditing && { borderColor: theme.primary, backgroundColor: 'white' }]}>
            <Mail size={20} color="#94a3b8" />
            <TextInput
              value={email}
              onChangeText={setEmail}
              editable={isEditing}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, !isEditing && { color: '#64748b' }]}
            />
          </View>
        </View>

        {isEditing && (
          <View style={styles.editActions}>
            <TouchableOpacity 
              style={styles.cancelBtn} 
              onPress={() => {
                setIsEditing(false);
                setName(user?.name || ''); // Reseta
              }}
            >
              <Text style={{ color: '#64748b' }}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: theme.primary }]} 
              onPress={handleSave}
              disabled={loading}
            >
              <Save size={18} color="white" />
              <Text style={{ color: 'white', fontWeight: 'bold' }}>Salvar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 3. ÁREA DO PLANO (Condicional) */}
      {!isEditing && (
        <>
          {hasPlan ? (
            // --- BANNER DE QUEM JÁ TEM PLANO (Leva para Gerenciar) ---
            <TouchableOpacity 
              style={[styles.premiumBanner, { backgroundColor: 'white', borderWidth: 1, borderColor: '#fbbf24' }]}
              onPress={() => router.push('../my-plans')} // Rota nova
            >
              <View style={styles.premiumContent}>
                <View style={styles.crownBox}>
                  <Crown size={24} color="#fbbf24" fill="#fbbf24" />
                </View>
                <View>
                  <Text style={[styles.premiumTitle, { color: '#1e293b' }]}>{planName}</Text>
                  <Text style={[styles.premiumText, { color: '#10b981', fontWeight: 'bold' }]}>● Assinatura Ativa</Text>
                </View>
              </View>
              <Text style={{ color: '#2563eb', fontSize: 12, fontWeight: '600' }}>Gerenciar</Text>
            </TouchableOpacity>
          ) : (
            // --- BANNER DE VENDAS (Leva para Vitrine) ---
            <TouchableOpacity 
              style={styles.premiumBanner}
              onPress={() => router.push('/plans')}
            >
              <View style={styles.premiumContent}>
                <View style={styles.crownBox}>
                  <Crown size={24} color="#fbbf24" fill="#fbbf24" />
                </View>
                <View>
                  <Text style={styles.premiumTitle}>Seja Premium</Text>
                  <Text style={styles.premiumText}>Cortes ilimitados e descontos exclusivos</Text>
                </View>
              </View>
              <ChevronRight color="#fbbf24" />
            </TouchableOpacity>
          )}
        </>
      )}

      {/* 4. MENU DE OPÇÕES */}
      {!isEditing && (
        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuRow}>
              <HelpCircle size={20} color="#64748b" />
              <Text style={styles.menuText}>Ajuda e Suporte</Text>
            </View>
            <ChevronRight size={20} color="#cbd5e1" />
          </TouchableOpacity>
          
          <View style={styles.divider} />

          <TouchableOpacity style={styles.menuItem}>
            <View style={styles.menuRow}>
              <Shield size={20} color="#64748b" />
              <Text style={styles.menuText}>Política de Privacidade</Text>
            </View>
            <ChevronRight size={20} color="#cbd5e1" />
          </TouchableOpacity>
        </View>
      )}

      {/* 5. LOGOUT */}
      {!isEditing && (
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <LogOut size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Sair do Aplicativo</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.version}>Versão 1.1.0</Text>
      <View style={{ height: 40 }} />
    </ScrollView>

    
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, paddingTop: 60 },
  
  header: { alignItems: 'center', marginBottom: 30 },
  avatarContainer: { position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: 'white' },
  cameraBtn: {
    position: 'absolute', bottom: 0, right: 0,
    padding: 8, borderRadius: 20, borderWidth: 2, borderColor: 'white'
  },
  name: { fontSize: 22, fontWeight: 'bold', color: '#1e293b', marginTop: 10 },
  email: { fontSize: 14, color: '#64748b', marginBottom: 5 },
  editLink: { fontSize: 14, fontWeight: '600', marginTop: 5 },

  section: { marginBottom: 20 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: '500', color: '#334155', marginBottom: 6 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#f1f5f9', borderRadius: 10, paddingHorizontal: 15,
    height: 50, borderWidth: 1, borderColor: 'transparent'
  },
  input: { flex: 1, fontSize: 16, color: '#1e293b' },

  editActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 10 },
  cancelBtn: { padding: 10 },
  saveBtn: {
    flexDirection: 'row', gap: 8, alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8
  },

  // Banner Premium
  premiumBanner: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
    elevation: 4,
    shadowColor: '#fbbf24',
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  premiumContent: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  crownBox: { backgroundColor: 'rgba(251, 191, 36, 0.2)', padding: 10, borderRadius: 25 },
  premiumTitle: { color: '#fbbf24', fontSize: 16, fontWeight: 'bold' },
  premiumText: { color: '#cbd5e1', fontSize: 12 },

  // Menu
  menu: { backgroundColor: 'white', borderRadius: 12, padding: 5, marginBottom: 25 },
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 15,
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuText: { fontSize: 16, color: '#334155' },
  divider: { height: 1, backgroundColor: '#f1f5f9', marginLeft: 50 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#fee2e2', padding: 15, borderRadius: 12, marginBottom: 20
  },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 },

  version: { textAlign: 'center', color: '#cbd5e1', fontSize: 12, marginBottom: 20 },
});