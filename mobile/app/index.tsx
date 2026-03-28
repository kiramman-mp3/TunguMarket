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

        {/* Call to Action Button */}
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed
          ]}
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.buttonText}>Comenzar a comprar</Text>
        </Pressable>
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
    backgroundColor: 'rgba(251, 191, 36, 0.2)', // brand-primary alpha
  },
  heroImage: {
    width: '100%',
    height: '45%',
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
    color: '#ea580c', // brand-accent
    fontSize: 12,
    fontWeight: '700',
  },
  title: {
    fontSize: 42,
    fontWeight: '900',
    color: '#1e3a8a', // brand-secondary
    lineHeight: 46,
    marginBottom: 16,
  },
  highlightText: {
    color: '#fbbf24', // brand-primary
  },
  description: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#fbbf24',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
    shadowColor: "#fbbf24",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
    opacity: 0.9,
  },
  buttonText: {
    color: '#1e3a8a',
    fontSize: 18,
    fontWeight: 'bold',
  }
});
