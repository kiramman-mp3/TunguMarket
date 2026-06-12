import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getWishlist, toggleWishlist } from '../../src/api/endpoints';
import { Colors } from '../../src/constants/theme';
import { getImageUrl } from '../../src/api/client';

export default function WishlistScreen() {
  const router = useRouter();

  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const res = await getWishlist();
      setFavorites(res.wishlist || res.data || []);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo cargar la lista de favoritos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, []);

  const handleRemoveFavorite = async (productId: string) => {
    try {
      await toggleWishlist(productId);
      setFavorites(prev => prev.filter(item => item.product_id !== productId));
    } catch (err: any) {
      console.error(err);
    }
  };

  const renderFavItem = ({ item }: { item: any }) => {
    const rawImageUrl = item.image_url || item.primary_image;
    const imageUrl = getImageUrl(rawImageUrl) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200';
    return (
      <View style={styles.card}>
        <TouchableOpacity
          style={styles.cardClickable}
          onPress={() => router.push(`/product/${item.product_id}` as any)}
        >
          <Image source={{ uri: imageUrl }} style={styles.itemImage} />
          <View style={styles.itemMeta}>
            <Text style={styles.itemTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.itemPrice}>${parseFloat(item.price).toFixed(2)}</Text>
            <Text style={styles.itemVendor} numberOfLines={1}>Por: {item.seller_name || 'Vendedor local'}</Text>
          </View>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => handleRemoveFavorite(item.product_id)}
        >
          <Ionicons name="heart" size={24} color={Colors.brand.error} />
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Mis Favoritos</Text>
        <View style={{ width: 40 }} />
      </View>

      {favorites.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="heart-outline" size={64} color={Colors.brand.muted} />
          <Text style={styles.emptyTitle}>Sin favoritos</Text>
          <Text style={styles.emptySubtitle}>Los artículos que guardes como favoritos aparecerán aquí.</Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => router.replace('/(tabs)/' as any)}
          >
            <Text style={styles.shopBtnText}>Explorar Tienda</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.product_id || item.id}
          renderItem={renderFavItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await fetchWishlist();
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
  cardClickable: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 14,
  },
  itemMeta: {
    flex: 1,
    marginLeft: 12,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.brand.secondary,
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.brand.dark,
    marginBottom: 2,
  },
  itemVendor: {
    fontSize: 11,
    color: Colors.brand.muted,
    fontWeight: '500',
  },
  removeBtn: {
    padding: 8,
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
});
