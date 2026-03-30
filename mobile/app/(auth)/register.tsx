import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, Alert, ScrollView, Modal, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth as firebaseAuth } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { registerUser, googleLogin as apiGoogleLogin } from '@/api/auth';
import { Colors, Rounding, Shadow, Spacing } from '@/constants/theme';

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  // --- Google Auth Configuration ---
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    redirectUri: makeRedirectUri(),
    responseType: 'id_token',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      handleGoogleAuth(id_token);
    } else if (response?.type === 'error') {
      Alert.alert('Error', 'No se pudo registrar con Google');
    }
  }, [response]);

  const handleGoogleAuth = async (idToken: string) => {
    setLoading(true);
    try {
      // 1. Exchange Google ID Token for Firebase Credential
      const credential = GoogleAuthProvider.credential(idToken);
      
      // 2. Sign in to Firebase on Mobile to get a Firebase ID Token for our Backend
      const result = await signInWithCredential(firebaseAuth, credential);
      const firebaseIdToken = await result.user.getIdToken();

      // 3. Authenticate with our Backend using the Firebase Token
      const data = await apiGoogleLogin(firebaseIdToken);
      
      // 4. Sync session with AuthContext
      await login(data.user, data.token);
      
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('[GoogleRegister] Error:', error);
      Alert.alert('Error', error.message || 'Error al conectar con Google');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    // Only auto-close on Android. iOS has the manual 'Aceptar' button in the modal.
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }
    
    if (selectedDate) {
      setDate(selectedDate);
      // Format to YYYY-MM-DD
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      setBirthDate(`${year}-${month}-${day}`);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !birthDate) {
      Alert.alert('Error', 'Por favor llena todos los campos');
      return;
    }

    // Age validation (18+)
    const today = new Date();
    let age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
      age--;
    }

    if (age < 18) {
      Alert.alert('Restricción', 'Debes ser mayor de 18 años para registrarte en TunguMarket.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (!acceptTerms) {
      Alert.alert('Error', 'Debes aceptar los términos y condiciones');
      return;
    }

    setLoading(true);
    try {
      await registerUser({ name, email, password, birthDate });
      Alert.alert(
        '¡Registro exitoso!',
        'Por favor verifica tu correo para activar tu cuenta.',
        [{ text: 'Aceptar', onPress: () => router.push({ pathname: '/(auth)/pending-verification' as any, params: { email } }) }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.brand.secondary} />
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>Crea tu cuenta</Text>
            <Text style={styles.subtitle}>Únete a la comunidad y apoya lo local.</Text>
          </View>

          <View style={styles.form}>
            {/* 1. NAME */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nombre completo</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color={Colors.brand.muted} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="Juan Pérez"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* 2. EMAIL */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Correo electrónico</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color={Colors.brand.muted} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="ejemplo@correo.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* 3. BIRTH DATE (Picker) */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Fecha de nacimiento</Text>
              <Pressable 
                onPress={() => setShowDatePicker(true)}
                style={[styles.inputWrapper, showDatePicker && { borderColor: Colors.brand.secondary, borderWidth: 2 }]}
              >
                <Ionicons name="calendar-outline" size={20} color={showDatePicker ? Colors.brand.secondary : Colors.brand.muted} style={styles.inputIcon} />
                <Text style={[styles.input, !birthDate && { color: '#9ca3af' }]}>
                  {birthDate || 'YYYY-MM-DD (ej: 1990-01-01)'}
                </Text>
              </Pressable>
              
              {/* Android Native Picker */}
              {showDatePicker && Platform.OS === 'android' && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display="default"
                  maximumDate={new Date()}
                  onChange={onDateChange}
                />
              )}

              {/* iOS Styled Modal Picker */}
              {Platform.OS === 'ios' && (
                <Modal visible={showDatePicker} transparent animationType="slide">
                  <View style={styles.modalOverlay}>
                    <View style={styles.pickerWrapper}>
                      <View style={styles.pickerHeader}>
                        <Text style={styles.pickerTitle}>Fecha de Nacimiento</Text>
                        <TouchableOpacity 
                          onPress={() => setShowDatePicker(false)} 
                          style={styles.doneButton}
                        >
                          <Text style={styles.doneButtonText}>Aceptar</Text>
                        </TouchableOpacity>
                      </View>
                      <DateTimePicker
                        value={date}
                        mode="date"
                        display="spinner"
                        maximumDate={new Date()}
                        onChange={onDateChange}
                        textColor="white"
                        accentColor={Colors.brand.primary}
                        style={{ height: 250 }}
                      />
                    </View>
                  </View>
                </Modal>
              )}
            </View>

            {/* 4. PASSWORD */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.brand.muted} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="Mínimo 8 caracteres"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color={Colors.brand.muted} 
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.termsContainer}>
              <Pressable 
                onPress={() => setAcceptTerms(!acceptTerms)}
                style={[styles.checkbox, acceptTerms && styles.checkboxActive]}
              >
                {acceptTerms && <Ionicons name="checkmark" size={12} color={Colors.brand.secondary} />}
              </Pressable>
              <Text style={styles.termsText}>
                Acepto los <Text style={styles.termsLink}>Términos</Text> y la <Text style={styles.termsLink}>Política de Privacidad</Text>
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                (pressed || loading) && styles.buttonPressed,
                loading && styles.buttonDisabled
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading && !response ? (
                <ActivityIndicator color={Colors.brand.secondary} />
              ) : (
                <Text style={styles.actionButtonText}>Crear cuenta</Text>
              )}
            </Pressable>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>O REGÍSTRATE CON</Text>
              <View style={styles.divider} />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.googleButton,
                (pressed || loading) && styles.buttonPressed
              ]}
              onPress={() => promptAsync()}
              disabled={!request || loading}
            >
              {loading && response?.type === 'success' ? (
                <ActivityIndicator color={Colors.brand.secondary} />
              ) : (
                <>
                  <Ionicons name="logo-google" size={20} color={Colors.brand.secondary} />
                  <Text style={styles.googleButtonText}>Google</Text>
                </>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
            <Pressable onPress={() => router.push('/(auth)/login' as any)}>
              <Text style={styles.signInText}>Inicia sesión</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.brand.light,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: Rounding.large,
    backgroundColor: Colors.brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    ...Shadow.light,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.brand.secondary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.brand.muted,
    lineHeight: 24,
    fontWeight: '500',
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brand.dark,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.brand.border,
    borderRadius: Rounding.large,
    paddingHorizontal: 16,
    backgroundColor: Colors.brand.surface,
    height: 58,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.brand.dark,
    fontWeight: '500',
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.brand.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brand.surface,
  },
  checkboxActive: {
    backgroundColor: Colors.brand.primary,
    borderColor: Colors.brand.primary,
  },
  termsText: {
    fontSize: 13,
    color: Colors.brand.muted,
    flex: 1,
    fontWeight: '500',
  },
  termsLink: {
    color: Colors.brand.secondary,
    fontWeight: '800',
  },
  actionButton: {
    backgroundColor: Colors.brand.primary,
    height: 58,
    borderRadius: Rounding.large,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    ...Shadow.medium,
  },
  actionButtonText: {
    color: Colors.brand.secondary,
    fontSize: 18,
    fontWeight: '800',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    gap: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.brand.border,
  },
  dividerText: {
    fontSize: 11,
    color: Colors.brand.muted,
    fontWeight: '700',
    letterSpacing: 1,
  },
  googleButton: {
    backgroundColor: Colors.brand.surface,
    height: 58,
    borderRadius: Rounding.large,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.brand.border,
    flexDirection: 'row',
    gap: 10,
    ...Shadow.light,
  },
  googleButtonText: {
    color: Colors.brand.secondary,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingTop: 40,
  },
  footerText: {
    color: Colors.brand.muted,
    fontSize: 15,
    fontWeight: '500',
  },
  signInText: {
    color: Colors.brand.secondary,
    fontSize: 15,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  pickerWrapper: {
    backgroundColor: Colors.brand.secondary,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingBottom: 40,
    alignItems: 'center',
    ...Shadow.medium,
  },
  pickerHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  pickerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '800',
  },
  doneButton: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  doneButtonText: {
    color: Colors.brand.secondary,
    fontWeight: '900',
    fontSize: 15,
  },
});
