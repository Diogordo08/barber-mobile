import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Mail, Lock } from 'lucide-react-native';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme } from '../src/contexts/ThemeContext';

export default function Register() {
  const router = useRouter();
  const { theme } = useTheme();
  const { signUp } = useAuth(); // Usaremos a nova função

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // 1. Novo estado
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      return Alert.alert("Atenção", "Por favor, preencha todos os campos.");
    }

    if (password.length < 8) { // 2. Ajustado para 8 caracteres
      return Alert.alert("Senha curta", "Sua senha precisa ter no mínimo 8 caracteres.");
    }

    if (password !== confirmPassword) { // 3. Validação de senhas
      return Alert.alert("Erro", "As senhas não coincidem.");
    }

    setLoading(true);
    try {
      // Chama a função de cadastro do contexto
      await signUp(name, email, password, confirmPassword); // 4. Enviando a confirmação
      // O redirecionamento será feito automaticamente pelo _layout.tsx
      // após o estado de autenticação mudar. Não precisamos fazer nada aqui.

    } catch (error: any) {
      Alert.alert("Erro no Cadastro", error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: '#f8fafc' }]} contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} disabled={loading}>
        <ArrowLeft size={24} color="#64748b" />
      </TouchableOpacity>

      <View style={styles.header}>
        <Text style={styles.title}>Crie sua conta</Text>
        <Text style={styles.subtitle}>É rápido, fácil e gratuito.</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <User size={20} color="#94a3b8" />
          <TextInput
            style={styles.input}
            placeholder="Nome Completo"
            placeholderTextColor="#94a3b8"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>

        <View style={styles.inputContainer}>
          <Mail size={20} color="#94a3b8" />
          <TextInput
            style={styles.input}
            placeholder="Seu melhor e-mail"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />
        </View>

        <View style={styles.inputContainer}>
          <Lock size={20} color="#94a3b8" />
          <TextInput
            style={styles.input}
            placeholder="Crie uma senha (mín. 8 caracteres)"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="done"
          />
        </View>

        {/* 5. NOVO CAMPO DE CONFIRMAÇÃO DE SENHA */}
        <View style={styles.inputContainer}>
          <Lock size={20} color="#94a3b8" />
          <TextInput
            style={styles.input}
            placeholder="Confirme sua senha"
            placeholderTextColor="#94a3b8"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            returnKeyType="done"
          />
        </View>


        <TouchableOpacity 
          style={[styles.button, { backgroundColor: theme.primary }]} 
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.btnText}>Criar Conta</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity onPress={() => router.replace('/login')} disabled={loading}>
          <Text style={styles.footerText}>
            Já tem uma conta? <Text style={{ color: theme.primary, fontWeight: 'bold' }}>Faça Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  backBtn: { position: 'absolute', top: 60, left: 20, zIndex: 10, padding: 5 },
  header: { alignItems: 'center', marginBottom: 40, paddingTop: 80 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1e293b', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#64748b' },
  form: { width: '100%', gap: 15 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'white',
    borderRadius: 12, paddingHorizontal: 15, height: 55,
    borderWidth: 1, borderColor: '#e2e8f0',
  },
  input: { flex: 1, marginLeft: 10, fontSize: 16, color: '#1e293b' },
  button: {
    height: 55, borderRadius: 12, alignItems: 'center',
    justifyContent: 'center', marginTop: 10,
  },
  btnText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  footer: { marginTop: 30, alignItems: 'center', paddingBottom: 20 },
  footerText: { color: '#64748b', fontSize: 14 },
});