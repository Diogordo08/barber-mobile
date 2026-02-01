import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { CreditCard, Lock, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react-native';
import { api } from '../../src/services/api';
import { useTheme } from '../../src/contexts/ThemeContext'; // useTheme já nos dá o shop
import { Plan } from '../../src/types';

export default function Checkout() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme, shop } = useTheme(); // Pegamos o shop aqui

  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Estados do Formulário de Cartão (opcional, só visual por enquanto)
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');

  useEffect(() => {
    // Só busca se tivermos um slug
    if (shop?.slug) {
      api.getPlans(shop.slug).then(plans => {
        const found = plans.find(p => p.id === id);
        setPlan(found || null);
      });
    }
  }, [id, shop]); // Adiciona shop como dependência

  async function handlePay() {
    // Validação simples
    if (!cardNumber || !cardName) {
        // Num app real, usaria Alert.alert("Erro", "Preencha os dados do cartão")
        // Mas vamos deixar passar pra testar
    }

    setLoading(true);
    // Simula processamento
    await new Promise(r => setTimeout(r, 2000));
    
    // Envia fixo 'card' como método
    await api.subscribeToPlan(id as string, 'card');
    
    setLoading(false);
    setSuccess(true);
    
    setTimeout(() => {
      router.dismissAll();
      router.replace('/(tabs)');
    }, 2500);
  }

  if (!plan) return (
    <View style={styles.center}>
      <ActivityIndicator color={theme.primary} />
      <Text style={{ marginTop: 10, color: '#64748b' }}>Carregando plano...</Text>
    </View>
  );

  if (success) return (
    <View style={styles.successContainer}>
      <CheckCircle size={100} color="#10b981" />
      <Text style={styles.successTitle}>Pagamento Confirmado!</Text>
      <Text style={styles.successText}>Bem-vindo ao clube {plan.name}.</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Pagamento com Cartão</Text>
      </View>

      <ScrollView>
        {/* Resumo */}
        <View style={styles.summary}>
          <Text style={styles.label}>Você está assinando:</Text>
          <View style={styles.rowBetween}>
            <Text style={styles.planName}>{plan.name}</Text>
            <Text style={[styles.price, { color: theme.primary }]}>R$ {plan.price.toFixed(2)}</Text>
          </View>
        </View>

        {/* Formulário Único (Só Cartão) */}
        <Text style={styles.sectionTitle}>Dados do Cartão</Text>
        
        <View style={styles.form}>
            <View style={styles.inputContainer}>
                <CreditCard size={20} color="#94a3b8" style={{ marginRight: 10 }} />
                <TextInput 
                    style={styles.input} 
                    placeholder="Número do Cartão" 
                    keyboardType="numeric"
                    value={cardNumber}
                    onChangeText={setCardNumber}
                />
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                  <TextInput style={styles.input} placeholder="MM/AA" keyboardType="numeric" maxLength={5} />
              </View>
              <View style={[styles.inputContainer, { flex: 1 }]}>
                  <TextInput style={styles.input} placeholder="CVV" keyboardType="numeric" maxLength={3} />
              </View>
            </View>

            <View style={styles.inputContainer}>
                <TextInput 
                    style={styles.input} 
                    placeholder="Nome Impresso no Cartão" 
                    value={cardName}
                    onChangeText={setCardName}
                    autoCapitalize="characters"
                />
            </View>
        </View>

      </ScrollView>

      {/* Botão Fixo */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.payButton, { backgroundColor: theme.primary }]}
          onPress={handlePay}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Lock size={18} color="white" />
              <Text style={styles.payText}>
                Pagar R$ {plan.price.toFixed(2)}
              </Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.secureText}>Ambiente criptografado e seguro 🔒</Text>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1, padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { marginRight: 15 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  
  summary: { backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 25 },
  label: { color: '#64748b', fontSize: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 5 },
  planName: { fontSize: 20, fontWeight: 'bold', color: '#1e293b' },
  price: { fontSize: 20, fontWeight: 'bold' },

  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 15, color: '#334155' },

  form: { gap: 15 },
  inputContainer: { 
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'white', paddingHorizontal: 15, borderRadius: 8, borderWidth: 1, borderColor: '#e2e8f0', height: 50
  },
  input: { flex: 1, fontSize: 16, height: '100%' },

  footer: { marginTop: 20 },
  payButton: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: 16, borderRadius: 12, elevation: 2 
  },
  payText: { color: 'white', fontWeight: 'bold', fontSize: 18 },
  secureText: { textAlign: 'center', color: '#cbd5e1', fontSize: 12, marginTop: 15 },

  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'white' },
  successTitle: { fontSize: 24, fontWeight: 'bold', marginTop: 20, color: '#1e293b' },
  successText: { color: '#64748b', marginTop: 5 },
});