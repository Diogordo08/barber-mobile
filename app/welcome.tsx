import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Image,
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../src/services/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

export default function Welcome() {
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleFindBarbershop() {
    if (!slug.trim()) {
      return Alert.alert('Ops!', 'Digite o código da barbearia.');
    }

    try {
      setLoading(true);
      // 1. Busca os dados na API
      const shopData = await api.getBarbershop(slug.toLowerCase().trim());

      // 2. Salva no celular para o App lembrar sempre
      await AsyncStorage.setItem('@BarberSaaS:slug', shopData.slug);
      await AsyncStorage.setItem('@BarberSaaS:theme', JSON.stringify(shopData.theme));
      if (shopData.logo) {
        await AsyncStorage.setItem('@BarberSaaS:logo', shopData.logo);
      }

      // 3. Manda para o Login (ou Home)
      router.replace('/login');

    } catch (error) {
      console.log(error);
      Alert.alert('Erro', 'Barbearia não encontrada. Verifique o código.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-slate-900 justify-center px-6">
      <StatusBar style="light" />
      
      <View className="items-center mb-10">
        <View className="w-20 h-20 bg-blue-600 rounded-2xl items-center justify-center mb-4">
          {/* Aqui poderia ser o ícone do seu SaaS */}
          <Text className="text-3xl">✂️</Text>
        </View>
        <Text className="text-white text-2xl font-bold text-center">
          Bem-vindo
        </Text>
        <Text className="text-slate-400 text-center mt-2">
          Digite o código da sua barbearia para acessar o agendamento.
        </Text>
      </View>

      <View className="space-y-4">
        <View>
          <Text className="text-slate-300 mb-2 font-medium">Código da Barbearia</Text>
          <TextInput
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-lg"
            placeholder="Ex: barbearia-do-ze"
            placeholderTextColor="#64748b"
            autoCapitalize="none"
            value={slug}
            onChangeText={setSlug}
          />
        </View>

        <TouchableOpacity 
          className="w-full bg-blue-600 rounded-xl py-4 items-center flex-row justify-center"
          onPress={handleFindBarbershop}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text className="text-white font-bold text-lg">Acessar Barbearia</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}