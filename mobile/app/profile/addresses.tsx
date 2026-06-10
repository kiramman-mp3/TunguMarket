import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getAddresses, createAddress, deleteAddress, setDefaultAddress } from '../../src/api/endpoints';
import { Colors } from '../../src/constants/theme';

export default function AddressManagerScreen() {
  const router = useRouter();
  
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [showForm, setShowForm] = useState(false);
  const [city, setCity] = useState('Ambato');
  const [mainStreet, setMainStreet] = useState('');
  const [secondaryStreet, setSecondaryStreet] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [houseNumber, setHouseNumber] = useState('');
  const [postalCode, setPostalCode] = useState('');

  const loadAddresses = async () => {
    try {
      setLoading(true);
      const res = await getAddresses();
      setAddresses(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAddresses();
  }, []);

  const handleSave = async () => {
    if (!mainStreet || !secondaryStreet || !postalCode) {
      Alert.alert('Faltan campos', 'Por favor llena la calle principal, calle secundaria y código postal.');
      return;
    }
    setSubmitting(true);
    try {
      await createAddress({
        city,
        main_street: mainStreet,
        secondary_street: secondaryStreet,
        neighborhood,
        house_number: houseNumber,
        postal_code: postalCode
      });
      setShowForm(false);
      
      // Clear form
      setMainStreet('');
      setSecondaryStreet('');
      setNeighborhood('');
      setHouseNumber('');
      setPostalCode('');
      
      await loadAddresses();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo guardar la dirección');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultAddress(id);
      setAddresses(prev =>
        prev.map(a => ({ ...a, is_default: a.id === id }))
      );
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo establecer como predeterminada');
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'Eliminar dirección',
      '¿Estás seguro de que deseas eliminar esta dirección de envío?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAddress(id);
              setAddresses(prev => prev.filter(a => a.id !== id));
            } catch (err: any) {
              Alert.alert('Error', err.message || 'No se pudo eliminar la dirección');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={Colors.brand.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mis Direcciones</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {!showForm && addresses.length < 5 && (
            <TouchableOpacity style={styles.addTrigger} onPress={() => setShowForm(true)}>
              <Ionicons name="add" size={20} color={Colors.brand.secondary} />
              <Text style={styles.addTriggerText}>Agregar Nueva Dirección</Text>
            </TouchableOpacity>
          )}

          {showForm && (
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Nueva Dirección</Text>
              
              <Text style={styles.formLabel}>Cantón (Tungurahua)</Text>
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
                <TouchableOpacity
                  style={[styles.saveBtn, submitting && styles.disabledBtn]}
                  onPress={handleSave}
                  disabled={submitting}
                >
                  {submitting ? <ActivityIndicator color="#ffffff" /> : <Text style={styles.saveBtnText}>Guardar</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {loading ? (
            <ActivityIndicator size="large" color={Colors.brand.secondary} style={{ marginTop: 40 }} />
          ) : addresses.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="map-outline" size={48} color={Colors.brand.muted} />
              <Text style={styles.emptyText}>No tienes direcciones guardadas.</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {addresses.map(addr => (
                <View key={addr.id} style={[styles.itemCard, addr.is_default && styles.itemCardDefault]}>
                  <View style={styles.itemHeader}>
                    <Text style={styles.itemCity}>{addr.city}</Text>
                    {addr.is_default && (
                      <View style={styles.defaultBadge}>
                        <Text style={styles.defaultBadgeText}>Predeterminada</Text>
                      </View>
                    )}
                  </View>
                  
                  <Text style={styles.itemStreet}>{addr.main_street} y {addr.secondary_street}</Text>
                  {addr.neighborhood && <Text style={styles.itemSubText}>Barrio: {addr.neighborhood}</Text>}
                  {addr.house_number && <Text style={styles.itemSubText}>Casa: {addr.house_number}</Text>}
                  <Text style={styles.itemSubText}>C.P. {addr.postal_code}</Text>

                  <View style={styles.itemActions}>
                    {!addr.is_default && (
                      <TouchableOpacity style={styles.actionLink} onPress={() => handleSetDefault(addr.id)}>
                        <Text style={styles.actionLinkText}>Usar por defecto</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.deleteLink} onPress={() => handleDelete(addr.id)}>
                      <Ionicons name="trash-outline" size={18} color={Colors.brand.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  addTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    height: 52,
    marginBottom: 16,
  },
  addTriggerText: {
    fontSize: 15,
    fontWeight: '750',
    color: Colors.brand.secondary,
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
    gap: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.brand.secondary,
    marginBottom: 4,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.brand.muted,
    textTransform: 'uppercase',
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
  disabledBtn: {
    opacity: 0.5,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: Colors.brand.muted,
    fontWeight: '700',
  },
  list: {
    gap: 16,
  },
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  itemCardDefault: {
    borderColor: Colors.brand.secondary,
    borderWidth: 1.5,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemCity: {
    fontSize: 15,
    fontWeight: '850',
    color: Colors.brand.secondary,
  },
  defaultBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.brand.success,
    textTransform: 'uppercase',
  },
  itemStreet: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.brand.dark,
    marginBottom: 4,
  },
  itemSubText: {
    fontSize: 12,
    color: Colors.brand.muted,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f8fafc',
    paddingTop: 12,
    marginTop: 12,
  },
  actionLink: {
    paddingVertical: 4,
  },
  actionLinkText: {
    fontSize: 13,
    color: Colors.brand.accent,
    fontWeight: '750',
  },
  deleteLink: {
    padding: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.brand.muted,
    marginTop: 8,
    fontWeight: '600',
  },
});
