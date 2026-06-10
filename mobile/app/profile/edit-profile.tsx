import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  ActivityIndicator, 
  Alert, 
  Image, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../src/context/AuthContext';
import { updateProfileName, changePassword, updateAvatar } from '../../src/api/endpoints';
import { Colors } from '../../src/constants/theme';
import { getImageUrl } from '../../src/api/client';

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [avatarLoading, setAvatarLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleSelectAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Necesitamos acceso a tus fotos para actualizar tu foto de perfil.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setAvatarLoading(true);

        const formData = new FormData();
        const filename = uri.split('/').pop() || 'avatar.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('avatar', {
          uri,
          name: filename,
          type,
        } as any);

        const res = await updateAvatar(formData);
        
        // Update local state and secure storage
        await updateUser({ avatar_url: res.avatar_url, ...res.user });
        
        Alert.alert('¡Éxito!', 'Foto de perfil actualizada correctamente.');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo actualizar la foto de perfil.');
    } finally {
      setAvatarLoading(false);
    }
  };

  const handleUpdateName = async () => {
    if (!name.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa tu nombre completo.');
      return;
    }
    try {
      setProfileLoading(true);
      const res = await updateProfileName(name);
      await updateUser({ name: res.user.name });
      Alert.alert('¡Éxito!', 'Nombre de perfil actualizado correctamente.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo actualizar el nombre.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Campos vacíos', 'Por favor llena todos los campos de contraseña.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas nuevas no coinciden.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setPasswordLoading(true);
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('¡Éxito!', 'Contraseña actualizada con éxito.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
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
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Avatar Section */}
          <View style={styles.avatarCard}>
            <TouchableOpacity onPress={handleSelectAvatar} activeOpacity={0.8} style={styles.avatarWrapper}>
              <Image
                source={{ uri: getImageUrl(user.avatar_url) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200' }}
                style={styles.avatarImage}
              />
              <View style={styles.avatarCameraOverlay}>
                {avatarLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="camera" size={20} color="#ffffff" />
                )}
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarTitle}>Foto de Perfil</Text>
            <Text style={styles.avatarSubtitle}>Toca para cambiar la foto (recomendado: cuadrada)</Text>
          </View>

          {/* Personal Info Form */}
          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-outline" size={20} color={Colors.brand.secondary} />
              <Text style={styles.formTitle}>Información Personal</Text>
            </View>

            <Text style={styles.formLabel}>Nombre Completo</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre completo"
              placeholderTextColor={Colors.brand.muted}
            />

            <TouchableOpacity 
              style={[styles.actionBtn, profileLoading && styles.disabledBtn]} 
              onPress={handleUpdateName}
              disabled={profileLoading}
            >
              {profileLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={20} color="#ffffff" />
                  <Text style={styles.actionBtnText}>Guardar Cambios</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Password Form */}
          <View style={styles.formCard}>
            <View style={styles.sectionHeader}>
              <Ionicons name="lock-closed-outline" size={20} color={Colors.brand.secondary} />
              <Text style={styles.formTitle}>Seguridad de la Cuenta</Text>
            </View>

            <Text style={styles.formLabel}>Contraseña Actual</Text>
            <TextInput
              style={styles.input}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Ingresa tu contraseña actual"
              placeholderTextColor={Colors.brand.muted}
              secureTextEntry
            />

            <Text style={styles.formLabel}>Nueva Contraseña</Text>
            <TextInput
              style={styles.input}
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Mínimo 6 caracteres"
              placeholderTextColor={Colors.brand.muted}
              secureTextEntry
            />

            <Text style={styles.formLabel}>Confirmar Nueva Contraseña</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirma la nueva contraseña"
              placeholderTextColor={Colors.brand.muted}
              secureTextEntry
            />

            <TouchableOpacity 
              style={[styles.actionBtn, styles.secondaryBtn, passwordLoading && styles.disabledBtn]} 
              onPress={handleUpdatePassword}
              disabled={passwordLoading}
            >
              {passwordLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <>
                  <Ionicons name="key-outline" size={20} color="#ffffff" />
                  <Text style={styles.actionBtnText}>Actualizar Contraseña</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  avatarCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
    width: 110,
    height: 110,
    borderRadius: 55,
    overflow: 'visible',
    marginBottom: 16,
  },
  avatarImage: {
    width: 110,
    height: 110,
    borderRadius: 55,
  },
  avatarCameraOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.brand.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  avatarTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.brand.secondary,
    marginBottom: 4,
  },
  avatarSubtitle: {
    fontSize: 12,
    color: Colors.brand.muted,
    textAlign: 'center',
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.brand.secondary,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '850',
    color: Colors.brand.muted,
    textTransform: 'uppercase',
    marginTop: 4,
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
  actionBtn: {
    backgroundColor: Colors.brand.primary,
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  secondaryBtn: {
    backgroundColor: Colors.brand.secondary,
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 14,
  },
  disabledBtn: {
    opacity: 0.5,
  },
});
