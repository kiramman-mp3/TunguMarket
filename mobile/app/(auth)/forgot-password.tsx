import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { forgotPassword } from '@/api/auth';
import { Colors, Rounding, Shadow, Spacing } from '@/constants/theme';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const handleForgot = async () => {
    if (!email) {
      Alert.alert('Error', 'Por favor ingresa tu correo');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo procesar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent} centerContent>
          <View style={styles.headerCentered}>
            <View style={[styles.iconCircle, { backgroundColor: '#ecfdf5' }]}>
              <Ionicons name="mail-unread-outline" size={40} color={Colors.brand.success} />
            </View>
            <Text style={styles.title}>¡Enviado!</Text>
            <Text style={styles.subtitle}>
              Hemos enviado un código de 6 dígitos a <Text style={styles.emailText}>{email}</Text>.
            </Text>
          </View>

          <View style={styles.form}>
            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                pressed && styles.buttonPressed
              ]}
              onPress={() => router.push({ pathname: '/(auth)/reset-password' as any, params: { email } })}
            >
              <Text style={styles.actionButtonText}>Ingresar código</Text>
            </Pressable>

            <Pressable onPress={() => setSent(false)} style={styles.backLinkRow}>
              <Ionicons name="arrow-back" size={16} color={Colors.brand.secondary} />
              <Text style={styles.backLinkTextBlue}>Intentar con otro correo</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.brand.secondary} />
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
            <Text style={styles.subtitle}>No te preocupes. Ingresa tu correo para recibir un código de recuperación.</Text>
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
                  autoFocus
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.actionButton,
                (pressed || loading) && styles.buttonPressed
              ]}
              onPress={handleForgot}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={Colors.brand.secondary} />
              ) : (
                <Text style={styles.actionButtonText}>Enviar código</Text>
              )}
            </Pressable>

            <Pressable onPress={() => router.back()} style={styles.backLinkRow}>
              <Ionicons name="arrow-back" size={16} color={Colors.brand.secondary} />
              <Text style={styles.backLinkTextBlue}>Volver al inicio de sesión</Text>
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
    flexGrow: 1,
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
  headerCentered: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 40,
    gap: 16,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    ...Shadow.light,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.brand.secondary,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.brand.muted,
    lineHeight: 24,
    fontWeight: '500',
    textAlign: 'center',
  },
  emailText: {
    color: Colors.brand.secondary,
    fontWeight: '800',
  },
  form: {
    gap: 20,
    alignItems: 'center',
    width: '100%',
  },
  inputContainer: {
    gap: 8,
    width: '100%',
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
    width: '100%',
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
  actionButton: {
    backgroundColor: Colors.brand.primary,
    height: 58,
    borderRadius: Rounding.large,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginTop: 10,
    ...Shadow.medium,
  },
  actionButtonText: {
    color: Colors.brand.secondary,
    fontSize: 18,
    fontWeight: '800',
  },
  backLinkRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
  },
  backLinkTextBlue: {
    color: Colors.brand.secondary,
    fontSize: 15,
    fontWeight: '800',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
