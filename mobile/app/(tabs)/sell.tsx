import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Alert, 
  Image, 
  KeyboardAvoidingView, 
  Platform, 
  Switch, 
  FlatList 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/context/AuthContext';
import { 
  createProduct, 
  getCategories, 
  getSellerProducts, 
  updateProductStatus, 
  deleteProduct 
} from '../../src/api/endpoints';
import { Colors } from '../../src/constants/theme';
import { getImageUrl } from '../../src/api/client';

export default function SellScreen() {
  const router = useRouter();
  const { user } = useAuth();
  
  // Dashboard states
  const [showForm, setShowForm] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  
  const [images, setImages] = useState<string[]>([]); // Array of image URIs
  const [loading, setLoading] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  // Load seller's products
  const fetchProducts = async () => {
    if (!user) return;
    try {
      setProductsLoading(true);
      const res = await getSellerProducts(user.id, 1, 50);
      setProducts(res.products || res.data?.products || (Array.isArray(res.data) ? res.data : []));
    } catch (err: any) {
      console.error('Error fetching seller products:', err);
    } finally {
      setProductsLoading(false);
    }
  };

  // Load categories and products
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await getCategories();
        setCategories(response.categories || response.data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    if (user) {
      loadCategories();
      fetchProducts();
    }
  }, [user]);

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="lock-closed-outline" size={64} color={Colors.brand.muted} />
        <Text style={styles.centerTitle}>Inicia sesión</Text>
        <Text style={styles.centerSubtitle}>Debes ingresar a tu cuenta para publicar productos en TunguMarket.</Text>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push('/(auth)/login' as any)}
        >
          <Text style={styles.actionBtnText}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Business Rule: Check if seller is blocked for debt
  if (user.blocked_for_debt) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="ban-outline" size={64} color={Colors.brand.error} />
        <Text style={[styles.centerTitle, { color: Colors.brand.error }]}>Cuenta Bloqueada</Text>
        <Text style={styles.centerSubtitle}>
          Has sido bloqueado por comisiones de venta impagas (saldo negativo). Por favor salda tus deudas desde tu billetera para volver a publicar.
        </Text>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: Colors.brand.secondary }]}
          onPress={() => router.push('/profile/wallet' as any)}
        >
          <Text style={[styles.actionBtnText, { color: '#ffffff' }]}>Ver mi Billetera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handlePickImage = async () => {
    if (images.length >= 5) {
      Alert.alert('Límite alcanzado', 'Puedes subir un máximo de 5 imágenes.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso a tus fotos para publicar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: 5 - images.length,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const selectedUris = result.assets.map(asset => asset.uri);
      setImages(prev => [...prev, ...selectedUris].slice(0, 5));
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

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

  const handleSubmit = async () => {
    if (!title || !description || !price || !stock || !categoryId) {
      Alert.alert('Campos incompletos', 'Por favor llena todos los campos obligatorios.');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Imágenes requeridas', 'Por favor selecciona al menos una imagen para tu producto.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', String(parseFloat(price)));
      formData.append('stock', String(parseInt(stock, 10)));
      formData.append('category_id', categoryId);

      images.forEach((uri, index) => {
        const filename = uri.split('/').pop() || `image_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('images', {
          uri,
          name: filename,
          type,
        } as any);
      });

      await createProduct(formData);

      // Reset form fields
      setTitle('');
      setDescription('');
      setPrice('');
      setStock('1');
      setCategoryId('');
      setImages([]);

      Alert.alert(
        '¡Producto enviado!',
        'Tu producto ha sido creado con éxito. Será revisado y aprobado por un administrador antes de ser visible en el catálogo de la tienda.',
        [{ 
          text: 'OK', 
          onPress: () => {
            setShowForm(false);
            fetchProducts();
          } 
        }]
      );
    } catch (err: any) {
      Alert.alert('Error al publicar', err.message || 'Ocurrió un error al crear tu producto.');
    } finally {
      setLoading(false);
    }
  };

  const selectedCategoryName = categories.find(c => c.id === categoryId)?.name || 'Selecciona una categoría';

  // Render a product in the seller dashboard
  const renderProductItem = ({ item }: { item: any }) => {
    const rawImageUrl = item.primary_image || item.image_url || (item.images && item.images[0]?.image_url) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=200';
    const imageUrl = getImageUrl(rawImageUrl);
    const isActive = item.status === 'activo';
    const isPending = item.status === 'pendiente';
    const isFlagged = item.is_flagged;

    return (
      <View style={styles.productCard}>
        <Image source={{ uri: imageUrl }} style={styles.productImage} />
        <View style={styles.productCardInfo}>
          <Text style={styles.productCardTitle} numberOfLines={1}>{item.title}</Text>
          <Text style={styles.productCardPrice}>${parseFloat(item.price).toFixed(2)}</Text>
          
          {isFlagged ? (
            <View style={styles.statusBadgeRed}>
              <Ionicons name="alert-circle-outline" size={12} color={Colors.brand.error} />
              <Text style={styles.statusBadgeTextRed}>Bloqueado: {item.blocked_reason || 'Moderado'}</Text>
            </View>
          ) : isPending ? (
            <View style={styles.statusBadgeAmber}>
              <Ionicons name="time-outline" size={12} color={Colors.brand.accent} />
              <Text style={styles.statusBadgeTextAmber}>Pendiente Aprobación</Text>
            </View>
          ) : (
            <View style={styles.visibilityRow}>
              <Text style={styles.visibilityLabel}>Visibilidad:</Text>
              <Switch
                value={isActive}
                onValueChange={() => handleToggleStatus(item.id, item.status)}
                trackColor={{ false: '#cbd5e1', true: Colors.brand.primary }}
                thumbColor={isActive ? Colors.brand.secondary : '#f1f5f9'}
              />
              <Text style={[styles.visibilityText, isActive ? styles.visibilityActive : styles.visibilityInactive]}>
                {isActive ? 'Activo' : 'Oculto'}
              </Text>
            </View>
          )}

          <View style={styles.productCardActions}>
            <TouchableOpacity
              style={styles.productActionBtn}
              onPress={() => router.push(`/edit-product/${item.id}` as any)}
            >
              <Ionicons name="create-outline" size={14} color={Colors.brand.secondary} />
              <Text style={styles.productActionBtnText}>Editar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.productActionBtn, styles.deleteProductBtn]}
              onPress={() => handleDeleteProduct(item.id)}
            >
              <Ionicons name="trash-outline" size={14} color={Colors.brand.error} />
              <Text style={[styles.productActionBtnText, styles.deleteProductBtnText]}>Eliminar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // RENDER SELLER DASHBOARD VIEW
  if (!showForm) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.dashboardHeader}>
          <View>
            <Text style={styles.dashboardTitle}>Mi Tienda</Text>
            <Text style={styles.dashboardSubtitle}>Gestiona tus publicaciones locales</Text>
          </View>
          <TouchableOpacity 
            style={styles.publishBtn}
            onPress={() => setShowForm(true)}
          >
            <Ionicons name="add" size={22} color={Colors.brand.secondary} />
            <Text style={styles.publishBtnText}>Vender</Text>
          </TouchableOpacity>
        </View>

        {productsLoading && !refreshing ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={Colors.brand.secondary} />
          </View>
        ) : products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cube-outline" size={72} color={Colors.brand.muted} style={{ marginBottom: 16 }} />
            <Text style={styles.emptyTitle}>Sin productos publicados</Text>
            <Text style={styles.emptySubtitle}>Empieza a vender en TunguMarket agregando tu primer producto.</Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => setShowForm(true)}
            >
              <Text style={styles.emptyAddBtnText}>Publicar mi primer producto</Text>
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

  // RENDER PUBLISHING FORM VIEW
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.formHeader}>
        <TouchableOpacity style={styles.backBtn} onPress={() => setShowForm(false)}>
          <Ionicons name="arrow-back" size={22} color={Colors.brand.secondary} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.formTitleText}>Nuevo Producto</Text>
          <Text style={styles.subtitle}>Detalla la información de tu publicación</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Form Inputs */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Título del Producto *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Pan de Pinllo Tradicional"
              placeholderTextColor={Colors.brand.muted}
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 12 }]}>
              <Text style={styles.label}>Precio (USD) *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={Colors.brand.muted}
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>
            <View style={[styles.formGroup, { flex: 1 }]}>
              <Text style={styles.label}>Stock *</Text>
              <TextInput
                style={styles.input}
                placeholder="1"
                placeholderTextColor={Colors.brand.muted}
                keyboardType="numeric"
                value={stock}
                onChangeText={setStock}
              />
            </View>
          </View>

          {/* Category Picker */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Categoría *</Text>
            <TouchableOpacity
              style={styles.pickerTrigger}
              onPress={() => setShowCategoryModal(true)}
            >
              <Text style={styles.pickerText}>{selectedCategoryName}</Text>
              <Ionicons name="chevron-down" size={20} color={Colors.brand.muted} />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Descripción *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe las características de tu producto (material, ingredientes, tamaño)..."
              placeholderTextColor={Colors.brand.muted}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Images Picker */}
          <View style={styles.formGroup}>
            <View style={styles.imageHeader}>
              <Text style={styles.label}>Imágenes del Producto *</Text>
              <Text style={styles.imageCount}>{images.length}/5</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroller}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.pickedImage} />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => handleRemoveImage(index)}
                  >
                    <Ionicons name="close" size={16} color="#ffffff" />
                  </TouchableOpacity>
                  {index === 0 && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Principal</Text>
                    </View>
                  )}
                </View>
              ))}

              {images.length < 5 && (
                <TouchableOpacity style={styles.addImageBtn} onPress={handlePickImage}>
                  <Ionicons name="camera-outline" size={32} color={Colors.brand.muted} />
                  <Text style={styles.addImageText}>Añadir</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Submit button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.disabledBtn]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Ionicons name="cloud-upload-outline" size={22} color="#ffffff" />
                <Text style={styles.submitBtnText}>Publicar Producto</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Category Selection Modal */}
      {showCategoryModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Selecciona una Categoría</Text>
              <TouchableOpacity onPress={() => setShowCategoryModal(false)}>
                <Ionicons name="close" size={24} color={Colors.brand.dark} />
              </TouchableOpacity>
            </View>
            <ScrollView>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.categoryOption}
                  onPress={() => {
                    setCategoryId(cat.id);
                    setShowCategoryModal(false);
                  }}
                >
                  <Text style={[styles.categoryOptionText, categoryId === cat.id && styles.categoryOptionSelected]}>
                    {cat.name}
                  </Text>
                  {categoryId === cat.id && (
                    <Ionicons name="checkmark" size={20} color={Colors.brand.secondary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
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
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  dashboardTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.brand.secondary,
  },
  dashboardSubtitle: {
    fontSize: 13,
    color: Colors.brand.muted,
    fontWeight: '500',
  },
  publishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 6,
    shadowColor: Colors.brand.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  publishBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.brand.secondary,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
    marginTop: 10,
    gap: 12,
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
  headerTextContainer: {
    flex: 1,
  },
  formTitleText: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.brand.secondary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.brand.muted,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brand.dark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: Colors.brand.dark,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pickerTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  pickerText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.brand.dark,
  },
  textArea: {
    height: 120,
    paddingTop: 16,
    textAlignVertical: 'top',
  },
  imageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  imageCount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand.muted,
  },
  imageScroller: {
    flexDirection: 'row',
  },
  imageWrapper: {
    marginRight: 12,
    position: 'relative',
  },
  pickedImage: {
    width: 90,
    height: 90,
    borderRadius: 16,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBadge: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(251, 191, 36, 0.9)',
    paddingVertical: 2,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  primaryBadgeText: {
    fontSize: 8,
    fontWeight: '950',
    color: Colors.brand.secondary,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  addImageBtn: {
    width: 90,
    height: 90,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  addImageText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.brand.muted,
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: Colors.brand.secondary,
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    shadowColor: Colors.brand.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  centerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.brand.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  centerSubtitle: {
    fontSize: 14,
    color: Colors.brand.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  actionBtn: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  actionBtnText: {
    color: Colors.brand.secondary,
    fontWeight: '800',
    fontSize: 16,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '60%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.brand.secondary,
  },
  categoryOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  categoryOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.brand.muted,
  },
  categoryOptionSelected: {
    color: Colors.brand.secondary,
    fontWeight: '800',
  },
  // Dashboard Specific Styles
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  productCard: {
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
  productCardInfo: {
    flex: 1,
    marginLeft: 12,
  },
  productCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.brand.secondary,
    marginBottom: 2,
  },
  productCardPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: Colors.brand.accent,
    marginBottom: 6,
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  visibilityLabel: {
    fontSize: 12,
    color: Colors.brand.muted,
    fontWeight: '600',
    marginRight: 6,
  },
  visibilityText: {
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },
  visibilityActive: {
    color: Colors.brand.success,
  },
  visibilityInactive: {
    color: Colors.brand.muted,
  },
  statusBadgeRed: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    marginBottom: 6,
  },
  statusBadgeTextRed: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.brand.error,
  },
  statusBadgeAmber: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    marginBottom: 6,
  },
  statusBadgeTextAmber: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.brand.accent,
  },
  productCardActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  productActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  productActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand.secondary,
  },
  deleteProductBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  deleteProductBtnText: {
    color: Colors.brand.error,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.brand.secondary,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.brand.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyAddBtn: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
  },
  emptyAddBtnText: {
    color: Colors.brand.secondary,
    fontWeight: '800',
    fontSize: 15,
  },
});
