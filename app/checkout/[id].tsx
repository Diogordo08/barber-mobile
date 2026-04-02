import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Alert, ScrollView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, CreditCard, QrCode, X } from 'lucide-react-native';
import { api } from '../../src/services/api';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { Plan } from '../../src/types';

// ─── MP Bricks HTML ───────────────────────────────────────────────────────────
function buildBricksHtml(publicKey: string, amount: number): string {
  return `<!DOCTYPE html>
<html lang="pt-BR"><head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0"/>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,sans-serif;background:#fff;padding:16px}
    #status{text-align:center;padding:40px;color:#64748b;font-size:14px}
    #err{display:none;background:#fef2f2;color:#dc2626;padding:12px;border-radius:8px;margin-bottom:12px;font-size:13px;text-align:center}
  </style>
</head><body>
  <div id="status">Carregando formulario seguro...</div>
  <div id="err"></div>
  <div id="mp-form"></div>
  <script>
    function rn(d){try{window.ReactNativeWebView.postMessage(JSON.stringify(d))}catch(e){}}
    function showErr(msg){
      document.getElementById('status').style.display='none';
      var el=document.getElementById('err');
      el.textContent=msg; el.style.display='block';
      rn({type:'ERROR',msg:msg});
    }
    function initBricks(){
      document.getElementById('status').style.display='none';
      try {
        var mp = new MercadoPago('${publicKey}', { locale: 'pt-BR' });
        mp.bricks().create('cardPayment','mp-form',{
          initialization: { amount: ${amount} },
          customization: { paymentMethods: { maxInstallments: 1 } },
          callbacks: {
            onReady: function(){ rn({type:'READY'}); },
            onSubmit: function(formData){
              return new Promise(function(resolve,reject){
                window.__resolve=resolve;
                window.__reject=reject;
                var fd=(formData&&formData.formData)?formData.formData:formData;
                if(!fd||!fd.token){ reject(new Error('Token ausente')); return; }
                rn({type:'TOKEN', token:fd.token, installments:fd.installments||1});
              });
            },
            onError: function(e){ rn({type:'ERROR', msg:(e&&e.message)?e.message:JSON.stringify(e)}); }
          }
        }).catch(function(err){ showErr('Erro ao criar Bricks: '+(err&&err.message||err)); });
      } catch(e){ showErr('Erro: '+e.message); }
    }
  </script>
  <script
    src="https://sdk.mercadopago.com/js/v2"
    onload="initBricks()"
    onerror="showErr('Falha ao carregar SDK. Verifique a conexao com a internet.')">
  </script>
</body></html>`;
}

// ─── Modal WebView com MP Bricks ──────────────────────────────────────────────
interface BricksModalProps {
  publicKey: string;
  amount: number;
  primaryColor: string;
  onToken: (token: string, installments: number) => Promise<void>;
  onClose: () => void;
}
function BricksModal({ publicKey, amount, primaryColor, onToken, onClose }: BricksModalProps) {
  const webViewRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  async function handleMessage(event: any) {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'READY') {
        setReady(true);
      } else if (data.type === 'TOKEN') {
        try {
          await onToken(data.token, data.installments ?? 1);
          webViewRef.current?.injectJavaScript('window.__resolve && window.__resolve(); true;');
        } catch (e: any) {
          const msg = e?.message || 'Falha ao processar pagamento.';
          webViewRef.current?.injectJavaScript(
            `window.__reject && window.__reject(new Error(${JSON.stringify(msg)})); true;`
          );
        }
      } else if (data.type === 'ERROR') {
        Alert.alert('Erro no formulário', data.msg || 'Tente novamente.');
      }
    } catch { }
  }

  return (
    <View style={bm.overlay}>
      <View style={bm.modal}>
        <View style={bm.header}>
          <Text style={bm.headerTitle}>Dados do Cartão</Text>
          <TouchableOpacity onPress={onClose}>
            <X size={22} color="#64748b" />
          </TouchableOpacity>
        </View>
        {!ready && (
          <View style={bm.loading}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={bm.loadingText}>Carregando formulário seguro...</Text>
          </View>
        )}
        <WebView
          ref={webViewRef}
          source={{ html: buildBricksHtml(publicKey, amount), baseUrl: 'https://sdk.mercadopago.com' }}
          style={ready ? bm.webView : bm.webViewHidden}
          onMessage={handleMessage}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          mixedContentMode="always"
          allowsInlineMediaPlayback
        />
      </View>
    </View>
  );
}

