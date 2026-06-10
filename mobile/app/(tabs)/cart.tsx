import React from 'react';
import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../../src/context/CartContext';
import { Colors } from '../../src/constants/theme';
import { getImageUrl } from '../../src/api/client';

export default function CartScreen() {
  const router = useRouter();
  const { cartItems, totalPrice, loading, updateQuantity, removeFromCart, clearCart } = useCart();

  const handleUpdateQuantity = async (itemId: string, currentQty: number, change: number, stock: number = 99) => {
    const nextQty = currentQty + change;
    if (nextQty < 1) {
      handleRemoveItem(itemId);
      return;
    }
    if (nextQty > stock) {
      Alert.alert('Límite alcanzado', `Lo sentimos, solo hay ${stock} unidades disponibles.`);
      return;
    }
    try {
      await updateQuantity(itemId, nextQty);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo actualizar la cantidad');
    }
  };

  const handleRemoveItem = (itemId: string) => {
    Alert.alert(
      'Quitar producto',
      '¿Estás seguro de que quieres quitar este artículo del carrito?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Quitar', style: 'destructive', onPress: () => removeFromCart(itemId) }
      ]
    );
  };

  const handleClearCart = () => {
    Alert.alert(
      'Vaciar carrito',
      '¿Estás seguro de que quieres quitar todos los artículos?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Vaciar', style: 'destructive', onPress: () => clearCart() }
      ]
    );
  };

  const renderCartItem = ({ item }: { item: any }) => {
    const imageUrl = getImageUrl(item.image_url) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200';
    return (
      <View style={styles.card}>
        <Image source={{ uri: imageUrl }} style={styles.itemImage} />
        <View style={{ flex: 1, paddingLeft: 12 }}>
          <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.itemPrice}>${item.price.toFixed(2)}</Text>
          
          <View style={styles.actionRow}>
            <View style={styles.qtyContainer}>
              <TouchableOpacity
                onPress={() => handleUpdateQuantity(item.id, item.quantity, -1, item.stock)}
                style={styles.qtyBtn}
              >
                <Ionicons name="remove" size={16} color={Colors.brand.secondary} />
              </TouchableOpacity>
              <Text style={styles.qtyText}>{item.quantity}</Text>
              <TouchableOpacity
                onPress={() => handleUpdateQuantity(item.id, item.quantity, 1, item.stock)}
                style={styles.qtyBtn}
              >
                <Ionicons name="add" size={16} color={Colors.brand.secondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => handleRemoveItem(item.id)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={20} color={Colors.brand.error} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="cart-outline" size={64} color={Colors.brand.muted} />
        <Text style={styles.emptyTitle}>Tu carrito está vacío</Text>
        <Text style={styles.emptySubtitle}>Agrega productos desde la pestaña de inicio para comenzar.</Text>
        <TouchableOpacity
          style={styles.exploreBtn}
          onPress={() => router.push('/(tabs)/' as any)}
        >
          <Text style={styles.exploreBtnText}>Explorar Productos</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Carrito</Text>
        <TouchableOpacity onPress={handleClearCart}>
          <Text style={styles.clearText}>Vaciar todo</Text>
        </TouchableOpacity>
      </View>

      {/* Cart Items List */}
      <FlatList
        data={cartItems}
        keyExtractor={(item) => item.id}
        renderItem={renderCartItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Order Summary & Checkout Footer */}
      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total a pagar</Text>
          <Text style={styles.totalAmount}>${totalPrice.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={styles.checkoutBtn}
          onPress={() => router.push('/checkout')}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Text style={styles.checkoutBtnText}>Proceder al Pago</Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.brand.secondary,
  },
  clearText: {
    color: Colors.brand.error,
    fontWeight: '700',
    fontSize: 14,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 12,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 16,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.brand.secondary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.brand.accent,
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 4,
  },
  qtyBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brand.dark,
    marginHorizontal: 12,
  },
  deleteBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  footer: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 20,
    paddingBottom: 30,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.brand.muted,
  },
  totalAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.brand.secondary,
  },
  checkoutBtn: {
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
  },
  checkoutBtnText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
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
    marginBottom: 28,
  },
  exploreBtn: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  exploreBtnText: {
    color: Colors.brand.secondary,
    fontWeight: '800',
    fontSize: 15,
  },
});
