import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Alert, 
  ActivityIndicator, StyleSheet, Image 
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, ArrowLeft } from 'lucide-react-native';

export default function Login() {
  const router = useRouter();
  const { signIn, shop } = useAuth(); // Agora temos o shop!
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // DEBUG: Para saber se a tela montou
  React.useEffect(() => {
    console.log("✅ TELA DE LOGIN CARREGOU!");
    console.log("💈 Loja atual:", shop?.name);
  }, []);

  async function handleSignIn() {
    if (!email || !password) {
      return Alert.alert('Atenção', 'Preencha e-mail e senha.');
    }

    try {
      setLoading(true);
      await signIn(email, password);
      // Se der certo, o AuthContext atualiza e o _layout redireciona sozinho para /(tabs)
    } catch (error: any) {
      console.log(error);
      Alert.alert('Erro', error.message || 'Falha no login.');
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        {/* Botão Voltar (caso queira trocar de barbearia) */}
        <TouchableOpacity onPress={() => router.replace('/welcome')} style={styles.backBtn}>
          <ArrowLeft color="#64748b" size={24} />
          <Text style={{color: '#64748b', marginLeft: 5}}>Trocar Barbearia</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>{shop?.name || 'Login'}</Text>
          <Text style={styles.subtitle}>Entre com sua conta para agendar.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Mail size={20} color="#64748b" />
            <TextInput 
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputContainer}>
            <Lock size={20} color="#64748b" />
            <TextInput 
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          {/* Link para Cadastro */}
          <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 24 }}>
            <Text style={{ color: '#94a3b8' }}>Não tem conta? </Text>
            <TouchableOpacity onPress={() => router.push('/register')}>
              <Text style={{ color: '#2563eb', fontWeight: 'bold' }}>Cadastre-se</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 24 },
  content: { flex: 1, justifyContent: 'center' },
  backBtn: { flexDirection: 'row', alignItems: 'center', position: 'absolute', top: 20, left: 0, zIndex: 10 },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: 'white', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 16, color: '#94a3b8' },
  form: { gap: 16 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#1e293b', borderRadius: 12, paddingHorizontal: 16, height: 56,
    borderWidth: 1, borderColor: '#334155'
  },
  input: { flex: 1, color: 'white', fontSize: 16 },
  button: {
    backgroundColor: '#2563eb', borderRadius: 12, height: 56,
    alignItems: 'center', justifyContent: 'center', marginTop: 10
  },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
});