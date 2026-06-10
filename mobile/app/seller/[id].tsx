import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getSellerInfo, getSellerProducts } from '../../src/api/endpoints';
import { Colors } from '../../src/constants/theme';
import { getImageUrl } from '../../src/api/client';

export default function SellerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [seller, setSeller] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        setLoading(true);
        const [infoRes, prodRes] = await Promise.all([
          getSellerInfo(id),
          getSellerProducts(id, 1, 50)
        ]);
        setSeller(infoRes.data);
        setProducts(prodRes.products || prodRes.data || []);
      } catch (err: any) {
        Alert.alert('Error', err.message || 'No se pudo cargar la información del vendedor');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      fetchSellerData();
    }
  }, [id]);

  const renderProductItem = ({ item }: { item: any }) => {
    const rawImageUrl = item.primary_image || item.image_url || (item.images && item.images[0]?.image_url) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400';
    const imageUrl = getImageUrl(rawImageUrl);
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => router.push(`/product/${item.id}` as any)}
      >
        <Image source={{ uri: imageUrl }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.price}>${parseFloat(item.price).toFixed(2)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading || !seller) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.brand.secondary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.brand.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vendedor</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Seller info card */}
      <View style={styles.sellerHeaderCard}>
        <Image
          source={{ uri: getImageUrl(seller.avatar_url) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150' }}
          style={styles.avatar}
        />
        <Text style={styles.sellerName}>{seller.seller_name || seller.name}</Text>
        <Text style={styles.sellerBio}>
          {seller.seller_bio || 'Este vendedor no tiene biografía.'}
        </Text>
        <View style={styles.ratingRow}>
          <Ionicons name="star" size={16} color={Colors.brand.primary} />
          <Text style={styles.ratingText}>
            {seller.average_rating > 0 ? parseFloat(seller.average_rating).toFixed(1) : 'Sin valoraciones'}
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Productos de este vendedor</Text>

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="sad-outline" size={48} color={Colors.brand.muted} />
          <Text style={styles.emptyText}>El vendedor no tiene productos publicados.</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProductItem}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
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
  sellerHeaderCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 3,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.brand.secondary,
    marginBottom: 6,
  },
  sellerBio: {
    fontSize: 13,
    color: Colors.brand.muted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 12,
    paddingHorizontal: 10,
    fontWeight: '500',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.brand.dark,
    marginLeft: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.brand.secondary,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  row: {
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    width: '48%',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  cardImage: {
    width: '100%',
    height: 120,
  },
  cardContent: {
    padding: 12,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brand.secondary,
    marginBottom: 4,
  },
  price: {
    fontSize: 16,
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
    paddingTop: 40,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.brand.muted,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
});
