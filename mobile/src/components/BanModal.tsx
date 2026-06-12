import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadow } from '../constants/theme';

interface BanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const { width } = Dimensions.get('window');

const BanModal: React.FC<BanModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="fade"
      onRequestClose={onClose}
      hardwareAccelerated={true}
      statusBarTranslucent={true}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          {/* Top Decorative Line */}
          <View style={styles.topDecoration} />

          <View style={styles.content}>
            {/* Warning Icon Container */}
            <View style={styles.iconContainer}>
              <Ionicons name="warning" size={52} color={Colors.brand.error} />
            </View>

            {/* Title */}
            <Text style={styles.title}>
              Cuenta{'\n'}
              <Text style={styles.titleError}>Suspendida</Text>
            </Text>
            
            {/* Message */}
            <Text style={styles.message}>
              Tu acceso a <Text style={styles.messageBold}>TunguMarket</Text> ha sido restringido por incumplimiento de nuestras políticas de seguridad.
            </Text>

            {/* Logout Button */}
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              style={[styles.button, Shadow.medium]}
            >
              <Text style={styles.buttonText}>Cerrar Sesión Segura</Text>
            </TouchableOpacity>
            
            {/* Support Link */}
            <Text style={styles.supportText}>
              ¿Dudas? Escríbenos:{'\n'}
              <Text style={styles.supportLink}>soporte@tungumarket.com</Text>
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default BanModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11, 15, 25, 0.65)',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    padding: 36,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 15,
  },
  topDecoration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: Colors.brand.error,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 28,
    height: 96,
    width: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 2,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 34,
    fontWeight: '900',
    color: Colors.brand.secondary,
    lineHeight: 40,
  },
  titleError: {
    color: Colors.brand.error,
  },
  message: {
    marginBottom: 36,
    textAlign: 'center',
    fontSize: 17,
    lineHeight: 26,
    color: '#4B5563',
  },
  messageBold: {
    fontWeight: '700',
    color: '#1F2937',
  },
  button: {
    width: '100%',
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.brand.secondary,
    borderRadius: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  supportText: {
    marginTop: 24,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    lineHeight: 20,
  },
  supportLink: {
    color: Colors.brand.secondary,
    textDecorationLine: 'underline',
  },
});
