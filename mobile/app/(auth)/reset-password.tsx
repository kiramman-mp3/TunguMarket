import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { validateResetToken, resetPassword } from '@/api/auth';
import { Colors, Rounding, Shadow, Spacing } from '@/constants/theme';

export default function ResetPasswordScreen() {
  const { email: paramEmail } = useLocalSearchParams<{ email: string }>();
  const [email, setEmail] = useState(paramEmail || '');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Validate, 2: Reset
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const inputRefs = [
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
    useRef<TextInput>(null),
  ];

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;

    const newCode = [...code];
    newCode[index] = value.substring(value.length - 1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs[index + 1].current?.focus();
    }

    if (newCode.every(digit => digit !== '') && value) {
      handleValidate(newCode.join(''));
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current?.focus();
    }
  };

  const handleValidate = async (finalCode?: string) => {
    const token = finalCode || code.join('');
    if (!email || token.length !== 6) {
      Alert.alert('Error', 'Por favor ingresa tu correo y el código de 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      await validateResetToken(email, token);
      setStep(2);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Código inválido o expirado');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    const finalCode = code.join('');
    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    if (password.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, finalCode, password);
      setSuccess(true);
      setTimeout(() => {
        Alert.alert('¡Éxito!', 'Tu contraseña ha sido restablecida correctamente.', [
          { text: 'Aceptar', onPress: () => router.replace('/(auth)/login' as any) }
        ]);
      }, 500);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No se pudo restablecer la contraseña');
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
            <View style={styles.iconCircle}>
              <Ionicons 
                name={success ? "checkmark-circle" : step === 1 ? "shield-checkmark-outline" : "lock-open-outline"} 
                size={40} 
                color={success ? Colors.brand.success : Colors.brand.primary} 
              />
            </View>
            <Text style={styles.title}>{success ? '¡Contraseña Cambiada!' : 'Nueva contraseña'}</Text>
            <Text style={styles.subtitle}>
              {step === 1 
                ? 'Ingresa el código que recibiste para validar tu identidad.' 
                : success 
                  ? 'Ya puedes iniciar sesión con tu nueva clave.' 
                  : 'Ingresa tu nueva clave de acceso segura.'}
            </Text>
          </View>

          {!success && (
            <View style={styles.form}>
              {step === 1 ? (
                <>
                  {!paramEmail && (
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
                  )}

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Código de 6 dígitos</Text>
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
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.actionButton,
                      (pressed || loading || code.some(d => !d)) && styles.buttonDisabled
                    ]}
                    onPress={() => handleValidate()}
                    disabled={loading || code.some(d => !d)}
                  >
                    {loading ? (
                      <ActivityIndicator color={Colors.brand.secondary} />
                    ) : (
                      <Text style={styles.actionButtonText}>Validar código</Text>
                    )}
                  </Pressable>
                </>
              ) : (
                <>
                  <View style={styles.validationNotice}>
                    <Ionicons name="checkmark-circle" size={18} color={Colors.brand.success} />
                    <Text style={styles.validationText}>Código validado para {email}</Text>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Nueva contraseña</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="lock-closed-outline" size={20} color={Colors.brand.muted} style={styles.inputIcon} />
                      <TextInput 
                        style={styles.input}
                        placeholder="••••••••"
                        secureTextEntry
                        autoFocus
                        value={password}
                        onChangeText={setPassword}
                      />
                    </View>
                  </View>

                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>Confirmar contraseña</Text>
                    <View style={styles.inputWrapper}>
                      <Ionicons name="key-outline" size={20} color={Colors.brand.muted} style={styles.inputIcon} />
                      <TextInput 
                        style={styles.input}
                        placeholder="••••••••"
                        secureTextEntry
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                      />
                    </View>
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.actionButton,
                      (pressed || loading) && styles.buttonPressed
                    ]}
                    onPress={handleReset}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color={Colors.brand.secondary} />
                    ) : (
                      <Text style={styles.actionButtonText}>Restablecer contraseña</Text>
                    )}
                  </Pressable>
                </>
              )}

              <Pressable onPress={() => router.replace('/(auth)/login' as any)} style={styles.backLinkRow}>
                <Ionicons name="arrow-back" size={16} color={Colors.brand.secondary} />
                <Text style={styles.backLinkTextBlue}>Volver al inicio de sesión</Text>
              </Pressable>
            </View>
          )}

          {success && (
            <View style={styles.successContainer}>
              <ActivityIndicator color={Colors.brand.secondary} size="large" />
              <Text style={styles.redirectText}>Redirigiéndote al login...</Text>
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
    flexGrow: 1,
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
  form: {
    gap: 20,
    width: '100%',
    alignItems: 'center',
  },
  validationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: Rounding.large,
    borderWidth: 1,
    borderColor: '#d1fae5',
    width: '100%',
  },
  validationText: {
    color: '#065f46',
    fontSize: 13,
    fontWeight: '700',
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
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    width: '100%',
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
  buttonDisabled: {
    opacity: 0.6,
  },
  successContainer: {
    alignItems: 'center',
    marginTop: 40,
    gap: 16,
  },
  redirectText: {
    color: Colors.brand.muted,
    fontSize: 14,
    fontWeight: '700',
  },
});
