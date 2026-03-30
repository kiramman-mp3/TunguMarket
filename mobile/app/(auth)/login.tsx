import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth as firebaseAuth } from '@/config/firebase';
import { useAuth } from '@/context/AuthContext';
import { loginUser, googleLogin as apiGoogleLogin } from '@/api/auth';
import { Colors, Rounding, Shadow, Spacing, Fonts } from '@/constants/theme';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
      Alert.alert('Error', 'No se pudo iniciar sesión con Google');
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
      console.error('[GoogleLogin] Error:', error);
      Alert.alert('Error', error.message || 'Error al conectar con Google');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor ingresa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const data = await loginUser({ email, password });
      await login(data.user, data.token);
      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Credenciales inválidas');
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
            <Text style={styles.title}>¡Bienvenido!</Text>
            <Text style={styles.subtitle}>Te extrañamos. Ingresa tus datos para continuar.</Text>
          </View>

          <View style={styles.form}>
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

            <View style={styles.inputContainer}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Contraseña</Text>
                <Pressable onPress={() => router.push('/(auth)/forgot-password' as any)}>
                  <Text style={styles.forgotText}>¿Olvidaste tu clave?</Text>
                </Pressable>
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.brand.muted} style={styles.inputIcon} />
                <TextInput 
                  style={styles.input}
                  placeholder="••••••••"
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

            <Pressable
              style={({ pressed }) => [
                styles.loginButton,
                (pressed || loading) && styles.buttonPressed
              ]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.brand.secondary} />
              ) : (
                <Text style={styles.loginButtonText}>Iniciar Sesión</Text>
              )}
            </Pressable>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>O CONTINUAR CON</Text>
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
                  <Ionicons name="logo-google" size={20} color={Colors.brand.secondary} style={styles.googleIcon} />
                  <Text style={styles.googleButtonText}>Google</Text>
                </>
              )}
            </Pressable>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>¿No tienes cuenta? </Text>
            <Pressable onPress={() => router.push('/(auth)/register' as any)}>
              <Text style={styles.signUpText}>Crea una aquí</Text>
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
    flexGrow: 1,
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
    fontSize: 32,
    fontWeight: '800',
    color: Colors.brand.secondary,
    marginBottom: 8,
    fontFamily: Fonts?.display,
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
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.brand.dark,
    marginLeft: 4,
  },
  forgotText: {
    fontSize: 13,
    color: Colors.brand.secondary,
    fontWeight: '700',
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
  loginButton: {
    backgroundColor: Colors.brand.primary,
    height: 58,
    borderRadius: Rounding.large,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    ...Shadow.medium,
  },
  loginButtonText: {
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
    ...Shadow.light,
  },
  googleIcon: {
    marginRight: 10,
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
  signUpText: {
    color: Colors.brand.secondary,
    fontSize: 15,
    fontWeight: '800',
  },
});
