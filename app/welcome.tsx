import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert,
  StyleSheet,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { api } from '../src/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../src/contexts/AuthContext';

export default function Welcome() {
  const { selectShop } = useAuth();
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

async function handleFindBarbershop() {
    if (!slug.trim()) {
      Alert.alert("Atenção", "Digite o código da barbearia.");
      return;
    }

    try {
      setLoading(true); // Começa o loading
      
      const cleanSlug = slug.toLowerCase().trim();
      console.log(`👉 Buscando: ${cleanSlug}`);
      
      const data = await api.getBarbershop(cleanSlug);
      
      if (!data || !data.id) {
        throw new Error("Dados inválidos");
      }
      
      // Salva e AGUARDA
      await selectShop(data); 
      console.log("👉 Salvo! Navegando...");
      
      // ⚠️ MUDANÇA: Usamos replace e NÃO desligamos o loading (pra não piscar)
      router.push('/login');

    } catch (error: any) {
      console.log("❌ Erro:", error);
      Alert.alert('Erro', 'Barbearia não encontrada.');
      setLoading(false); // Só desliga o loading se der erro
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.iconBox}>
            <Text style={{ fontSize: 40 }}>✂️</Text>
          </View>
          <Text style={styles.title}>Bem-vindo</Text>
          <Text style={styles.subtitle}>
            Digite o código da sua barbearia para acessar o agendamento.
          </Text>
        </View>

        <View style={styles.form}>
          <View>
            <Text style={styles.label}>Código da Barbearia</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: victor-azambuja"
              placeholderTextColor="#64748b"
              autoCapitalize="none"
              value={slug}
              onChangeText={setSlug}
            />
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleFindBarbershop}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Acessar Barbearia</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconBox: {
    width: 80,
    height: 80,
    backgroundColor: '#2563eb',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  subtitle: {
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 8,
    fontSize: 16,
  },
  form: {
    gap: 16,
  },
  label: {
    color: '#cbd5e1',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: 'white',
    fontSize: 18,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  }
});