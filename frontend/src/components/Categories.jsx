import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faShoppingCart } from '@fortawesome/free-solid-svg-icons';

const products = [
  {
    id: 1,
    name: 'Pan de Pinllo Artesanal',
    vendor: 'Panadería Tradición Pinllo',
    price: '$3.50',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&q=80&w=800' // Pan artesanal rústico
  },
  {
    id: 2,
    name: 'Chaqueta de Cuero Quisapincha',
    vendor: 'Cueros Andinos',
    price: '$85.00',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=800' // Chaqueta de cuero
  },
  {
    id: 3,
    name: 'Pantalón Denim Pelileo',
    vendor: 'Textiles Ciudad Azul',
    price: '$25.00',
    rating: 4.7,
    image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&q=80&w=800' // Jeans
  },
  {
    id: 4,
    name: 'Canasta de Frutas Ambateñas',
    vendor: 'Huertos de Ficoa',
    price: '$12.00',
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=800' // Frutas (duraznos/peras)
  }
];

const Categories = () => {
  return (
    <section id="categorias" className="py-16 bg-white relative overflow-hidden">
      <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-32 w-64 h-64 bg-brand-primary/10 rounded-full blur-3xl mix-blend-multiply"></div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
          <div className="max-w-xl">
            <h2 className="text-3xl sm:text-4xl font-black text-brand-secondary mb-4">
              Descubre lo mejor de Ambato
            </h2>
            <p className="text-lg text-gray-500">
              Explora una variedad de productos curados exclusivamente de los emprendimientos locales más valorados.
            </p>
          </div>
          <button className="hidden md:inline-flex btn-outline pb-2 pt-2 text-sm mt-6">
            Ver todo el catálogo
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {products.map((product, index) => (
            <motion.div 
              key={product.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden group flex flex-col h-full"
            >
              {/* Product Image */}
              <div className="h-64 overflow-hidden relative">
                <div className="absolute inset-0 bg-brand-secondary/5 group-hover:bg-transparent transition-colors z-10"></div>
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />
                
                {/* Overlay actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-center justify-center backdrop-blur-[2px]">
                  <button className="bg-white text-brand-secondary font-bold py-2 px-6 rounded-full transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 hover:bg-brand-primary hover:text-brand-secondary shadow-lg">
                    Vista Rápida
                  </button>
                </div>
              </div>
              
              {/* Product Info */}
              <div className="p-6 flex-grow flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 mb-2 text-brand-primary">
                    <FontAwesomeIcon icon={faStar} className="text-sm" />
                    <span className="text-xs font-bold text-gray-600">{product.rating}</span>
                  </div>
                  <h4 className="text-lg font-bold text-brand-secondary leading-snug mb-1 group-hover:text-brand-primary transition-colors cursor-pointer">
                    {product.name}
                  </h4>
                  <p className="text-xs text-gray-500 font-medium mb-4">Vendído por: {product.vendor}</p>
                </div>
                
                <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                  <span className="text-xl font-black text-brand-accent">{product.price}</span>
                  <button className="w-10 h-10 rounded-full bg-brand-light text-brand-secondary hover:bg-brand-secondary hover:text-white transition-colors flex items-center justify-center">
                    <FontAwesomeIcon icon={faShoppingCart} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <div className="mt-12 text-center md:hidden">
          <button className="btn-outline w-full py-3">
            Ver todo el catálogo
          </button>
        </div>
      </div>
    </section>
  );
};

export default Categories;
