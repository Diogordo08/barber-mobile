import React from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  Image, Switch, Alert, StatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  User, Settings, Moon, Sun, LogOut, ChevronRight, 
  CreditCard, Shield, HelpCircle, Mail, Camera 
} from 'lucide-react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { theme, isDark, toggleTheme } = useTheme();

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

  // Componente Auxiliar para Itens de Menu
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
        <Text style={[
          styles.menuItemText, 
          { color: isDestructive ? '#ef4444' : theme.text }
        ]}>
          {label}
        </Text>
      </View>
      
      <View style={styles.menuItemRight}>
        {value && <Text style={[styles.menuValue, { color: theme.textSecondary }]}>{value}</Text>}
        {showArrow && <ChevronRight size={18} color={theme.textSecondary} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor="transparent" translucent />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* === HEADER DO PERFIL === */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <Image 
              source={{ uri: `https://ui-avatars.com/api/?name=${user?.name || 'User'}&background=random&size=200` }} 
              style={[styles.avatar, { borderColor: theme.surface }]} 
            />
            <TouchableOpacity style={[styles.editBadge, { backgroundColor: theme.primary }]}>
              <Camera size={14} color={theme.primaryText} />
            </TouchableOpacity>
          </View>
          
          <Text style={[styles.userName, { color: theme.text }]}>
            {user?.name || 'Convidado'}
          </Text>
          <Text style={styles.userEmail}>
            {user?.email || 'email@exemplo.com'}
          </Text>
          
          <View style={[styles.roleBadge, { backgroundColor: theme.primary + '15' }]}>
            <Text style={[styles.roleText, { color: theme.primary }]}>CLIENTE VIP</Text>
          </View>
        </View>

        {/* === SECÇÃO: CONTA === */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>CONTA</Text>
          <View style={styles.menuGroup}>
            <MenuItem 
              icon={User} 
              label="Dados Pessoais" 
              onPress={() => Alert.alert("Em breve", "Edição de perfil será ativada na próxima versão.")} 
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <MenuItem 
              icon={CreditCard} 
              label="Planos e Pagamentos" 
              onPress={() => router.push('/(tabs)/plans')} 
            />
          </View>
        </View>

        {/* === SECÇÃO: PREFERÊNCIAS === */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>PREFERÊNCIAS</Text>
          <View style={[styles.menuGroup, { backgroundColor: theme.surface }]}>
            
            {/* Toggle de Tema */}
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

            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            
            <MenuItem 
              icon={Shield} 
              label="Privacidade e Segurança" 
              onPress={() => {}} 
            />
          </View>
        </View>

        {/* === SECÇÃO: SUPORTE === */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>SUPORTE</Text>
          <View style={styles.menuGroup}>
            <MenuItem 
              icon={HelpCircle} 
              label="Ajuda e FAQ" 
              onPress={() => {}} 
            />
            <View style={[styles.divider, { backgroundColor: theme.border }]} />
            <MenuItem 
              icon={Mail} 
              label="Contactar a Barbearia" 
              onPress={() => Alert.alert("Contacto", "contato@barbearia.com")} 
            />
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
          
          <Text style={styles.versionText}>Versão 1.0.0 (Build 2026)</Text>
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  
  // Header
  header: {
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 30,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#94a3b8',
    marginBottom: 12,
  },
  roleBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  roleText: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1,
  },

  // Sections
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    marginLeft: 4,
    letterSpacing: 1,
  },
  menuGroup: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '500',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuValue: {
    fontSize: 14,
  },
  divider: {
    height: 1,
    marginLeft: 68, // Alinha com o texto, pulando o ícone
  },

  // Logout
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 16,
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: 'bold',
  },
  versionText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#94a3b8',
    fontSize: 12,
  },
});