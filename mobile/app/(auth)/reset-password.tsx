import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { validateResetToken, resetPassword } from '../../src/api/auth';

export default function ResetPasswordScreen() {
  const { email: paramEmail } = useLocalSearchParams<{ email: string }>();
  const [email, setEmail] = useState(paramEmail || '');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: Validate, 2: Reset
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

    // Auto-validate if 6th digit is entered
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

    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, finalCode, password);
      Alert.alert('¡Éxito!', 'Tu contraseña ha sido restablecida correctamente.', [
        { text: 'Aceptar', onPress: () => router.replace('/(auth)/login' as any) }
      ]);
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1e3a8a" />
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>Nueva contraseña</Text>
            <Text style={styles.subtitle}>
              {step === 1 
                ? 'Ingresa el código que recibiste para validar tu identidad.' 
                : 'Ingresa tu nueva clave de acceso.'}
            </Text>
          </View>

          <View style={styles.form}>
            {step === 1 ? (
              <>
                {!paramEmail && (
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
                )}

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Código de 6 dígitos</Text>
                  <View style={styles.codeContainer}>
                    {code.map((digit, index) => (
                      <TextInput
                        key={index}
                        ref={inputRefs[index]}
                        style={styles.codeInput}
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
                    <ActivityIndicator color="#1e3a8a" />
                  ) : (
                    <Text style={styles.actionButtonText}>Validar código</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.validationNotice}>
                  <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                  <Text style={styles.validationText}>Código validado para {email}</Text>
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.label}>Nueva contraseña</Text>
                  <View style={styles.inputWrapper}>
                    <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
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
                    <Ionicons name="lock-closed-outline" size={20} color="#64748b" style={styles.inputIcon} />
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
                    <ActivityIndicator color="#1e3a8a" />
                  ) : (
                    <Text style={styles.actionButtonText}>Restablecer contraseña</Text>
                  )}
                </Pressable>
              </>
            )}
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
    marginBottom: 32,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e3a8a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
  form: {
    gap: 24,
  },
  validationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ecfdf5',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  validationText: {
    color: '#065f46',
    fontSize: 14,
    fontWeight: '600',
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
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  codeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 6,
  },
  codeInput: {
    flex: 1,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    fontSize: 18,
    fontWeight: '700',
    color: '#1e3a8a',
    textAlign: 'center',
    backgroundColor: '#f8fafc',
  },
  actionButton: {
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
  actionButtonText: {
    color: '#1e3a8a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});
