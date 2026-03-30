import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { resendVerification, verifyEmail } from '@/api/auth';
import { useAuth } from '@/context/AuthContext';
import { Colors, Rounding, Shadow, Spacing } from '@/constants/theme';

export default function PendingVerificationScreen() {
  const { email: paramEmail } = useLocalSearchParams<{ email: string }>();
  const [email] = useState(paramEmail || '');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const { login } = useAuth();

  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  useEffect(() => {
    if (!email) {
      Alert.alert('Error', 'No se proporcionó un correo electrónico.');
      router.back();
    }
  }, [email]);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newCode = [...code];
    newCode[index] = value.substring(value.length - 1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }

    if (newCode.every(digit => digit !== '') && value) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleVerify = async (finalCode?: string) => {
    const token = finalCode || code.join('');
    if (token.length !== 6) return;

    setLoading(true);
    try {
      const data = await verifyEmail(email, token);
      setSuccess(true);
      setTimeout(async () => {
        await login(data.user, data.token);
        router.replace('/(tabs)');
      }, 1500);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Código inválido o expirado.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await resendVerification(email);
      Alert.alert('Éxito', 'Se ha enviado un nuevo código a tu correo.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo reenviar el código.');
    } finally {
      setResendLoading(false);
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
            <View style={styles.iconCircle}>
              <Ionicons 
                name={success ? "checkmark-circle" : "mail-open-outline"} 
                size={40} 
                color={success ? Colors.brand.success : Colors.brand.primary} 
              />
            </View>
            <Text style={styles.title}>{success ? '¡Excelente!' : 'Verifica tu cuenta'}</Text>
            <Text style={styles.subtitle}>
              {success 
                ? 'Cuenta verificada correctamente. Iniciando...' 
                : 'Ingresa el código de 6 dígitos que enviamos a:'}
            </Text>
            {!success && <Text style={styles.emailText}>{email}</Text>}
          </View>

          {!success && (
            <View style={styles.form}>
              <View style={styles.codeContainer}>
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={inputRefs[index]}
                    style={[
                      styles.codeInput,
                      digit !== '' && styles.codeInputActive,
                      loading && styles.codeInputDisabled
                    ]}
                    keyboardType="number-pad"
                    maxLength={1}
                    value={digit}
                    onChangeText={(v) => handleChange(index, v)}
                    onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                    editable={!loading}
                  />
                ))}
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.verifyButton,
                  (pressed || loading || code.some(d => !d)) && styles.buttonDisabled
                ]}
                onPress={() => handleVerify()}
                disabled={loading || code.some(d => !d)}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.brand.secondary} />
                ) : (
                  <Text style={styles.verifyButtonText}>Verificar cuenta</Text>
                )}
              </Pressable>

              <View style={styles.footer}>
                <Pressable 
                  onPress={handleResend} 
                  disabled={resendLoading || loading}
                  style={styles.resendButton}
                >
                  {resendLoading ? (
                    <ActivityIndicator size="small" color={Colors.brand.secondary} />
                  ) : (
                    <>
                      <Ionicons name="send-outline" size={16} color={Colors.brand.secondary} />
                      <Text style={styles.resendText}>Reenviar código</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {success && (
            <View style={styles.successContainer}>
               <ActivityIndicator color={Colors.brand.secondary} size="large" />
            </View>
          )}
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
    marginBottom: 20,
    ...Shadow.light,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    gap: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...Shadow.light,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.brand.secondary,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.brand.muted,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  emailText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.brand.secondary,
    marginTop: -8,
  },
  form: {
    gap: 32,
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  codeInput: {
    flex: 1,
    height: 64,
    borderWidth: 2,
    borderColor: Colors.brand.border,
    borderRadius: Rounding.large,
    fontSize: 24,
    fontWeight: '800',
    color: Colors.brand.secondary,
    textAlign: 'center',
    backgroundColor: Colors.brand.surface,
  },
  codeInputActive: {
    borderColor: Colors.brand.primary,
    backgroundColor: '#fffdf4',
  },
  codeInputDisabled: {
    opacity: 0.6,
  },
  verifyButton: {
    backgroundColor: Colors.brand.primary,
    height: 58,
    borderRadius: Rounding.large,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.medium,
  },
  verifyButtonText: {
    color: Colors.brand.secondary,
    fontSize: 18,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
  },
  resendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
  },
  resendText: {
    color: Colors.brand.secondary,
    fontSize: 15,
    fontWeight: '800',
  },
  successContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
});
