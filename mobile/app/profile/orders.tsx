import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getMyOrders, createReview } from '../../src/api/endpoints';
import { Colors } from '../../src/constants/theme';
import { getImageUrl } from '../../src/api/client';

export default function BuyerOrdersScreen() {
  const router = useRouter();

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await getMyOrders();
      setOrders(res.orders || res.data || []);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudieron cargar tus pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOpenReview = (productId: string) => {
    setSelectedProductId(productId);
    setReviewRating(5);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedProductId) return;
    try {
      setReviewSubmitting(true);
      await createReview(selectedProductId, reviewRating, reviewComment);
      Alert.alert('¡Gracias!', 'Tu reseña ha sido publicada con éxito.');
      setShowReviewModal(false);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo publicar la reseña. ¿Tal vez ya calificaste este producto?');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmado':
      case 'pagado':
        return Colors.brand.success;
      case 'pendiente':
        return Colors.brand.primary;
      case 'envío completado':
      case 'entregado':
        return Colors.brand.secondary;
      case 'pago_rechazado':
      case 'cancelado':
        return Colors.brand.error;
      default:
        return Colors.brand.muted;
    }
  };

  const renderOrderItem = ({ item }: { item: any }) => {
    const formattedDate = new Date(item.created_at).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderId}>Pedido #{item.id.substring(0, 8)}</Text>
            <Text style={styles.orderDate}>{formattedDate}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status}
            </Text>
          </View>
        </View>

        {/* List of items inside this order */}
        <View style={styles.itemsList}>
          {(item.items || []).map((subItem: any, idx: number) => {
            const imageUrl = getImageUrl(subItem.image_url) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=100';
            return (
              <View key={idx} style={styles.productRow}>
                <Image source={{ uri: imageUrl }} style={styles.productImage} />
                <View style={styles.productMeta}>
                  <Text style={styles.productTitle} numberOfLines={1}>{subItem.title}</Text>
                  <Text style={styles.productQty}>Cant: {subItem.quantity} | ${parseFloat(subItem.price_at_purchase).toFixed(2)} c/u</Text>
                </View>
                {item.status.toLowerCase() === 'envío completado' && (
                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() => handleOpenReview(subItem.product_id)}
                  >
                    <Text style={styles.reviewBtnText}>Calificar</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.orderFooter}>
          <Text style={styles.totalLabel}>Total del Pedido:</Text>
          <Text style={styles.totalValue}>${parseFloat(item.total_price).toFixed(2)}</Text>
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
        <Text style={styles.headerTitle}>Mis Compras</Text>
        <View style={{ width: 40 }} />
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={64} color={Colors.brand.muted} />
          <Text style={styles.emptyTitle}>Sin compras</Text>
          <Text style={styles.emptySubtitle}>Aún no has realizado ninguna compra en TunguMarket.</Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => router.replace('/(tabs)/' as any)}
          >
            <Text style={styles.shopBtnText}>Explorar Tienda</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await fetchOrders();
            setRefreshing(false);
          }}
        />
      )}

      {/* Leave Review Modal */}
      {showReviewModal && (
        <Modal transparent visible={showReviewModal} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Calificar Producto</Text>
                <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                  <Ionicons name="close" size={24} color={Colors.brand.dark} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSubtitle}>¿Cuántas estrellas le das a este producto?</Text>
              
              {/* Star selector */}
              <View style={styles.starsSelectorRow}>
                {[1, 2, 3, 4, 5].map(star => (
                  <TouchableOpacity key={star} onPress={() => setReviewRating(star)}>
                    <Ionicons
                      name={star <= reviewRating ? 'star' : 'star-outline'}
                      size={40}
                      color={Colors.brand.primary}
                      style={{ marginHorizontal: 6 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.modalSubtitle}>Comentario (Opcional):</Text>
              <TextInput
                style={styles.reviewInput}
                placeholder="Escribe tu opinión sobre el producto (calidad, sabor, tiempo de entrega)..."
                placeholderTextColor={Colors.brand.muted}
                multiline
                numberOfLines={3}
                value={reviewComment}
                onChangeText={setReviewComment}
              />

              <TouchableOpacity
                style={[styles.submitReviewBtn, reviewSubmitting && styles.disabledBtn]}
                onPress={handleSubmitReview}
                disabled={reviewSubmitting}
              >
                {reviewSubmitting ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.submitReviewBtnText}>Enviar Calificación</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  orderCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    paddingBottom: 12,
    marginBottom: 12,
  },
  orderId: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.brand.secondary,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.brand.muted,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  itemsList: {
    gap: 12,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productImage: {
    width: 46,
    height: 46,
    borderRadius: 10,
  },
  productMeta: {
    flex: 1,
    marginLeft: 10,
  },
  productTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  productQty: {
    fontSize: 11,
    color: Colors.brand.muted,
    fontWeight: '500',
    marginTop: 2,
  },
  reviewBtn: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  reviewBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.brand.secondary,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 12,
    marginTop: 12,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.brand.muted,
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '900',
    color: Colors.brand.dark,
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
    marginBottom: 24,
  },
  shopBtn: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  shopBtnText: {
    color: Colors.brand.secondary,
    fontWeight: '800',
    fontSize: 15,
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
  modalSubtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brand.dark,
    marginBottom: 10,
  },
  starsSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  reviewInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 12,
    fontSize: 14,
    color: Colors.brand.dark,
    height: 90,
    textAlignVertical: 'top',
    fontWeight: '600',
    marginBottom: 20,
  },
  submitReviewBtn: {
    backgroundColor: Colors.brand.secondary,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledBtn: {
    opacity: 0.5,
  },
  submitReviewBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
});
