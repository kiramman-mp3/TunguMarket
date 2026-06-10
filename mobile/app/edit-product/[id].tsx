import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { getProductById, updateProduct, getCategories } from '../../src/api/endpoints';
import { Colors } from '../../src/constants/theme';

export default function EditProductScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('1');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [existingImages, setExistingImages] = useState<any[]>([]);

  const [newImages, setNewImages] = useState<string[]>([]); // New selected image URIs
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [prodRes, catRes] = await Promise.all([
          getProductById(id),
          getCategories()
        ]);
        const product = prodRes.product || prodRes.data;
        setTitle(product.title);
        setDescription(product.description);
        setPrice(String(product.price));
        setStock(String(product.stock));
        setCategoryId(product.category_id);
        setExistingImages(product.images || []);
        
        setCategories(catRes.categories || catRes.data || []);
      } catch (err: any) {
        Alert.alert('Error', err.message || 'No se pudo cargar la información del producto');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    if (id) {
      loadData();
    }
  }, [id]);

  const handlePickImage = async () => {
    const totalImagesCount = existingImages.length + newImages.length;
    if (totalImagesCount >= 5) {
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
      selectionLimit: 5 - totalImagesCount,
      quality: 0.8,
    });

    if (!result.canceled && result.assets) {
      const selectedUris = result.assets.map(asset => asset.uri);
      setNewImages(prev => [...prev, ...selectedUris].slice(0, 5 - existingImages.length));
    }
  };

  const handleRemoveNewImage = (index: number) => {
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingImage = (imageId: string) => {
    // We just remove it locally from state; on submit we can send the updated existing images or delete it via API if necessary.
    // However, the simplest way is to let the user know they will update the product details.
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleSubmit = async () => {
    if (!title || !description || !price || !stock || !categoryId) {
      Alert.alert('Campos incompletos', 'Por favor llena todos los campos obligatorios.');
      return;
    }

    if (existingImages.length === 0 && newImages.length === 0) {
      Alert.alert('Imágenes requeridas', 'Por favor selecciona al menos una imagen para tu producto.');
      return;
    }

    setSubmitting(true);
    try {
      // Create FormData
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', String(parseFloat(price)));
      formData.append('stock', String(parseInt(stock, 10)));
      formData.append('category_id', categoryId);
      
      // Send lists of existing image IDs that are kept
      formData.append('keep_images', JSON.stringify(existingImages.map(img => img.id)));

      newImages.forEach((uri, index) => {
        const filename = uri.split('/').pop() || `image_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('images', {
          uri,
          name: filename,
          type,
        } as any);
      });

      await updateProduct(id, formData);

      Alert.alert(
        '¡Actualizado!',
        'Tu producto ha sido modificado con éxito.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Error al guardar', err.message || 'Ocurrió un error al actualizar tu producto.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.brand.secondary} />
      </View>
    );
  }

  const selectedCategoryName = categories.find(c => c.id === categoryId)?.name || 'Selecciona una categoría';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.brand.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Editar Producto</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Form Fields */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Título del Producto *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Pan de Pinllo Tradicional"
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
            placeholder="Describe las características de tu producto..."
            multiline
            numberOfLines={4}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* Images List */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Imágenes del Producto</Text>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroller}>
            {/* Existing Images */}
            {existingImages.map((img) => (
              <View key={img.id} style={styles.imageWrapper}>
                <Image source={{ uri: img.image_url }} style={styles.pickedImage} />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => handleRemoveExistingImage(img.id)}
                >
                  <Ionicons name="close" size={16} color="#ffffff" />
                </TouchableOpacity>
                {img.is_primary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Principal</Text>
                  </View>
                )}
              </View>
            ))}

            {/* New picked images */}
            {newImages.map((uri, index) => (
              <View key={index} style={styles.imageWrapper}>
                <Image source={{ uri }} style={styles.pickedImage} />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => handleRemoveNewImage(index)}
                >
                  <Ionicons name="close" size={16} color="#ffffff" />
                </TouchableOpacity>
                {existingImages.length === 0 && index === 0 && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>Principal</Text>
                  </View>
                )}
              </View>
            ))}

            {existingImages.length + newImages.length < 5 && (
              <TouchableOpacity style={styles.addImageBtn} onPress={handlePickImage}>
                <Ionicons name="camera-outline" size={32} color={Colors.brand.muted} />
                <Text style={styles.addImageText}>Añadir</Text>
              </TouchableOpacity>
            )}
          </ScrollView>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={22} color="#ffffff" />
              <Text style={styles.submitBtnText}>Guardar Cambios</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Category selection modal */}
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
    backgroundColor: Colors.brand.primary,
    height: 56,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: Colors.brand.secondary,
    fontSize: 17,
    fontWeight: '800',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
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
});
