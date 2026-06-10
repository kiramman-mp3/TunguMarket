import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { getSellerProducts, updateProductStatus, deleteProduct } from '../src/api/endpoints';
import { Colors } from '../src/constants/theme';
import { getImageUrl } from '../src/api/client';

export default function MyProductsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProducts = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await getSellerProducts(user.id, 1, 50);
      setProducts(res.products || res.data?.products || (Array.isArray(res.data) ? res.data : []));
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudieron cargar tus productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [user]);

  const handleToggleStatus = async (productId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'activo' ? 'oculto' : 'activo';
    try {
      await updateProductStatus(productId, nextStatus);
      setProducts(prev =>
        prev.map(p => (p.id === productId ? { ...p, status: nextStatus } : p))
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo actualizar el estado');
    }
  };

  const handleDeleteProduct = (productId: string) => {
    Alert.alert(
      'Eliminar producto',
      '¿Estás seguro de que quieres eliminar definitivamente este producto? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(productId);
              setProducts(prev => prev.filter(p => p.id !== productId));
              Alert.alert('Eliminado', 'El producto ha sido eliminado.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo eliminar el producto');
            }
          }
        }
      ]
    );
  };

  const renderProductItem = ({ item }: { item: any }) => {
    const rawImageUrl = item.primary_image || item.image_url || (item.images && item.images[0]?.image_url) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200';
    const imageUrl = getImageUrl(rawImageUrl);
    const isActive = item.status === 'activo';

    return (
      <View style={styles.card}>
        <Image source={{ uri: imageUrl }} style={styles.productImage} />
        <View style={styles.cardInfo}>
          <Text style={styles.productTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.productPrice}>${parseFloat(item.price).toFixed(2)}</Text>
          
          {item.is_flagged ? (
            <View style={styles.flaggedContainer}>
              <Text style={styles.flaggedLabel}>Bloqueado por moderación:</Text>
              <Text style={styles.flaggedReason}>{item.blocked_reason || 'Contenido inapropiado'}</Text>
            </View>
          ) : (
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Visibilidad:</Text>
              <Switch
                value={isActive}
                onValueChange={() => handleToggleStatus(item.id, item.status)}
                trackColor={{ false: '#cbd5e1', true: Colors.brand.primary }}
                thumbColor={isActive ? Colors.brand.secondary : '#f1f5f9'}
              />
              <Text style={[styles.statusText, isActive ? styles.statusActive : styles.statusInactive]}>
                {isActive ? 'Activo' : 'Oculto'}
              </Text>
            </View>
          )}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => router.push(`/edit-product/${item.id}` as any)}
            >
              <Ionicons name="create-outline" size={16} color={Colors.brand.secondary} />
              <Text style={styles.actionBtnText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, styles.deleteBtn]}
              onPress={() => handleDeleteProduct(item.id)}
            >
              <Ionicons name="trash-outline" size={16} color={Colors.brand.error} />
              <Text style={[styles.actionBtnText, styles.deleteBtnText]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
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
        <Text style={styles.headerTitle}>Mis Productos</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(tabs)/sell' as any)}>
          <Ionicons name="add" size={24} color={Colors.brand.secondary} />
        </TouchableOpacity>
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cube-outline" size={64} color={Colors.brand.muted} />
          <Text style={styles.emptyTitle}>Sin productos</Text>
          <Text style={styles.emptySubtitle}>Aún no has publicado ningún producto en TunguMarket.</Text>
          <TouchableOpacity
            style={styles.createBtn}
            onPress={() => router.push('/(tabs)/sell' as any)}
          >
            <Text style={styles.createBtnText}>Publicar Ahora</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await fetchProducts();
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
    paddingTop: 12,
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
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
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
  productImage: {
    width: 90,
    height: 90,
    borderRadius: 16,
  },
  cardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.brand.secondary,
    marginBottom: 2,
  },
  productPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.brand.accent,
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.brand.muted,
    fontWeight: '600',
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },
  statusActive: {
    color: Colors.brand.success,
  },
  statusInactive: {
    color: Colors.brand.muted,
  },
  flaggedContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.15)',
    borderRadius: 10,
    padding: 8,
    marginBottom: 8,
  },
  flaggedLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.brand.error,
    textTransform: 'uppercase',
  },
  flaggedReason: {
    fontSize: 11,
    color: Colors.brand.error,
    fontWeight: '600',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand.secondary,
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  deleteBtnText: {
    color: Colors.brand.error,
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
  createBtn: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 16,
  },
  createBtnText: {
    color: Colors.brand.secondary,
    fontWeight: '800',
    fontSize: 15,
  },
});
