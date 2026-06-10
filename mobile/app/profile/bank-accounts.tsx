import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getBankAccounts, createBankAccount, deleteBankAccount, setDefaultBankAccount } from '../../src/api/endpoints';
import { Colors } from '../../src/constants/theme';

export default function BankAccountManagerScreen() {
  const router = useRouter();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [banco, setBanco] = useState('');
  const [tipoCuenta, setTipoCuenta] = useState<'Ahorros' | 'Corriente'>('Ahorros');
  const [numeroCuenta, setNumeroCuenta] = useState('');
  const [titular, setTitular] = useState('');
  const [cedulaRuc, setCedulaRuc] = useState('');
  const [emailTitular, setEmailTitular] = useState('');

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const res = await getBankAccounts();
      setAccounts(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleSave = async () => {
    if (!banco || !numeroCuenta || !titular || !cedulaRuc || !emailTitular) {
      Alert.alert('Faltan campos', 'Por favor llena todos los campos obligatorios.');
      return;
    }

    setSubmitting(true);
    try {
      await createBankAccount({
        banco,
        tipo_cuenta: tipoCuenta,
        numero_cuenta: numeroCuenta,
        titular,
        cedula_ruc: cedulaRuc,
        email_titular: emailTitular
      });
      setShowForm(false);
      
      // Clear form
      setBanco('');
      setNumeroCuenta('');
      setTitular('');
      setCedulaRuc('');
      setEmailTitular('');
      
      await loadAccounts();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo guardar la cuenta bancaria');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultBankAccount(id);
      setAccounts(prev =>
        prev.map(a => ({ ...a, is_default: a.id === id }))
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo establecer como predeterminada');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Eliminar cuenta bancaria',
      '¿Estás seguro de que deseas eliminar esta cuenta bancaria?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBankAccount(id);
              setAccounts(prev => prev.filter(a => a.id !== id));
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo eliminar la cuenta bancaria');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.brand.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cuentas Bancarias</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!showForm && accounts.length < 3 && (
          <TouchableOpacity style={styles.addTrigger} onPress={() => setShowForm(true)}>
            <Ionicons name="add" size={20} color={Colors.brand.secondary} />
            <Text style={styles.addTriggerText}>Agregar Cuenta Bancaria</Text>
          </TouchableOpacity>
        )}

        {showForm && (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Nueva Cuenta de Cobro</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre del Banco (Pichincha, Guayaquil...)"
              value={banco}
              onChangeText={setBanco}
            />

            <Text style={styles.formLabel}>Tipo de Cuenta</Text>
            <View style={styles.typeRow}>
              <TouchableOpacity
                style={[styles.typeBtn, tipoCuenta === 'Ahorros' && styles.typeBtnSelected]}
                onPress={() => setTipoCuenta('Ahorros')}
              >
                <Text style={[styles.typeBtnText, tipoCuenta === 'Ahorros' && styles.typeBtnTextSelected]}>Ahorros</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.typeBtn, tipoCuenta === 'Corriente' && styles.typeBtnSelected]}
                onPress={() => setTipoCuenta('Corriente')}
              >
                <Text style={[styles.typeBtnText, tipoCuenta === 'Corriente' && styles.typeBtnTextSelected]}>Corriente</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Número de Cuenta"
              keyboardType="numeric"
              value={numeroCuenta}
              onChangeText={setNumeroCuenta}
            />
            <TextInput
              style={styles.input}
              placeholder="Nombre del Titular"
              value={titular}
              onChangeText={setTitular}
            />
            <TextInput
              style={styles.input}
              placeholder="Cédula o RUC del Titular"
              keyboardType="numeric"
              value={cedulaRuc}
              onChangeText={setCedulaRuc}
            />
            <TextInput
              style={styles.input}
              placeholder="Email del Titular"
              keyboardType="email-address"
              autoCapitalize="none"
              value={emailTitular}
              onChangeText={setEmailTitular}
            />

            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.saveBtn, submitting && styles.disabledBtn]}
                onPress={handleSave}
                disabled={submitting}
              >
                {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveBtnText}>Guardar</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={Colors.brand.secondary} style={{ marginTop: 40 }} />
        ) : accounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="card-outline" size={48} color={Colors.brand.muted} />
            <Text style={styles.emptyText}>No tienes cuentas bancarias guardadas.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {accounts.map(acc => (
              <View key={acc.id} style={[styles.itemCard, acc.is_default && styles.itemCardDefault]}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemBank}>{acc.banco}</Text>
                  {acc.is_default && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>Principal</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.itemNumber}>{acc.tipo_cuenta}: {acc.numero_cuenta}</Text>
                <Text style={styles.itemSubText}>Titular: {acc.titular}</Text>
                <Text style={styles.itemSubText}>CI/RUC: {acc.cedula_ruc}</Text>
                <Text style={styles.itemSubText}>Email: {acc.email_titular}</Text>

                <View style={styles.itemActions}>
                  {!acc.is_default && (
                    <TouchableOpacity style={styles.actionLink} onPress={() => handleSetDefault(acc.id)}>
                      <Text style={styles.actionLinkText}>Establecer como principal</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.deleteLink} onPress={() => handleDelete(acc.id)}>
                    <Ionicons name="trash-outline" size={18} color={Colors.brand.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  addTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    height: 52,
    marginBottom: 16,
  },
  addTriggerText: {
    fontSize: 15,
    fontWeight: '750',
    color: Colors.brand.secondary,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    gap: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.brand.secondary,
    marginBottom: 4,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.brand.muted,
    textTransform: 'uppercase',
  },
  typeRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  typeBtn: {
    flex: 1,
    height: 40,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeBtnSelected: {
    borderColor: Colors.brand.secondary,
    backgroundColor: 'rgba(30, 58, 138, 0.05)',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.muted,
  },
  typeBtnTextSelected: {
    color: Colors.brand.secondary,
    fontWeight: '800',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: Colors.brand.dark,
    fontWeight: '600',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: Colors.brand.secondary,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: Colors.brand.muted,
    fontWeight: '700',
  },
  list: {
    gap: 16,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  itemCardDefault: {
    borderColor: Colors.brand.secondary,
    borderWidth: 1.5,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemBank: {
    fontSize: 15,
    fontWeight: '850',
    color: Colors.brand.secondary,
    textTransform: 'uppercase',
  },
  defaultBadge: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.brand.secondary,
    textTransform: 'uppercase',
  },
  itemNumber: {
    fontSize: 15,
    fontWeight: '900',
    color: Colors.brand.dark,
    marginVertical: 4,
  },
  itemSubText: {
    fontSize: 12,
    color: Colors.brand.muted,
    fontWeight: '550',
    marginBottom: 2,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 12,
    marginTop: 12,
  },
  actionLink: {
    paddingVertical: 4,
  },
  actionLinkText: {
    fontSize: 13,
    color: Colors.brand.accent,
    fontWeight: '750',
  },
  deleteLink: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.brand.muted,
    marginTop: 8,
    fontWeight: '600',
  },
});
