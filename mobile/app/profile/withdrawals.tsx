import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getWalletStats, getBankAccounts, createWithdrawal } from '../../src/api/endpoints';
import { Colors } from '../../src/constants/theme';

export default function RequestWithdrawalScreen() {
  const router = useRouter();

  const [balance, setBalance] = useState(0);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [amount, setAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showAccountsModal, setShowAccountsModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [walletRes, accountsRes] = await Promise.all([
          getWalletStats(),
          getBankAccounts()
        ]);
        setBalance(parseFloat(walletRes.balance || 0));
        const accounts = accountsRes.data || [];
        setBankAccounts(accounts);
        
        const defaultAcc = accounts.find((a: any) => a.is_default);
        if (defaultAcc) {
          setSelectedAccountId(defaultAcc.id);
        } else if (accounts.length > 0) {
          setSelectedAccountId(accounts[0].id);
        }
      } catch (err) {
        console.error('Error loading withdrawal data:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const handleRequest = async () => {
    const withdrawAmount = parseFloat(amount);
    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      Alert.alert('Monto inválido', 'Por favor ingresa un monto mayor a $0.');
      return;
    }

    if (withdrawAmount > balance) {
      Alert.alert('Saldo insuficiente', `Tu saldo disponible es de $${balance.toFixed(2)}.`);
      return;
    }

    if (!selectedAccountId) {
      Alert.alert('Cuenta bancaria requerida', 'Por favor selecciona o registra una cuenta bancaria.');
      return;
    }

    setSubmitting(true);
    try {
      await createWithdrawal(withdrawAmount, selectedAccountId);
      Alert.alert(
        'Solicitud Enviada',
        'Tu solicitud de retiro ha sido enviada con éxito. Un administrador verificará y depositará tu dinero.',
        [{ text: 'OK', onPress: () => router.replace('/profile/wallet' as any) }]
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo procesar la solicitud de retiro.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.brand.secondary} />
      </View>
    );
  }

  const selectedAccount = bankAccounts.find(a => a.id === selectedAccountId);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.brand.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Retirar Saldo</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Info Box */}
        <View style={styles.infoBox}>
          <Text style={styles.infoLabel}>Saldo Disponible para Retiro</Text>
          <Text style={styles.infoValue}>${balance.toFixed(2)}</Text>
        </View>

        {bankAccounts.length === 0 ? (
          <View style={styles.noAccountsCard}>
            <Ionicons name="alert-circle-outline" size={36} color={Colors.brand.accent} />
            <Text style={styles.noAccountsTitle}>No tienes cuentas bancarias registradas</Text>
            <Text style={styles.noAccountsText}>
              Para poder solicitar retiros de tus ventas, debes registrar tu cuenta de ahorros o corriente de un banco local.
            </Text>
            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => router.push('/profile/bank-accounts' as any)}
            >
              <Text style={styles.registerBtnText}>Registrar Cuenta Bancaria</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.form}>
            {/* Amount input */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Monto a Retirar (USD) *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Bank account selector */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Depositar en cuenta *</Text>
              <TouchableOpacity
                style={styles.selectorTrigger}
                onPress={() => setShowAccountsModal(true)}
              >
                {selectedAccount ? (
                  <View>
                    <Text style={styles.selectedBankName}>{selectedAccount.banco}</Text>
                    <Text style={styles.selectedBankDetails}>
                      {selectedAccount.tipo_cuenta} - {selectedAccount.numero_cuenta}
                    </Text>
                    <Text style={styles.selectedBankOwner}>{selectedAccount.titular}</Text>
                  </View>
                ) : (
                  <Text style={styles.placeholderText}>Selecciona una cuenta</Text>
                )}
                <Ionicons name="chevron-down" size={20} color={Colors.brand.muted} />
              </TouchableOpacity>
            </View>

            {/* Submit btn */}
            <TouchableOpacity
              style={[styles.submitBtn, (submitting || balance <= 0 || !selectedAccountId) && styles.disabledBtn]}
              onPress={handleRequest}
              disabled={submitting || balance <= 0 || !selectedAccountId}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Confirmar Retiro</Text>
                  <Ionicons name="send" size={16} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bank accounts modal */}
      {showAccountsModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona Cuenta Bancaria</Text>
              <TouchableOpacity onPress={() => setShowAccountsModal(false)}>
                <Ionicons name="close" size={24} color={Colors.brand.dark} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {bankAccounts.map((acc) => (
                <TouchableOpacity
                  key={acc.id}
                  style={styles.accountOption}
                  onPress={() => {
                    setSelectedAccountId(acc.id);
                    setShowAccountsModal(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionBankName}>{acc.banco}</Text>
                    <Text style={styles.optionDetails}>
                      {acc.tipo_cuenta}: {acc.numero_cuenta}
                    </Text>
                    <Text style={styles.optionOwner}>{acc.titular}</Text>
                  </View>
                  {selectedAccountId === acc.id && (
                    <Ionicons name="checkmark" size={20} color={Colors.brand.secondary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.brand.secondary,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoBox: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 24,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand.muted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 32,
    fontWeight: '900',
    color: Colors.brand.secondary,
  },
  noAccountsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  noAccountsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.brand.secondary,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  noAccountsText: {
    fontSize: 13,
    color: Colors.brand.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
    fontWeight: '500',
  },
  registerBtn: {
    backgroundColor: Colors.brand.secondary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  registerBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 13,
  },
  form: {
    gap: 20,
  },
  formGroup: {
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brand.dark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: Colors.brand.dark,
    fontWeight: '600',
  },
  selectorTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  selectedBankName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.brand.secondary,
  },
  selectedBankDetails: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.brand.dark,
    marginVertical: 2,
  },
  selectedBankOwner: {
    fontSize: 11,
    color: Colors.brand.muted,
    fontWeight: '550',
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.brand.muted,
  },
  submitBtn: {
    backgroundColor: Colors.brand.secondary,
    borderRadius: 18,
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: Colors.brand.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 12,
  },
  disabledBtn: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.brand.secondary,
  },
  accountOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  optionBankName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.brand.secondary,
  },
  optionDetails: {
    fontSize: 12,
    color: Colors.brand.dark,
    fontWeight: '600',
    marginVertical: 2,
  },
  optionOwner: {
    fontSize: 11,
    color: Colors.brand.muted,
    fontWeight: '500',
  },
});
