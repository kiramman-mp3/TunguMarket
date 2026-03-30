import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Rounding, Shadow, Spacing } from '../constants/theme';

interface BanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BanModal: React.FC<BanModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="fade"
    >
      <View className="flex-1 items-center justify-center bg-black/60 px-6 backdrop-blur-sm">
        <View className="w-full max-w-sm overflow-hidden rounded-[24px] bg-white p-8 shadow-2xl">
          {/* Top Decorative Line */}
          <View className="absolute top-0 left-0 h-1.5 w-full bg-brand-error" />

          <View className="items-center text-center">
            {/* Warning Icon Container */}
            <View className="mb-6 h-20 w-20 items-center justify-center rounded-full bg-brand-error/10 border-2 border-brand-error/20">
              <Ionicons name="warning" size={48} color={Colors.brand.error} />
            </View>

            {/* Title */}
            <Text className="mb-2 text-center text-2xl font-extrabold text-brand-secondary">
              Cuenta Suspendida
            </Text>
            
            {/* Message */}
            <Text className="mb-8 text-center text-base leading-6 text-brand-muted">
              Tu acceso a <Text className="font-bold text-brand-secondary">TunguMarket</Text> ha sido restringido por seguridad debido al incumplimiento de nuestras políticas.
            </Text>

            {/* Logout Button */}
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.8}
              className="w-full h-14 items-center justify-center rounded-2xl bg-brand-secondary shadow-md"
              style={Shadow.medium}
            >
              <Text className="text-lg font-bold text-white">Continuar</Text>
            </TouchableOpacity>
            
            {/* Support Link */}
            <Text className="mt-6 text-center text-xs text-brand-muted font-medium">
              ¿Dudas? <Text className="text-brand-secondary underline">soporte@tungumarket.com</Text>
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default BanModal;

const styles = StyleSheet.create({});
