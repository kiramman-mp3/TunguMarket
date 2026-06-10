import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { CartProvider } from '../src/context/CartContext';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../src/constants/theme';

function RootLayoutContent() {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Dynamic Island and Status Bar Spacer with Brand Secondary Color */}
      <View style={{ height: insets.top, backgroundColor: Colors.brand.secondary }} />
      <StatusBar style="light" backgroundColor={Colors.brand.secondary} translucent />
      
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <RootLayoutContent />
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}


