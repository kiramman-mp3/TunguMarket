import { StyleSheet, View, Text, FlatList, Image, TouchableOpacity } from 'react-native';

const products = [
  {
    id: '1',
    name: 'Pan de Pinllo Artesanal',
    vendor: 'Panadería Tradición Pinllo',
    price: '$3.50',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '2',
    name: 'Chaqueta de Cuero Quisapincha',
    vendor: 'Cueros Andinos',
    price: '$85.00',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '3',
    name: 'Pantalón Denim Pelileo',
    vendor: 'Textiles Ciudad Azul',
    price: '$25.00',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: '4',
    name: 'Canasta de Frutas Ambateñas',
    vendor: 'Huertos de Ficoa',
    price: '$12.00',
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=400'
  }
];

export default function ExploreScreen() {
  const renderItem = ({ item }: { item: typeof products[0] }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <View style={styles.headerRow}>
          <Text style={styles.rating}>⭐ {item.rating}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.vendor}>Vendido por: {item.vendor}</Text>
        <View style={styles.bottomRow}>
          <Text style={styles.price}>{item.price}</Text>
          <TouchableOpacity style={styles.cartBtn}>
            <Text style={styles.cartIcon}>🛒</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Explorar TunguMarket</Text>
      <Text style={styles.subtitle}>Lo mejor de nuestra provincia.</Text>
      
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 20,
    paddingTop: 60, // Safe area roughly
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 24,
  },
  listContainer: {
    paddingBottom: 40,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: 'hidden',
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  rating: {
    fontSize: 12,
    color: '#fbbf24',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e3a8a',
    marginBottom: 4,
  },
  vendor: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 16,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 12,
  },
  price: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ea580c',
  },
  cartBtn: {
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 20,
  },
  cartIcon: {
    fontSize: 16,
  }
});
