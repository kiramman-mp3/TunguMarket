import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, SafeAreaView, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../../src/context/AuthContext';
import { registerUser, googleLogin as apiGoogleLogin } from '../../src/api/auth';

WebBrowser.maybeCompleteAuthSession();

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const router = useRouter();

  // Google Auth Request
  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID, // Use the same for Expo Go
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      if (id_token) {
        handleGoogleLogin(id_token);
      }
    }
  }, [response]);

  const handleGoogleLogin = async (idToken: string) => {
    setLoading(true);
    try {
      const data = await apiGoogleLogin(idToken);
      await login(data.user, data.token);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error de Google', error.message || 'No se pudo iniciar sesión con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      await registerUser({ name, email, password });
      Alert.alert('Éxito', 'Cuenta creada con éxito. Ahora puedes iniciar sesión.', [
        { text: 'OK', onPress: () => router.push('/(auth)/login') }
      ]);
    } catch (error: any) {
      Alert.alert('Error de registro', error.message || 'No se pudo crear la cuenta');
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* Back Button */}
          <Pressable 
            onPress={() => router.back()} 
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color="#1e3a8a" />
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>Crea tu cuenta</Text>
            <Text style={styles.subtitle}>Empieza a apoyar lo local hoy mismo.</Text>
          </View>

          {/* Social Register Section */}
          <View style={styles.socialSection}>
            <Pressable
              style={({ pressed }) => [
                styles.socialButton,
                pressed && styles.buttonPressed
              ]}
              onPress={() => promptAsync()}
              disabled={!request || loading}
            >
              <Ionicons name="logo-google" size={20} color="#1e3a8a" style={{ marginRight: 10 }} />
              <Text style={styles.socialButtonText}>Continuar con Google</Text>
            </Pressable>

            <View style={styles.separator}>
              <View style={styles.separatorLine} />
              <Text style={styles.separatorText}>o regístrate con correo</Text>
              <View style={styles.separatorLine} />
            </View>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Nombre completo</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="Juan Pérez"
                  autoComplete="name"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Correo electrónico</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="#64748b" style={styles.inputIcon} />
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

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Contraseña</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="••••••••"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            <View style={styles.termsRow}>
              <View style={styles.checkboxContainer}>
                <Ionicons name="checkbox" size={20} color="#fbbf24" />
              </View>
              <Text style={styles.termsText}>
                Acepto los <Text style={styles.linkText}>Términos y Condiciones</Text> y la <Text style={styles.linkText}>Política de Privacidad</Text>
              </Text>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.registerButton,
                (pressed || loading) && styles.buttonPressed
              ]}
              onPress={handleRegister}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#1e3a8a" />
              ) : (
                <Text style={styles.registerButtonText}>Crear Cuenta</Text>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿Ya tienes una cuenta?</Text>
            <Pressable onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.signInText}> Inicia sesión</Text>
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
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  socialSection: {
    marginBottom: 32,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    backgroundColor: '#fff',
    gap: 12,
  },
  googleIcon: {
    width: 24,
    height: 24,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
    gap: 12,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  separatorText: {
    fontSize: 12,
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  form: {
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    height: 56,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    gap: 12,
    paddingRight: 12,
  },
  checkboxContainer: {
    marginTop: 2,
  },
  termsText: {
    fontSize: 12,
    color: '#64748b',
    lineHeight: 18,
    flexShrink: 1,
  },
  linkText: {
    color: '#1e3a8a',
    fontWeight: '600',
  },
  registerButton: {
    backgroundColor: '#fbbf24',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    shadowColor: "#fbbf24",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonText: {
    color: '#1e3a8a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
  },
  footerText: {
    color: '#64748b',
    fontSize: 16,
  },
  signInText: {
    color: '#1e3a8a',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
