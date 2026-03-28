import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Decorative Gradient Background (Simulated via overlay if expo-linear-gradient is missing, but usually included or we can just use static color) */}
      <View style={styles.backgroundAccent} />

      {/* Hero Image */}
      <Image
        source={{ uri: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800' }}
        style={styles.heroImage}
        resizeMode="cover"
      />

      <View style={styles.contentContainer}>
        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>El Marketplace #1 de Ambato</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          El placer de{'\n'}
          <Text style={styles.highlightText}>comprar local</Text>
        </Text>

        {/* Description */}
        <Text style={styles.description}>
          Apoya a los pequeños y medianos emprendimientos de Tungurahua. Descubre productos únicos, seguros y validados por nuestra comunidad.
        </Text>

        {/* Call to Action Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.buttonPrimary,
              pressed && styles.buttonPressed
            ]}
            onPress={() => router.replace('/(tabs)')}
          >
            <Text style={styles.buttonPrimaryText}>Comenzar a comprar</Text>
          </Pressable>

          <View style={styles.authRow}>
            <Pressable
              style={({ pressed }) => [
                styles.buttonOutline,
                pressed && styles.buttonPressed,
                { flex: 1 }
              ]}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.buttonOutlineText}>Ingresar</Text>
            </Pressable>

            <View style={{ width: 12 }} />

            <Pressable
              style={({ pressed }) => [
                styles.buttonOutline,
                pressed && styles.buttonPressed,
                { flex: 1 }
              ]}
              onPress={() => router.push('/(auth)/register')}
            >
              <Text style={styles.buttonOutlineText}>Registrarse</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  backgroundAccent: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(251, 191, 36, 0.2)',
  },
  heroImage: {
    width: '100%',
    height: '40%',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
    alignItems: 'flex-start',
  },
  badge: {
    backgroundColor: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(234, 88, 12, 0.1)',
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  badgeText: {
    color: '#ea580c',
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    color: '#1e3a8a',
    lineHeight: 42,
    marginBottom: 12,
  },
  highlightText: {
    color: '#fbbf24',
  },
  description: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
    marginBottom: 32,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
    position: 'absolute',
    bottom: 50,
    left: 24,
    right: 24,
  },
  buttonPrimary: {
    backgroundColor: '#fbbf24',
    paddingVertical: 18,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
    shadowColor: "#fbbf24",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonPrimaryText: {
    color: '#1e3a8a',
    fontSize: 18,
    fontWeight: 'bold',
  },
  authRow: {
    flexDirection: 'row',
    width: '100%',
  },
  buttonOutline: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  buttonOutlineText: {
    color: '#1e3a8a',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  }
});
