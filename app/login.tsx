import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform, 
  ImageBackground, StatusBar 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react-native'; // Ícones para inputs
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, shop } = useAuth(); // 'shop' vem do contexto (da tela anterior)
  const { theme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("Atenção", "Preencha todos os campos.");
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      // O redirecionamento acontece automaticamente pelo AuthContext ou Layout
      // Mas por garantia:
      router.replace('/(tabs)/agenda'); 
    } catch (error: any) {
      Alert.alert("Erro no Login", error.message || "Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ImageBackground 
        source={{ uri: 'https://images.unsplash.com/photo-1634480256802-77408d6d4561?q=80&w=2070&auto=format&fit=crop' }} 
        style={styles.background}
        resizeMode="cover"
      >
        {/* Overlay Escuro com Gradiente Sutil (Simulado via cor sólida com alpha) */}
        <View style={styles.overlay}>
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            
            {/* Header / Voltar */}
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <ArrowLeft size={24} color="white" />
            </TouchableOpacity>

            <View style={styles.formContainer}>
              
              {/* Títulos */}
              <View style={styles.headerText}>
                <Text style={styles.welcomeText}>Bem-vindo de volta!</Text>
                <Text style={styles.shopName}>
                  {shop?.name || 'Acesse sua conta'}
                </Text>
              </View>

              {/* Inputs */}
              <View style={styles.inputGroup}>
                
                {/* E-mail */}
                <View style={styles.inputWrapper}>
                  <Mail size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Seu e-mail"
                    placeholderTextColor="#94a3b8"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>

                {/* Senha */}
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Sua senha"
                    placeholderTextColor="#94a3b8"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    {showPassword ? (
                      <EyeOff size={20} color="#94a3b8" />
                    ) : (
                      <Eye size={20} color="#94a3b8" />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Esqueci minha senha */}
                <TouchableOpacity style={styles.forgotBtn}>
                  <Text style={styles.forgotText}>Esqueceu a senha?</Text>
                </TouchableOpacity>

              </View>

              {/* Botão Login */}
              <TouchableOpacity 
                style={[styles.loginBtn, { backgroundColor: theme.primary }]}
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={theme.primaryText} />
                ) : (
                  <Text style={[styles.loginBtnText, { color: theme.primaryText }]}>Entrar</Text>
                )}
              </TouchableOpacity>

            </View>

            {/* Rodapé: Cadastro */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Não tem uma conta?</Text>
              <TouchableOpacity onPress={() => router.push('/register')}>
                <Text style={[styles.signupText, { color: theme.primary }]}>Cadastre-se</Text>
              </TouchableOpacity>
            </View>

          </KeyboardAvoidingView>
        </View>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: { flex: 1, width: '100%', height: '100%' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.9)', // Overlay bem escuro para focar no form
    padding: 24,
  },
  keyboardView: { flex: 1, justifyContent: 'center' },
  
  backBtn: {
    position: 'absolute', top: 50, left: 0, 
    width: 40, height: 40, justifyContent: 'center', alignItems: 'center',
    zIndex: 10
  },

  formContainer: { width: '100%' },

  headerText: { marginBottom: 40 },
  welcomeText: { color: '#cbd5e1', fontSize: 16, marginBottom: 5 },
  shopName: { color: 'white', fontSize: 32, fontWeight: 'bold' },

  inputGroup: { gap: 16, marginBottom: 30 },
  
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)', // Translúcido
    borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    height: 56, paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: 'white', fontSize: 16, height: '100%' },
  eyeIcon: { padding: 5 },

  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { color: '#94a3b8', fontSize: 14 },

  loginBtn: {
    height: 56, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 5, elevation: 5,
  },
  loginBtnText: { fontSize: 16, fontWeight: 'bold' },

  footer: {
    flexDirection: 'row', justifyContent: 'center', gap: 5,
    marginTop: 40,
  },
  footerText: { color: '#cbd5e1', fontSize: 14 },
  signupText: { fontWeight: 'bold', fontSize: 14 },
});