import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert, Dimensions, Modal, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getProductById, toggleWishlist, getProductReviews, createReview } from '../../src/api/endpoints';
import { Colors } from '../../src/constants/theme';
import { useCart } from '../../src/context/CartContext';
import { useAuth } from '../../src/context/AuthContext';
import { getImageUrl } from '../../src/api/client';

const { width } = Dimensions.get('window');

export default function ProductDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  useEffect(() => {
    const loadProductData = async () => {
      try {
        setLoading(true);
        const [prodRes, reviewsRes] = await Promise.all([
          getProductById(id),
          getProductReviews(id)
        ]);
        setProduct(prodRes.product || prodRes.data);
        
        let reviewsList: any[] = [];
        if (reviewsRes) {
          if (Array.isArray(reviewsRes)) {
            reviewsList = reviewsRes;
          } else if (Array.isArray(reviewsRes.reviews)) {
            reviewsList = reviewsRes.reviews;
          } else if (reviewsRes.data) {
            if (Array.isArray(reviewsRes.data)) {
              reviewsList = reviewsRes.data;
            } else if (Array.isArray(reviewsRes.data.reviews)) {
              reviewsList = reviewsRes.data.reviews;
            }
          }
        }
        setReviews(reviewsList);
        
        setIsFavorite(!!prodRes.is_in_wishlist);
      } catch (err: any) {
        Alert.alert('Error', err.message || 'No se pudo cargar el producto');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      loadProductData();
    }
  }, [id]);

  const handleOpenReviewModal = () => {
    setReviewRating(5);
    setReviewComment('');
    setShowReviewModal(true);
  };

  const reloadProductData = async () => {
    try {
      const [prodRes, reviewsRes] = await Promise.all([
        getProductById(id),
        getProductReviews(id)
      ]);
      setProduct(prodRes.product || prodRes.data);
      
      let reviewsList: any[] = [];
      if (reviewsRes) {
        if (Array.isArray(reviewsRes)) {
          reviewsList = reviewsRes;
        } else if (Array.isArray(reviewsRes.reviews)) {
          reviewsList = reviewsRes.reviews;
        } else if (reviewsRes.data) {
          if (Array.isArray(reviewsRes.data)) {
            reviewsList = reviewsRes.data;
          } else if (Array.isArray(reviewsRes.data.reviews)) {
            reviewsList = reviewsRes.data.reviews;
          }
        }
      }
      setReviews(reviewsList);
      setIsFavorite(!!prodRes.is_in_wishlist);
    } catch (err) {
      console.error('Error reloading product data:', err);
    }
  };

  const handleSubmitReview = async () => {
    if (!id) return;
    try {
      setReviewSubmitting(true);
      await createReview(id, reviewRating, reviewComment);
      Alert.alert('¡Gracias!', 'Tu reseña ha sido publicada con éxito.');
      setShowReviewModal(false);
      await reloadProductData();
    } catch (err: any) {
      Alert.alert(
        'Error', 
        err.message || 'No se pudo publicar la reseña. Asegúrate de haber completado y recibido este pedido primero.'
      );
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      Alert.alert('Inicia sesión', 'Debes iniciar sesión para guardar en favoritos.');
      return;
    }
    try {
      setFavLoading(true);
      await toggleWishlist(id);
      setIsFavorite(prev => !prev);
    } catch (err: any) {
      console.error(err);
    } finally {
      setFavLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      await addToCart(product, 1);
      Alert.alert('¡Agregado!', 'El producto ha sido añadido al carrito.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Inicia sesión para comprar');
    }
  };

  if (loading || !product) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.brand.secondary} />
      </View>
    );
  }

  const rawImageUrl = product.primary_image || product.image_url || (product.images && product.images.find((img: any) => img.is_primary)?.image_url) || (product.images && product.images[0]?.image_url) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600';
  const imageUrl = getImageUrl(rawImageUrl);
  const isMyProduct = user && product.seller_id === user.id;

  return (
    <View style={styles.container}>
      {/* Absolute Back & Fav Buttons */}
      <View style={styles.actionHeader}>
        <TouchableOpacity style={styles.iconCircle} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.brand.secondary} />
        </TouchableOpacity>

        {!isMyProduct && (
          <TouchableOpacity style={styles.iconCircle} onPress={handleToggleFavorite} disabled={favLoading}>
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? Colors.brand.error : Colors.brand.secondary}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top Product Image */}
        <Image source={{ uri: imageUrl }} style={styles.heroImage} />

        {/* Content Container */}
        <View style={styles.content}>
          {/* Category */}
          <Text style={styles.category}>{product.category_name || 'General'}</Text>
          
          {/* Title & Price */}
          <Text style={styles.title}>{product.title}</Text>
          <Text style={styles.price}>${parseFloat(product.price).toFixed(2)}</Text>

          {/* Rating & Views */}
          <View style={styles.metaRow}>
            <View style={styles.ratingBox}>
              <Ionicons name="star" size={16} color={Colors.brand.primary} />
              <Text style={styles.ratingText}>
                {product.average_rating > 0 ? parseFloat(product.average_rating).toFixed(1) : 'Sin valoraciones'}
              </Text>
              {product.review_count > 0 && (
                <Text style={styles.reviewCount}>({product.review_count} opiniones)</Text>
              )}
            </View>
            <View style={styles.viewsBox}>
              <Ionicons name="eye-outline" size={16} color={Colors.brand.muted} />
              <Text style={styles.viewsText}>{product.views || 0} visitas</Text>
            </View>
          </View>

          {/* Stock info */}
          <View style={styles.stockBox}>
            <Text style={styles.stockLabel}>Stock disponible:</Text>
            <Text style={[styles.stockValue, product.stock > 0 ? styles.stockIn : styles.stockOut]}>
              {product.stock > 0 ? `${product.stock} unidades` : 'Agotado'}
            </Text>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionTitle}>Descripción</Text>
          <Text style={styles.description}>{product.description}</Text>

          <View style={styles.divider} />

          {/* Seller details card */}
          <Text style={styles.sectionTitle}>Información del Vendedor</Text>
          <TouchableOpacity
            style={styles.sellerCard}
            onPress={() => router.push(`/seller/${product.seller_id}` as any)}
          >
            <Image
              source={{ uri: getImageUrl(product.seller_avatar) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100' }}
              style={styles.sellerAvatar}
            />
            <View style={styles.sellerInfo}>
              <Text style={styles.sellerName}>{product.seller_name || 'Vendedor TunguMarket'}</Text>
              <Text style={styles.sellerBio} numberOfLines={2}>
                {product.seller_bio || 'Este vendedor aún no ha añadido una biografía a su perfil.'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.brand.muted} />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Reviews list */}
          <View style={styles.reviewsHeaderRow}>
            <Text style={styles.sectionTitle}>Opiniones sobre el producto</Text>
            {user && product.seller_id !== user.id && (
              <TouchableOpacity onPress={handleOpenReviewModal} style={styles.writeReviewBtn}>
                <Text style={styles.writeReviewBtnText}>Escribir reseña</Text>
              </TouchableOpacity>
            )}
          </View>
          {reviews.length === 0 ? (
            <Text style={styles.noReviews}>Aún no hay opiniones de otros compradores.</Text>
          ) : (
            reviews.map((rev, index) => (
              <View key={index} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewerName}>{rev.user_name}</Text>
                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map(star => (
                      <Ionicons
                        key={star}
                        name="star"
                        size={12}
                        color={star <= rev.rating ? Colors.brand.primary : '#e2e8f0'}
                      />
                    ))}
                  </View>
                </View>
                {rev.comment && <Text style={styles.reviewComment}>{rev.comment}</Text>}
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Buy Button Footer */}
      <View style={styles.footer}>
        {isMyProduct ? (
          <View style={styles.ownProductMessage}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.brand.secondary} />
            <Text style={styles.ownProductMessageText}>
              Este es tu producto. Edítalo desde una computadora.
            </Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.buyBtn, product.stock === 0 && styles.disabledBtn]}
            onPress={handleAddToCart}
            disabled={product.stock === 0}
          >
            <Ionicons name="cart" size={22} color="#ffffff" />
            <Text style={styles.buyBtnText}>
              {product.stock > 0 ? 'Añadir al Carrito' : 'Agotado'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

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
                placeholder="Escribe tu opinión sobre el producto..."
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
    backgroundColor: '#ffffff',
  },
  actionHeader: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  heroImage: {
    width: width,
    height: width * 0.9,
    resizeMode: 'cover',
  },
  content: {
    padding: 20,
    paddingBottom: 100,
  },
  category: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.brand.accent,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.brand.secondary,
    lineHeight: 30,
    marginBottom: 8,
  },
  price: {
    fontSize: 28,
    fontWeight: '950',
    color: Colors.brand.dark,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.brand.dark,
    marginLeft: 6,
  },
  reviewCount: {
    fontSize: 12,
    color: Colors.brand.muted,
    marginLeft: 4,
    fontWeight: '600',
  },
  viewsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewsText: {
    fontSize: 12,
    color: Colors.brand.muted,
    fontWeight: '600',
  },
  stockBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 14,
  },
  stockLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.brand.muted,
  },
  stockValue: {
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },
  stockIn: {
    color: Colors.brand.success,
  },
  stockOut: {
    color: Colors.brand.error,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.brand.secondary,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
    fontWeight: '500',
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sellerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.brand.secondary,
    marginBottom: 2,
  },
  sellerBio: {
    fontSize: 12,
    color: Colors.brand.muted,
    fontWeight: '500',
  },
  noReviews: {
    fontSize: 13,
    color: Colors.brand.muted,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  reviewItem: {
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.dark,
  },
  starsRow: {
    flexDirection: 'row',
  },
  reviewComment: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
    lineHeight: 18,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 20,
    paddingBottom: 30,
  },
  buyBtn: {
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
  disabledBtn: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  buyBtnText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  reviewsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  writeReviewBtn: {
    backgroundColor: 'rgba(251, 191, 36, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  writeReviewBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.brand.secondary,
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
  submitReviewBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  ownProductMessage: {
    backgroundColor: '#f1f5f9',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ownProductMessageText: {
    color: Colors.brand.secondary,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
});
