import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faShoppingBag, faMapMarkerAlt, faTag, faStore } from '@fortawesome/free-solid-svg-icons';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Categories from '../components/Categories';

// Hardcoded products for initial demonstration
const HARDCODED_PRODUCTS = [
  {
    id: 1,
    name: 'Zapatos de Cuero Artesanal',
    price: 45.00,
    category: 'Calzado',
    rating: 4.8,
    reviews: 24,
    image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&q=80&w=400',
    vendor: 'Cueros Ambato',
    location: 'Quisapincha'
  },
  {
    id: 2,
    name: 'Pack de Frutas Exóticas',
    price: 12.50,
    category: 'Alimentos',
    rating: 4.9,
    reviews: 56,
    image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&q=80&w=400',
    vendor: 'Huertos Tungurahua',
    location: 'Ambato'
  },
  {
    id: 3,
    name: 'Pan de Pinllo Tradicional',
    price: 3.00,
    category: 'Alimentos',
    rating: 5.0,
    reviews: 120,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=400',
    vendor: 'Panadería La Abuela',
    location: 'Pinllo'
  },
  {
    id: 4,
    name: 'Chaqueta de Cuero Premium',
    price: 120.00,
    category: 'Ropa',
    rating: 4.7,
    reviews: 15,
    image: 'https://images.unsplash.com/photo-1551028150-64b9f398f678?auto=format&fit=crop&q=80&w=400',
    vendor: 'Design Leather',
    location: 'Quisapincha'
  },
  {
    id: 5,
    name: 'Cesta de Dulces de Guayaba',
    price: 8.00,
    category: 'Dulces',
    rating: 4.6,
    reviews: 42,
    image: 'https://images.unsplash.com/photo-1582208942219-3540ce208ecb?auto=format&fit=crop&q=80&w=400',
    vendor: 'Dulces Ambato',
    location: 'Centro Histórico'
  },
  {
    id: 6,
    name: 'Sombrero de Paja Toquilla',
    price: 35.00,
    category: 'Artesanías',
    rating: 4.9,
    reviews: 30,
    image: 'https://images.unsplash.com/photo-1572451479139-6a308211d8be?auto=format&fit=crop&q=80&w=400',
    vendor: 'Artesanías Tungurahua',
    location: 'Huachi Chico'
  }
];

const ProductGallery = () => {
  return (
    <section className="py-24 bg-white" id="productos">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 text-center md:text-left">
          <div className="space-y-4">
            <span className="text-brand-primary font-bold uppercase tracking-widest text-xs">Lo mejor de Ambato</span>
            <h2 className="text-4xl font-display font-bold text-brand-secondary">Productos Destacados</h2>
            <p className="text-gray-500 font-medium max-w-lg">
              Descubre la calidad y el sabor de nuestra tierra. Productos directos de emprendedores locales para ti.
            </p>
          </div>
          <button className="btn-outline flex items-center gap-2 group">
            Ver todas las categorías
            <FontAwesomeIcon icon={faTag} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {HARDCODED_PRODUCTS.map((product) => (
            <motion.div
              key={product.id}
              whileHover={{ y: -10 }}
              className="glass-card overflow-hidden group border border-gray-100 hover:border-brand-primary/30 transition-all duration-300"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-sm">
                  <span className="text-xs font-bold text-brand-secondary">{product.category}</span>
                </div>
                <div className="absolute bottom-4 right-4 bg-brand-secondary text-white px-3 py-1 rounded-full font-bold shadow-lg">
                  ${product.price.toFixed(2)}
                </div>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-bold text-brand-secondary group-hover:text-brand-primary transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-1 text-amber-500">
                    <FontAwesomeIcon icon={faStar} className="text-xs" />
                    <span className="text-sm font-bold">{product.rating}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 text-gray-400 text-xs mb-6 font-medium">
                  <FontAwesomeIcon icon={faMapMarkerAlt} />
                  <span>{product.location}</span>
                  <span className="mx-1">•</span>
                  <FontAwesomeIcon icon={faStore} />
                  <span className="text-brand-secondary/70">{product.vendor}</span>
                </div>

                <button className="btn-primary w-full py-3 flex items-center justify-center gap-2 group shadow-sm">
                  <FontAwesomeIcon icon={faShoppingBag} className="group-hover:scale-110 transition-transform" />
                  Agregar al Carrito
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Home = () => {
  return (
    <>
      <Hero />
      <ProductGallery />
      <Features />
      <Categories />
    </>
  );
};

export default Home;
