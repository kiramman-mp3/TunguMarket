import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getWalletStats } from '../../src/api/endpoints';
import { Colors } from '../../src/constants/theme';

export default function WalletScreen() {
  const router = useRouter();

  const [wallet, setWallet] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWallet = async () => {
    try {
      setLoading(true);
      const res = await getWalletStats();
      // res contains { balance, transactions }
      setWallet(res);
      setTransactions(res.transactions || []);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo cargar el estado de tu billetera');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'earning':
        return 'Ganancia por Venta';
      case 'withdrawal':
        return 'Retiro de Saldo';
      case 'refund':
        return 'Reembolso';
      case 'debt_commission':
        return 'Comisión por Efectivo';
      case 'debt_payment':
        return 'Pago de Deuda';
      default:
        return 'Transacción';
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (type === 'withdrawal' || type === 'debt_commission' || amount < 0) {
      return Colors.brand.error;
    }
    return Colors.brand.success;
  };

  const renderTransactionItem = ({ item }: { item: any }) => {
    const formattedDate = new Date(item.created_at).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    const amountVal = parseFloat(item.amount);
    const isNegative = amountVal < 0;
    const color = getTransactionColor(item.type, amountVal);

    return (
      <View style={styles.txCard}>
        <View style={styles.txHeader}>
          <View style={styles.txHeaderLeft}>
            <Ionicons
              name={isNegative ? 'arrow-down-circle-outline' : 'arrow-up-circle-outline'}
              size={24}
              color={color}
            />
            <Text style={styles.txType}>{getTransactionTypeLabel(item.type)}</Text>
          </View>
          <Text style={[styles.txAmount, { color }]}>
            {isNegative ? '' : '+'}${Math.abs(amountVal).toFixed(2)}
          </Text>
        </View>
        
        <Text style={styles.txDesc}>{item.description}</Text>
        <View style={styles.txFooter}>
          <Text style={styles.txDate}>{formattedDate}</Text>
          <Text style={styles.txStatus}>{item.status}</Text>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.brand.secondary} />
      </View>
    );
  }

  const balance = wallet ? parseFloat(wallet.balance || 0) : 0;
  const isDebtBlocked = wallet?.blocked_for_debt || (balance < 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.brand.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mi Billetera</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Balance Panel */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Saldo Disponible</Text>
        <Text style={[styles.balanceValue, balance < 0 && { color: Colors.brand.error }]}>
          ${balance.toFixed(2)}
        </Text>
        
        {isDebtBlocked && (
          <View style={styles.debtAlert}>
            <Ionicons name="alert-circle" size={18} color="#ffffff" />
            <Text style={styles.debtAlertText}>
              Cuenta bloqueada por saldo negativo. Transfiere la deuda a la cuenta de TunguMarket y sube el comprobante para habilitar tu cuenta.
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.withdrawBtn, balance <= 0 && styles.disabledBtn]}
          disabled={balance <= 0}
          onPress={() => router.push('/profile/withdrawals')}
        >
          <Text style={styles.withdrawBtnText}>Solicitar Retiro Bancario</Text>
          <Ionicons name="cash-outline" size={20} color={Colors.brand.secondary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Historial de Movimientos</Text>

      {transactions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="swap-vertical-outline" size={48} color={Colors.brand.muted} />
          <Text style={styles.emptyText}>Aún no has tenido transacciones en tu cuenta.</Text>
        </View>
      ) : (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransactionItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await fetchWallet();
            setRefreshing(false);
          }}
        />
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
  balanceCard: {
    backgroundColor: Colors.brand.secondary,
    marginHorizontal: 20,
    borderRadius: 28,
    padding: 24,
    marginBottom: 24,
    shadowColor: Colors.brand.secondary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  balanceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
    opacity: 0.7,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 16,
  },
  debtAlert: {
    flexDirection: 'row',
    backgroundColor: Colors.brand.error,
    borderRadius: 16,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  debtAlertText: {
    flex: 1,
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '700',
    lineHeight: 16,
  },
  withdrawBtn: {
    backgroundColor: Colors.brand.primary,
    borderRadius: 16,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  disabledBtn: {
    opacity: 0.5,
    backgroundColor: '#cbd5e1',
  },
  withdrawBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.brand.secondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.brand.secondary,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  txCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  txHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  txType: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.brand.secondary,
  },
  txAmount: {
    fontSize: 16,
    fontWeight: '900',
  },
  txDesc: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '550',
    marginBottom: 10,
  },
  txFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  txDate: {
    fontSize: 11,
    color: Colors.brand.muted,
    fontWeight: '500',
  },
  txStatus: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.brand.muted,
    textTransform: 'uppercase',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.brand.muted,
    textAlign: 'center',
    fontWeight: '600',
  },
});
