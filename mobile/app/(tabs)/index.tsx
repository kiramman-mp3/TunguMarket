import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAllProducts, getCategories, searchProducts } from '../../src/api/endpoints';
import { Colors } from '../../src/constants/theme';
import { useCart } from '../../src/context/CartContext';
import { getImageUrl } from '../../src/api/client';
import { useAuth } from '../../src/context/AuthContext';

export default function ExploreScreen() {
  const router = useRouter();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async (catId: string | null = null, query = '') => {
    try {
      setLoading(true);
      let prodData;
      if (query.trim()) {
        prodData = await searchProducts({ q: query, categoryId: catId || undefined });
      } else {
        prodData = await getAllProducts(1, 100, catId);
      }
      setProducts(prodData.products || prodData.data?.products || (Array.isArray(prodData.data) ? prodData.data : []));
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCategories = async () => {
    try {
      const catData = await getCategories();
      setCategories([{ id: 'all', name: 'Todos' }, ...(catData.categories || catData.data || [])]);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  useEffect(() => {
    loadCategories();
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadCategories(), fetchData(selectedCategory, searchQuery)]);
    setRefreshing(false);
  };

  const handleCategorySelect = (catId: string) => {
    const activeId = catId === 'all' ? null : catId;
    setSelectedCategory(activeId);
    fetchData(activeId, searchQuery);
  };

  const handleSearchSubmit = () => {
    fetchData(selectedCategory, searchQuery);
  };

  const handleAddToCart = async (product: any) => {
    try {
      await addToCart(product, 1);
    } catch (err: any) {
      alert(err.message || 'Inicia sesión para agregar al carrito');
    }
  };

  const renderProductItem = ({ item }: { item: any }) => {
    // Resolve primary image URL
    const rawImageUrl = item.primary_image || item.image_url || (item.images && item.images.find((img: any) => img.is_primary)?.image_url) || (item.images && item.images[0]?.image_url) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400';
    const imageUrl = getImageUrl(rawImageUrl);
    const isMyProduct = user && item.seller_id === user.id;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.9}
        onPress={() => router.push(`/product/${item.id}` as any)}
      >
        <Image source={{ uri: imageUrl }} style={styles.cardImage} />
        {item.is_flagged && (
          <View style={styles.flaggedBadge}>
            <Text style={styles.flaggedText}>Bloqueado</Text>
          </View>
        )}
        {isMyProduct && (
          <View style={[styles.flaggedBadge, { backgroundColor: Colors.brand.secondary }]}>
            <Text style={styles.flaggedText}>Tu Producto</Text>
          </View>
        )}
        <View style={styles.cardContent}>
          <Text style={styles.categoryName}>{item.category_name || 'General'}</Text>
          <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.vendor} numberOfLines={1}>Vendedor: {isMyProduct ? 'Tú' : (item.seller_name || 'Tungu Seller')}</Text>
          
          <View style={styles.bottomRow}>
            <View>
              <Text style={styles.price}>${parseFloat(item.price).toFixed(2)}</Text>
              {item.average_rating > 0 && (
                <Text style={styles.rating}>⭐ {parseFloat(item.average_rating).toFixed(1)}</Text>
              )}
            </View>
            {!isMyProduct && (
              <TouchableOpacity
                style={styles.cartBtn}
                onPress={() => handleAddToCart(item)}
              >
                <Ionicons name="cart-outline" size={20} color={Colors.brand.secondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>TunguMarket</Text>
        <Text style={styles.subtitle}>Comercio local y seguro en Tungurahua</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={Colors.brand.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar artesanías, calzado, alimentos..."
          placeholderTextColor={Colors.brand.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearchSubmit}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => { setSearchQuery(''); fetchData(selectedCategory, ''); }}>
            <Ionicons name="close-circle" size={18} color={Colors.brand.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Categories Scroller */}
      <View style={styles.categoriesWrapper}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => {
            const isSelected = (item.id === 'all' && selectedCategory === null) || (selectedCategory === item.id);
            return (
              <TouchableOpacity
                style={[styles.categoryBadge, isSelected && styles.categoryBadgeSelected]}
                onPress={() => handleCategorySelect(item.id)}
              >
                <Text style={[styles.categoryText, isSelected && styles.categoryTextSelected]}>
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Products Grid */}
      {loading && !refreshing ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.brand.secondary} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="sad-outline" size={48} color={Colors.brand.muted} />
          <Text style={styles.emptyText}>No encontramos productos en esta sección.</Text>
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[Colors.brand.secondary]} />
          }
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
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.brand.secondary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.brand.muted,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 20,
    paddingHorizontal: 16,
    borderRadius: 16,
    height: 52,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.brand.dark,
    fontWeight: '600',
  },
  categoriesWrapper: {
    marginBottom: 16,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryBadge: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryBadgeSelected: {
    backgroundColor: Colors.brand.secondary,
    borderColor: Colors.brand.secondary,
  },
  categoryText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.muted,
  },
  categoryTextSelected: {
    color: '#ffffff',
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
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  cardImage: {
    width: '100%',
    height: 130,
  },
  flaggedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: Colors.brand.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  flaggedText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  cardContent: {
    padding: 12,
  },
  categoryName: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.brand.accent,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.brand.secondary,
    marginBottom: 2,
  },
  vendor: {
    fontSize: 11,
    color: Colors.brand.muted,
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.brand.dark,
  },
  rating: {
    fontSize: 10,
    color: Colors.brand.primary,
    fontWeight: '800',
    marginTop: 2,
  },
  cartBtn: {
    backgroundColor: '#f1f5f9',
    padding: 8,
    borderRadius: 12,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.brand.muted,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
});