const bm = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end', zIndex: 100 },
  modal: { backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  headerTitle: { fontSize: 17, fontWeight: 'bold', color: '#1e293b' },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  loadingText: { color: '#64748b', fontSize: 14 },
  webView: { flex: 1 },
  webViewHidden: { height: 0, opacity: 0 },
});

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const { shop } = useAuth();

  const [plan, setPlan]               = useState<Plan | null>(null);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('pix');
  const [pixCode, setPixCode]         = useState<string | null>(null);
  const [pollingActive, setPollingActive] = useState(false);
  const [showBricks, setShowBricks]       = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cardAvailable = Boolean(shop?.mp_public_key);

  useEffect(() => {
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  function startPolling() {
    setPollingActive(true);
    let attempts = 0;
    pollingRef.current = setInterval(async () => {
      attempts++;
      try {
        const sub = await api.getSubscription();
        if (sub?.status === 'active') {
          clearInterval(pollingRef.current!);
          setPollingActive(false);
          Alert.alert('Confirmado! ✅', 'Sua assinatura está ativa. Bem-vindo ao clube!', [
            { text: 'OK', onPress: () => router.replace('/(tabs)/plans') }
          ]);
        }
      } catch { /* 404 = ainda pending */ }
      if (attempts >= 60) { clearInterval(pollingRef.current!); setPollingActive(false); }
    }, 5000);
  }

  useEffect(() => {
    async function load() {
      if (!shop?.slug || !id) return;
      try {
        const plans = await api.getPlans(shop.slug);
        const found = plans.find((p: Plan) => p.id === Number(id));
        if (found) { setPlan(found); }
        else { Alert.alert('Erro', 'Plano não encontrado.'); router.back(); }
      } catch { Alert.alert('Erro', 'Falha ao carregar detalhes.'); router.back(); }
      finally { setLoading(false); }
    }
    load();
  }, [id, shop]);

  async function handleSubscribePix() {
    if (!plan) return;
    setSubmitting(true);
    try {
      const result = await api.subscribeToPlan({ plan_id: plan.id, payment_method: 'pix' });

      // Plano gratuito
      if (!result?.pix && !result?.payment_status) {
        Alert.alert('Sucesso!', result?.message || `Você assinou o plano ${plan.name}!`, [
          { text: 'OK', onPress: () => router.replace('/(tabs)/plans') }
        ]);
        return;
      }
      // PIX gerado
      if (result?.pix?.copy_paste) {
        setPixCode(result.pix.copy_paste);
        startPolling();
        Alert.alert('PIX Gerado! 🎉',
          `Copie o código e pague no seu banco:\n\n${result.pix.copy_paste}\n\nA assinatura será ativada automaticamente após confirmação.`,
          [{ text: 'OK' }]);
      }
    } catch (error: any) {
      const data = error.response?.data;
      const status = error.response?.status;
      console.log(`[PIX] ERRO [${status}]:`, JSON.stringify(data));
      const msg = data?.message ||
        (data?.errors ? Object.values(data.errors as Record<string, string[]>).flat().join('\n') : null) ||
        `Erro ${status ?? 'de conexão'}.`;
      Alert.alert('Ops!', msg);
    } finally { setSubmitting(false); }
  }

  async function handleCardToken(token: string, installments: number): Promise<void> {
    console.log('[Cartão] Token recebido:', token ? `${token.substring(0, 16)}...` : 'NULO/VAZIO');
    console.log('[Cartão] Payload →', JSON.stringify({ plan_id: plan!.id, payment_method: 'card', card_token: !!token, installments }));
    if (!token) {
      throw new Error('Token do cartão não gerado. Verifique os dados e tente novamente.');
    }
    setSubmitting(true);
    try {
      const result = await api.subscribeToPlan({
        plan_id: plan!.id,
        payment_method: 'card',
        card_token: token,
        installments,
      });
      console.log('[Cartão] Resposta backend:', JSON.stringify(result));
      setShowBricks(false);
      if (result?.payment_status === 'approved') {
        Alert.alert('Aprovado! ✅', 'Sua assinatura está ativa.', [
          { text: 'OK', onPress: () => router.replace('/(tabs)/plans') }
        ]);
      } else if (result?.payment_status === 'in_process') {
        startPolling();
        Alert.alert('Em Análise ⏳', 'Pagamento em análise. Você será notificado quando confirmado.', [{ text: 'OK' }]);
      } else {
        Alert.alert('Sucesso!', result?.message || `Você assinou o plano ${plan!.name}.`, [
          { text: 'OK', onPress: () => router.replace('/(tabs)/plans') }
        ]);
      }
    } catch (error: any) {
      const data = error.response?.data;
      const status = error.response?.status;
      console.log(`[Cartão] ERRO [${status}]:`, JSON.stringify(data));
      const msg = data?.message && data.message !== 'Server Error'
        ? data.message
        : status === 500
          ? 'Pagamento não processado. Verifique os dados do cartão ou tente outro cartão.'
          : (data?.errors ? Object.values(data.errors as Record<string, string[]>).flat().join('\n') : null) ||
            'Falha ao processar pagamento. Tente novamente.';
      // throw para que o Bricks mostre o erro e permita repetir
      throw new Error(msg);
    } finally { setSubmitting(false); }
  }

  function handleConfirm() {
    if (paymentMethod === 'card') { setShowBricks(true); return; }
    handleSubscribePix();
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={theme.primary} /></View>;
  if (!plan)   return <View style={styles.center}><Text>Plano não encontrado</Text></View>;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1e293b" />
        </TouchableOpacity>
        <Text style={styles.title}>Checkout</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.label}>Você está assinando:</Text>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={[styles.planPrice, { color: theme.primary }]}>
            R$ {Number(plan.price).toFixed(2)}
            <Text style={{ fontSize: 14, color: '#64748b' }}>/mês</Text>
          </Text>
          <View style={styles.divider} />
          <Text style={styles.description}>{plan.description || 'Sem descrição'}</Text>
        </View>

        {pixCode && (
          <View style={styles.pixBox}>
            <Text style={styles.pixTitle}>📋 Código PIX Copia e Cola</Text>
            <Text style={styles.pixCode} selectable>{pixCode}</Text>
            {pollingActive && (
              <View style={styles.pollingRow}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.pollingText, { color: theme.primary }]}>
                  Aguardando confirmação do pagamento...
                </Text>
              </View>
            )}
          </View>
        )}

        <Text style={styles.sectionTitle}>Forma de Pagamento</Text>

        <TouchableOpacity
          style={[styles.methodCard, paymentMethod === 'pix' && { borderColor: theme.primary, backgroundColor: '#f0f9ff' }]}
          onPress={() => setPaymentMethod('pix')}
        >
          <QrCode size={24} color={paymentMethod === 'pix' ? theme.primary : '#64748b'} />
          <View style={{ flex: 1 }}>
            <Text style={styles.methodTitle}>PIX</Text>
            <Text style={styles.methodDesc}>Pagamento instantâneo confirmado pelo banco.</Text>
          </View>
          {paymentMethod === 'pix' && <View style={[styles.radio, { backgroundColor: theme.primary }]} />}
        </TouchableOpacity>

        {cardAvailable && (
          <>
            <TouchableOpacity
              style={[styles.methodCard, paymentMethod === 'card' && { borderColor: theme.primary, backgroundColor: '#f0f9ff' }]}
              onPress={() => setPaymentMethod('card')}
            >
              <CreditCard size={24} color={paymentMethod === 'card' ? theme.primary : '#64748b'} />
              <View style={{ flex: 1 }}>
                <Text style={styles.methodTitle}>Cartão de Crédito</Text>
                <Text style={styles.methodDesc}>Até 12x. Cobrança via MercadoPago.</Text>
              </View>
              {paymentMethod === 'card' && <View style={[styles.radio, { backgroundColor: theme.primary }]} />}
            </TouchableOpacity>
            {paymentMethod === 'card' && (
              <View style={styles.creditCardNotice}>
                <Text style={styles.creditCardNoticeText}>
                  ⚠️ Apenas cartão de crédito é aceito para assinaturas. Cartão de débito não é suportado.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: theme.primary }]}
          onPress={handleConfirm}
          disabled={submitting}
        >
          {submitting
            ? <ActivityIndicator color="white" />
            : <Text style={styles.confirmBtnText}>
                {paymentMethod === 'card' ? 'Pagar com Cartão' : 'Confirmar e Assinar'}
              </Text>
          }
        </TouchableOpacity>
      </View>

      {/* Formulário de cartão via MP Bricks (WebView) */}
      {showBricks && shop?.mp_public_key && plan && (
        <BricksModal
          publicKey={shop.mp_public_key}
          amount={Number(plan.price)}
          primaryColor={theme.primary}
          onToken={handleCardToken}
          onClose={() => setShowBricks(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { flex: 1 },
  header: {
    paddingTop: 60, paddingHorizontal: 20, paddingBottom: 20, backgroundColor: 'white',
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'
  },
  title: { fontSize: 18, fontWeight: 'bold', color: '#1e293b' },
  content: { padding: 20 },
  
  summaryCard: {
    backgroundColor: 'white', padding: 20, borderRadius: 16, marginBottom: 30,
    borderWidth: 1, borderColor: '#e2e8f0'
  },
  label: { color: '#64748b', marginBottom: 5 },
  planName: { fontSize: 24, fontWeight: 'bold', color: '#1e293b' },
  planPrice: { fontSize: 28, fontWeight: 'bold', marginVertical: 5 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 15 },
  description: { color: '#334155', lineHeight: 20 },

  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1e293b', marginBottom: 15 },
  
  methodCard: {
    flexDirection: 'row', alignItems: 'center', gap: 15,
    backgroundColor: 'white', padding: 20, borderRadius: 12, marginBottom: 15,
    borderWidth: 1, borderColor: '#e2e8f0'
  },
  methodTitle: { fontSize: 16, fontWeight: 'bold', color: '#1e293b' },
  methodDesc: { fontSize: 13, color: '#64748b' },
  radio: { width: 12, height: 12, borderRadius: 6 },
  creditCardNotice: {
    backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fcd34d',
    borderRadius: 8, padding: 12, marginTop: -8, marginBottom: 8,
  },
  creditCardNoticeText: { fontSize: 12, color: '#92400e', lineHeight: 18 },

  footer: {
    padding: 20, backgroundColor: 'white', borderTopWidth: 1, borderTopColor: '#f1f5f9'
  },
  confirmBtn: {
    height: 56, borderRadius: 12, justifyContent: 'center', alignItems: 'center'
  },
  confirmBtnText: { color: 'white', fontSize: 18, fontWeight: 'bold' },

  pixBox: {
    backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#86efac',
    borderRadius: 12, padding: 16, marginBottom: 20
  },
  pixTitle: { fontSize: 14, fontWeight: 'bold', color: '#166534', marginBottom: 8 },
  pixCode: {
    fontSize: 11, color: '#166534', fontFamily: 'monospace',
    backgroundColor: '#dcfce7', borderRadius: 8, padding: 10, lineHeight: 16
  },
  pollingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 },
  pollingText: { fontSize: 13, fontWeight: '500' },

});