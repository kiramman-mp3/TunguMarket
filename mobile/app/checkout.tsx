import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Image, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useCart } from '../src/context/CartContext';
import { getAddresses, createAddress, checkout } from '../src/api/endpoints';
import { Colors } from '../src/constants/theme';

export default function CheckoutScreen() {
  const router = useRouter();
  const { cartItems, totalPrice, clearCart } = useCart();

  const [paymentMethod, setPaymentMethod] = useState<'transferencia' | 'tarjeta' | 'efectivo' | null>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Address creation form state
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [city, setCity] = useState('Ambato');
  const [mainStreet, setMainStreet] = useState('');
  const [secondaryStreet, setSecondaryStreet] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [postalCode, setPostalCode] = useState('');

  // Card Payment simulation state
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Transfer Receipt image state
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const res = await getAddresses();
      const addrList = res.data || [];
      setAddresses(addrList);
      
      const defaultAddr = addrList.find((a: any) => a.is_default);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else if (addrList.length > 0) {
        setSelectedAddressId(addrList[0].id);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  const handleAddAddress = async () => {
    if (!mainStreet || !secondaryStreet || !postalCode) {
      Alert.alert('Faltan campos', 'Por favor llena la calle principal, calle secundaria y código postal.');
      return;
    }
    try {
      const res = await createAddress({
        city,
        main_street: mainStreet,
        secondary_street: secondaryStreet,
        neighborhood,
        house_number: houseNumber,
        postal_code: postalCode
      });
      const added = res.data;
      setAddresses(prev => [...prev, added]);
      setSelectedAddressId(added.id);
      setShowAddressForm(false);
      
      // Clear form
      setMainStreet('');
      setSecondaryStreet('');
      setNeighborhood('');
      setHouseNumber('');
      setPostalCode('');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo guardar la dirección');
    }
  };

  const handleSelectReceipt = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Necesitamos acceso para subir el comprobante.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setReceiptImage(result.assets[0].uri);
    }
  };

  const handleConfirmOrder = async () => {
    if (!selectedAddressId) {
      Alert.alert('Dirección requerida', 'Por favor selecciona o agrega una dirección de envío.');
      return;
    }
    if (!paymentMethod) {
      Alert.alert('Método de pago', 'Por favor selecciona un método de pago.');
      return;
    }

    if (paymentMethod === 'transferencia' && !receiptImage) {
      Alert.alert('Comprobante requerido', 'Debes subir la foto de tu comprobante de transferencia.');
      return;
    }

    if (paymentMethod === 'tarjeta' && (!cardNumber || !cardHolder || !cardExpiry || !cardCvv)) {
      Alert.alert('Campos incompletos', 'Por favor ingresa todos los datos de tu tarjeta.');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('payment_method', paymentMethod);
      formData.append('address_id', selectedAddressId);

      if (paymentMethod === 'transferencia' && receiptImage) {
        const filename = receiptImage.split('/').pop() || 'receipt.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('receipt', {
          uri: receiptImage,
          name: filename,
          type,
        } as any);
      }

      const res = await checkout(formData);
      setOrderId(res.order_id);
      setSuccess(true);
      await clearCart();
    } catch (err: any) {
      Alert.alert('Error al realizar pedido', err.message || 'Ocurrió un error al procesar el checkout');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.successContainer}>
        <Ionicons name="checkmark-circle" size={80} color={Colors.brand.success} />
        <Text style={styles.successTitle}>¡Pedido Realizado!</Text>
        <Text style={styles.successSubtitle}>
          Tu orden #{orderId?.substring(0, 8)} ha sido creada con éxito.
        </Text>

        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>Próximos Pasos:</Text>
          {paymentMethod === 'tarjeta' && (
            <Text style={styles.stepText}>Tu pago ha sido validado automáticamente. Estamos preparando tu envío.</Text>
          )}
          {paymentMethod === 'transferencia' && (
            <Text style={styles.stepText}>Hemos recibido tu comprobante bancario. Un administrador lo revisará pronto para confirmar el envío.</Text>
          )}
          {paymentMethod === 'efectivo' && (
            <Text style={styles.stepText}>Paga al vendedor en efectivo contra entrega física cuando recibas el producto.</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.doneBtn}
          onPress={() => router.replace('/(tabs)/' as any)}
        >
          <Text style={styles.doneBtnText}>Seguir Comprando</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          onPress={() => router.replace('/profile/orders' as any)}
          style={{ marginTop: 16 }}
        >
          <Text style={styles.ordersLink}>Ver mis pedidos</Text>
        </TouchableOpacity>
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
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Total to Pay banner */}
        <View style={styles.totalBanner}>
          <Text style={styles.totalBannerLabel}>Total a Pagar:</Text>
          <Text style={styles.totalBannerValue}>${totalPrice.toFixed(2)}</Text>
        </View>

        {/* SECTION: ADDRESS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Dirección de Envío</Text>
          {!showAddressForm && (
            <TouchableOpacity onPress={() => setShowAddressForm(true)}>
              <Text style={styles.addText}>+ Nueva</Text>
            </TouchableOpacity>
          )}
        </View>

        {showAddressForm ? (
          <View style={styles.addressForm}>
            <Text style={styles.formLabel}>Cantón (Tungurahua)</Text>
            <View style={styles.pickerWrapper}>
              <Text style={styles.pickerText}>{city}</Text>
              {/* Simplification: default values picker or simple input */}
              {/* To select a canton */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                {['Ambato', 'Baños de Agua Santa', 'Cevallos', 'Mocha', 'Patate', 'Quero', 'Pelileo', 'Píllaro', 'Tisaleo'].map(c => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.cantonOption, city === c && styles.cantonOptionSelected]}
                    onPress={() => setCity(c)}
                  >
                    <Text style={[styles.cantonText, city === c && styles.cantonTextSelected]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Calle Principal"
              placeholderTextColor={Colors.brand.muted}
              value={mainStreet}
              onChangeText={setMainStreet}
            />
            <TextInput
              style={styles.input}
              placeholder="Calle Secundaria"
              placeholderTextColor={Colors.brand.muted}
              value={secondaryStreet}
              onChangeText={setSecondaryStreet}
            />
            <TextInput
              style={styles.input}
              placeholder="Barrio (Opcional)"
              placeholderTextColor={Colors.brand.muted}
              value={neighborhood}
              onChangeText={setNeighborhood}
            />
            <TextInput
              style={styles.input}
              placeholder="Nº Casa / Edificio (Opcional)"
              placeholderTextColor={Colors.brand.muted}
              value={houseNumber}
              onChangeText={setHouseNumber}
            />
            <TextInput
              style={styles.input}
              placeholder="Código Postal"
              placeholderTextColor={Colors.brand.muted}
              value={postalCode}
              onChangeText={setPostalCode}
            />

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.saveBtn} onPress={handleAddAddress}>
                <Text style={styles.saveBtnText}>Guardar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowAddressForm(false)}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.addressesList}>
            {addresses.length === 0 ? (
              <TouchableOpacity style={styles.noAddressBtn} onPress={() => setShowAddressForm(true)}>
                <Ionicons name="map-outline" size={24} color={Colors.brand.muted} />
                <Text style={styles.noAddressText}>Añadir dirección de entrega</Text>
              </TouchableOpacity>
            ) : (
              addresses.map(addr => (
                <TouchableOpacity
                  key={addr.id}
                  style={[styles.addressItem, selectedAddressId === addr.id && styles.addressItemSelected]}
                  onPress={() => setSelectedAddressId(addr.id)}
                >
                  <View style={styles.addressMeta}>
                    <Text style={styles.addressCity}>{addr.city}</Text>
                    {selectedAddressId === addr.id && (
                      <Ionicons name="checkmark-circle" size={18} color={Colors.brand.secondary} />
                    )}
                  </View>
                  <Text style={styles.addressDetail}>{addr.main_street} y {addr.secondary_street}</Text>
                  {addr.neighborhood && <Text style={styles.addressSubDetail}>{addr.neighborhood}</Text>}
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        {/* SECTION: PAYMENT METHODS */}
        <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 12 }]}>Método de Pago</Text>
        <View style={styles.paymentMethodsRow}>
          <TouchableOpacity
            style={[styles.methodCard, paymentMethod === 'transferencia' && styles.methodCardSelected]}
            onPress={() => setPaymentMethod('transferencia')}
          >
            <Ionicons name="business" size={22} color={paymentMethod === 'transferencia' ? '#ffffff' : Colors.brand.secondary} />
            <Text style={[styles.methodCardText, paymentMethod === 'transferencia' && styles.methodCardTextSelected]}>Transferencia</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodCard, paymentMethod === 'tarjeta' && styles.methodCardSelected]}
            onPress={() => setPaymentMethod('tarjeta')}
          >
            <Ionicons name="card" size={22} color={paymentMethod === 'tarjeta' ? '#ffffff' : Colors.brand.secondary} />
            <Text style={[styles.methodCardText, paymentMethod === 'tarjeta' && styles.methodCardTextSelected]}>Tarjeta</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodCard, paymentMethod === 'efectivo' && styles.methodCardSelected]}
            onPress={() => setPaymentMethod('efectivo')}
          >
            <Ionicons name="cash" size={22} color={paymentMethod === 'efectivo' ? '#ffffff' : Colors.brand.secondary} />
            <Text style={[styles.methodCardText, paymentMethod === 'efectivo' && styles.methodCardTextSelected]}>Efectivo</Text>
          </TouchableOpacity>
        </View>

        {/* PAYMENT CONTENT SHOWN BY METHOD */}
        {paymentMethod === 'transferencia' && (
          <View style={styles.paymentSectionCard}>
            <Text style={styles.bankTitle}>Cuentas Bancarias de TunguMarket</Text>
            
            <View style={styles.bankAccountRow}>
              <Text style={styles.bankName}>Banco Pichincha</Text>
              <Text style={styles.bankDetail}>TunguMarket (Johan Rodriguez)</Text>
              <Text style={styles.bankNumber}>Cta Corriente: 2209093374</Text>
              <Text style={styles.bankId}>CI: 1850410612</Text>
            </View>

            <View style={styles.bankAccountRow}>
              <Text style={[styles.bankName, { color: Colors.brand.success }]}>Produbanco</Text>
              <Text style={styles.bankDetail}>TunguMarket (Johan Rodriguez)</Text>
              <Text style={styles.bankNumber}>Cta Corriente: 20002648766</Text>
              <Text style={styles.bankId}>CI: 1850410612</Text>
            </View>

            <Text style={styles.uploadLabel}>Comprobante de Transferencia (Requerido) *</Text>
            <TouchableOpacity style={styles.imageUploadBtn} onPress={handleSelectReceipt}>
              {receiptImage ? (
                <View style={{ alignItems: 'center' }}>
                  <Image source={{ uri: receiptImage }} style={styles.receiptPreview} />
                  <Text style={styles.uploadPlaceholderText}>Cambiar imagen</Text>
                </View>
              ) : (
                <>
                  <Ionicons name="cloud-upload" size={36} color={Colors.brand.muted} />
                  <Text style={styles.uploadPlaceholderText}>Subir foto del comprobante</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {paymentMethod === 'tarjeta' && (
          <View style={styles.paymentSectionCard}>
            <Text style={styles.bankTitle}>Tarjeta de Crédito / Débito</Text>
            
            <TextInput
              style={styles.input}
              placeholder="Número de Tarjeta (16 dígitos)"
              placeholderTextColor={Colors.brand.muted}
              keyboardType="numeric"
              maxLength={16}
              value={cardNumber}
              onChangeText={setCardNumber}
            />
            <TextInput
              style={styles.input}
              placeholder="Nombre del Titular"
              placeholderTextColor={Colors.brand.muted}
              value={cardHolder}
              onChangeText={setCardHolder}
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1, marginRight: 12 }]}
                placeholder="MM/AA"
                placeholderTextColor={Colors.brand.muted}
                maxLength={5}
                value={cardExpiry}
                onChangeText={setCardExpiry}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="CVV"
                placeholderTextColor={Colors.brand.muted}
                maxLength={4}
                keyboardType="numeric"
                secureTextEntry
                value={cardCvv}
                onChangeText={setCardCvv}
              />
            </View>
          </View>
        )}

        {paymentMethod === 'efectivo' && (
          <View style={styles.paymentSectionCard}>
            <View style={styles.cashHeader}>
              <Ionicons name="checkmark-circle" size={24} color={Colors.brand.success} />
              <Text style={styles.cashTitle}>Pago Contra Entrega</Text>
            </View>
            <Text style={styles.cashDescription}>
              Al confirmar esta orden, te comprometes a pagar la cantidad total de la compra en efectivo directamente al vendedor en el momento en que recibas el producto.
            </Text>
          </View>
        )}

        {/* Checkout button */}
        <TouchableOpacity
          style={[styles.confirmBtn, (!selectedAddressId || !paymentMethod || loading) && styles.disabledBtn]}
          onPress={handleConfirmOrder}
          disabled={!selectedAddressId || !paymentMethod || loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <>
              <Ionicons name="cart" size={22} color="#ffffff" />
              <Text style={styles.confirmBtnText}>Confirmar Compra</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  totalBanner: {
    backgroundColor: Colors.brand.secondary,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  totalBannerLabel: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
    opacity: 0.8,
  },
  totalBannerValue: {
    fontSize: 24,
    color: Colors.brand.primary,
    fontWeight: '900',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.brand.secondary,
  },
  addText: {
    color: Colors.brand.accent,
    fontWeight: '800',
    fontSize: 13,
  },
  addressForm: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 12,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.brand.muted,
    textTransform: 'uppercase',
  },
  pickerWrapper: {
    marginBottom: 4,
  },
  pickerText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brand.dark,
    marginBottom: 4,
  },
  cantonOption: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginRight: 8,
  },
  cantonOptionSelected: {
    backgroundColor: Colors.brand.secondary,
  },
  cantonText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand.muted,
  },
  cantonTextSelected: {
    color: '#ffffff',
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 46,
    fontSize: 14,
    color: Colors.brand.dark,
    fontWeight: '600',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  saveBtn: {
    flex: 1,
    backgroundColor: Colors.brand.secondary,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#ffffff',
    fontWeight: '800',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: Colors.brand.muted,
    fontWeight: '700',
  },
  addressesList: {
    gap: 12,
  },
  noAddressBtn: {
    height: 100,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  noAddressText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.muted,
  },
  addressItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  addressItemSelected: {
    borderColor: Colors.brand.secondary,
    backgroundColor: '#ffffff',
  },
  addressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressCity: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.brand.secondary,
  },
  addressDetail: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  addressSubDetail: {
    fontSize: 11,
    color: Colors.brand.muted,
    marginTop: 2,
  },
  paymentMethodsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 16,
  },
  methodCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  methodCardSelected: {
    borderColor: Colors.brand.secondary,
    backgroundColor: Colors.brand.secondary,
  },
  methodCardText: {
    fontSize: 11,
    fontWeight: '750',
    color: Colors.brand.muted,
  },
  methodCardTextSelected: {
    color: '#ffffff',
  },
  paymentSectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  bankTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.brand.secondary,
    marginBottom: 14,
  },
  bankAccountRow: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
  },
  bankName: {
    fontSize: 12,
    fontWeight: '900',
    color: Colors.brand.secondary,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  bankDetail: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.brand.dark,
  },
  bankNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.brand.secondary,
    marginVertical: 2,
  },
  bankId: {
    fontSize: 10,
    color: Colors.brand.muted,
    fontWeight: '600',
  },
  uploadLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.brand.dark,
    marginTop: 10,
    marginBottom: 8,
  },
  imageUploadBtn: {
    height: 140,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#f8fafc',
  },
  receiptPreview: {
    width: 200,
    height: 90,
    borderRadius: 8,
    marginBottom: 4,
    resizeMode: 'contain',
  },
  uploadPlaceholderText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand.muted,
  },
  cashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cashTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.brand.success,
  },
  cashDescription: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '500',
  },
  confirmBtn: {
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
    marginTop: 12,
  },
  disabledBtn: {
    backgroundColor: '#cbd5e1',
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '800',
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  successTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.brand.secondary,
    marginTop: 20,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    color: Colors.brand.muted,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  stepsCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 32,
  },
  stepsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.brand.secondary,
    marginBottom: 8,
  },
  stepText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    fontWeight: '600',
  },
  doneBtn: {
    backgroundColor: Colors.brand.primary,
    height: 56,
    borderRadius: 18,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    color: Colors.brand.secondary,
    fontSize: 16,
    fontWeight: '800',
  },
  ordersLink: {
    fontSize: 14,
    color: Colors.brand.muted,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
});
