import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getMySales, updateSaleStatus } from '../../src/api/endpoints';
import { Colors } from '../../src/constants/theme';
import { useAuth } from '../../src/context/AuthContext';
import { getImageUrl } from '../../src/api/client';

export default function SellerSalesScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await getMySales();
      setSales(res.data || []);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudieron cargar tus ventas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleConfirmDelivery = (item: any) => {
    const paymentMethod = item.payment_method || 'desconocido';
    const paymentStatus = item.payment_status;

    // VALIDACIÓN CRÍTICA: Impedir confirmar envío si la transferencia no está aprobada por el admin
    if (paymentMethod === 'transferencia' && paymentStatus !== 'aprobado') {
      Alert.alert(
        'Pago Pendiente',
        `El comprador seleccionó transferencia bancaria y el pago está en estado: ${paymentStatus || 'pendiente'}. Espera a que el administrador lo valide antes de entregar el producto.`
      );
      return;
    }

    if (paymentStatus === 'rechazado') {
      Alert.alert('Pago Rechazado', 'No puedes entregar este ítem porque el pago ha sido rechazado por el administrador.');
      return;
    }

    // Alerta de confirmación
    let message = '¿Estás seguro de que quieres marcar este producto como entregado?';
    if (paymentMethod === 'efectivo') {
      const commission = parseFloat(item.price_at_purchase) * item.quantity * 0.05;
      message = `Esta venta es en EFECTIVO. Al confirmar la entrega, se deducirá una comisión de uso del 5% ($${commission.toFixed(2)}) de tu saldo virtual. ¿Deseas continuar?`;
    }

    Alert.alert(
      'Confirmar entrega',
      message,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, entregar',
          onPress: async () => {
            try {
              setLoading(true);
              await updateSaleStatus(item.id, 'Envío completado');
              Alert.alert('¡Éxito!', 'Ítem marcado como entregado.');
              await fetchSales();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo actualizar la orden');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    return status === 'Envío completado' ? Colors.brand.success : Colors.brand.primary;
  };

  const renderSaleItem = ({ item }: { item: any }) => {
    const formattedDate = new Date(item.created_at).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
    const imageUrl = getImageUrl(item.image_url) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=100';
    const isCompleted = item.status === 'Envío completado';

    return (
      <View style={styles.saleCard}>
        <View style={styles.saleHeader}>
          <View>
            <Text style={styles.buyerLabel}>Comprador:</Text>
            <Text style={styles.buyerName}>{item.buyer_name || 'Cliente TunguMarket'}</Text>
          </View>
          <Text style={styles.saleDate}>{formattedDate}</Text>
        </View>

        <View style={styles.productRow}>
          <Image source={{ uri: imageUrl }} style={styles.productImage} />
          <View style={styles.productMeta}>
            <Text style={styles.productTitle} numberOfLines={1}>{item.product_title}</Text>
            <Text style={styles.productQty}>Cant: {item.quantity} | Total: ${(parseFloat(item.price_at_purchase) * item.quantity).toFixed(2)}</Text>
          </View>
        </View>

        <View style={styles.paymentMethodCard}>
          <View style={styles.metaBadge}>
            <Ionicons name="wallet-outline" size={14} color={Colors.brand.secondary} />
            <Text style={styles.metaBadgeText}>Pago: {item.payment_method}</Text>
          </View>
          {item.payment_method === 'transferencia' && (
            <View style={[styles.metaBadge, { backgroundColor: item.payment_status === 'aprobado' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
              <Text style={[styles.metaBadgeText, { color: item.payment_status === 'aprobado' ? Colors.brand.success : Colors.brand.error }]}>
                {item.payment_status === 'aprobado' ? 'Transferencia Aprobada' : 'Espera Aprobación'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.saleFooter}>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>

          {!isCompleted && (
            <TouchableOpacity
              style={styles.confirmBtn}
              onPress={() => handleConfirmDelivery(item)}
            >
              <Text style={styles.confirmBtnText}>Confirmar Entrega</Text>
            </TouchableOpacity>
          )}
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.brand.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Ventas</Text>
        <View style={{ width: 40 }} />
      </View>

      {sales.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={64} color={Colors.brand.muted} />
          <Text style={styles.emptyTitle}>Sin ventas</Text>
          <Text style={styles.emptySubtitle}>Aún no has recibido ningún pedido de compradores.</Text>
        </View>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => item.id}
          renderItem={renderSaleItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await fetchSales();
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
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  saleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  saleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    paddingBottom: 10,
    marginBottom: 10,
  },
  buyerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.brand.muted,
    textTransform: 'uppercase',
  },
  buyerName: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.brand.secondary,
  },
  saleDate: {
    fontSize: 11,
    color: Colors.brand.muted,
    fontWeight: '600',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  productMeta: {
    flex: 1,
    marginLeft: 12,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  productQty: {
    fontSize: 11,
    color: Colors.brand.muted,
    fontWeight: '550',
    marginTop: 2,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  metaBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.brand.secondary,
    textTransform: 'uppercase',
  },
  saleFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 12,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '850',
    textTransform: 'uppercase',
  },
  confirmBtn: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  confirmBtnText: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.brand.secondary,
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
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.brand.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.brand.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
});
