import React from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { Colors } from '../../src/constants/theme';
import { getImageUrl } from '../../src/api/client';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres salir de tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', style: 'destructive', onPress: async () => { await logout(); router.replace('/(tabs)/' as any); } }
      ]
    );
  };

  if (!user) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="person-circle-outline" size={80} color={Colors.brand.muted} />
        <Text style={styles.centerTitle}>Ingresa a tu cuenta</Text>
        <Text style={styles.centerSubtitle}>Inicia sesión para ver tu perfil, compras, ventas y billetera virtual.</Text>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => router.push('/(auth)/login' as any)}
        >
          <Text style={styles.actionBtnText}>Iniciar Sesión</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isSeller = user.role_name === 'vendedor' || user.seller_name; // Fallback or computed
  const balance = parseFloat(user.balance || 0);

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.userCard}>
          <Image
            source={{ uri: getImageUrl(user.avatar_url) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200' }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
            <View style={styles.roleRow}>
            </View>
          </View>
        </View>

        {/* Completar Perfil button just like web */}
        <TouchableOpacity
          style={styles.profileCompletionBtn}
          onPress={() => router.push('/profile/edit-profile')}
        >
          <Text style={styles.profileCompletionText}>Completar Perfil / cambiar foto 📸</Text>
        </TouchableOpacity>

        {/* Seller Wallet Panel */}
        {isSeller && (
          <View style={styles.walletPanel}>
            <View style={styles.walletHeader}>
              <View>
                <Text style={styles.walletLabel}>Balance Virtual</Text>
                <Text style={styles.walletValue}>${balance.toFixed(2)}</Text>
              </View>
              {user.blocked_for_debt ? (
                <View style={[styles.statusBadge, styles.statusDebt]}>
                  <Text style={styles.statusDebtText}>Bloqueado por Deuda</Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, styles.statusOk]}>
                  <Text style={styles.statusOkText}>Activo</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.walletAction}
              onPress={() => router.push('/profile/wallet')}
            >
              <Text style={styles.walletActionText}>Detalle de movimientos</Text>
              <Ionicons name="arrow-forward" size={16} color={Colors.brand.secondary} />
            </TouchableOpacity>
          </View>
        )}

        {/* Seller Section */}
        {isSeller && (
          <View style={styles.menuGroup}>
            <Text style={styles.menuGroupTitle}>Panel de Ventas</Text>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/sales')}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="cube-outline" size={22} color={Colors.brand.secondary} />
                <Text style={styles.menuItemText}>Mis Ventas (Pedidos recibidos)</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.brand.muted} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/bank-accounts')}>
              <View style={styles.menuItemLeft}>
                <Ionicons name="card-outline" size={22} color={Colors.brand.secondary} />
                <Text style={styles.menuItemText}>Cuentas Bancarias para cobros</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.brand.muted} />
            </TouchableOpacity>
          </View>
        )}

        {/* General User Section */}
        <View style={styles.menuGroup}>
          <Text style={styles.menuGroupTitle}>Mi Cuenta</Text>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/edit-profile')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="person-outline" size={22} color={Colors.brand.secondary} />
              <Text style={styles.menuItemText}>Editar Perfil</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.brand.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/orders')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="receipt-outline" size={22} color={Colors.brand.secondary} />
              <Text style={styles.menuItemText}>Mis Compras</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.brand.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/addresses')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="location-outline" size={22} color={Colors.brand.secondary} />
              <Text style={styles.menuItemText}>Mis Direcciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.brand.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/wishlist')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="heart-outline" size={22} color={Colors.brand.secondary} />
              <Text style={styles.menuItemText}>Lista de Favoritos</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.brand.muted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/profile/notifications')}>
            <View style={styles.menuItemLeft}>
              <Ionicons name="notifications-outline" size={22} color={Colors.brand.secondary} />
              <Text style={styles.menuItemText}>Notificaciones</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.brand.muted} />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={Colors.brand.error} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingTop: 12,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.brand.secondary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 13,
    color: Colors.brand.muted,
    marginBottom: 6,
  },
  roleBadge: {
    backgroundColor: 'rgba(30, 58, 138, 0.06)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.brand.secondary,
    textTransform: 'uppercase',
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  editBtnMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  editBtnMiniText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.brand.secondary,
  },
  profileCompletionBtn: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#e2e8f0',
    borderRadius: 18,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    backgroundColor: '#ffffff',
  },
  profileCompletionText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.muted,
  },
  walletPanel: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    overflow: 'hidden',
    marginBottom: 20,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  walletLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.brand.muted,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  walletValue: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.brand.dark,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusDebt: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusDebtText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.brand.error,
  },
  statusOk: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  statusOkText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.brand.success,
  },
  walletAction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(251, 191, 36, 0.05)',
  },
  walletActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.brand.secondary,
  },
  menuGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  menuGroupTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.brand.muted,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.brand.dark,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
    height: 56,
    borderRadius: 18,
    marginTop: 10,
  },
  logoutText: {
    color: Colors.brand.error,
    fontSize: 16,
    fontWeight: '800',
  },
  centerContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  centerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.brand.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  centerSubtitle: {
    fontSize: 14,
    color: Colors.brand.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  actionBtn: {
    backgroundColor: Colors.brand.primary,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
  },
  actionBtnText: {
    color: Colors.brand.secondary,
    fontWeight: '800',
    fontSize: 16,
  },
});
