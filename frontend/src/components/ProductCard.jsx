import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faShoppingBag, faMapMarkerAlt, faStore, faCheck } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';
import { useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  
  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await addToCart(product, 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };
  
  // Manejo de fallback para imágenes y datos
  const imageUrl = product.primary_image || product.main_image || product.image_url || 'https://via.placeholder.com/400x300?text=Sin+Imagen';
  const price = typeof product.price === 'number' ? product.price : parseFloat(product.price);

  const isOwner = user && user.id === product.seller_id;

  return (
    <motion.div
      whileHover={{ y: -10 }}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      className={`glass-card overflow-hidden group border transition-all duration-300 flex flex-col h-full ${
        isOwner ? 'border-brand-primary/40 bg-brand-light/5' : 'border-gray-100 hover:border-brand-primary/30'
      }`}
    >
      <Link to={`/product/${product.id}`} className="relative aspect-[4/3] overflow-hidden block">
        <img 
          src={imageUrl} 
          alt={product.title || product.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-sm">
          <span className="text-xs font-bold text-brand-secondary">
            {product.category_name || product.category || 'General'}
          </span>
        </div>
        {isOwner && (
          <div className="absolute top-4 right-4 bg-brand-primary text-brand-secondary px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shadow-sm animate-pulse">
            Tu Producto
          </div>
        )}
        <div className="absolute bottom-4 right-4 bg-brand-secondary text-white px-3 py-1 rounded-full font-bold shadow-lg">
          ${price.toFixed(2)}
        </div>
      </Link>
      
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <Link to={`/product/${product.id}`}>
            <h3 className="text-lg font-bold text-brand-secondary group-hover:text-brand-primary transition-colors line-clamp-1">
              {product.title || product.name}
            </h3>
          </Link>
          <div className="flex items-center gap-1 text-amber-500 flex-shrink-0 ml-2">
            <FontAwesomeIcon icon={faStar} className="text-xs" />
            <span className="text-sm font-bold">{product.average_rating || product.rating || '0.0'}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-gray-400 text-xs mb-6 font-medium">
          <FontAwesomeIcon icon={faMapMarkerAlt} />
          <span className="truncate">{product.location || 'Ambato'}</span>
          <span className="mx-1">•</span>
          <FontAwesomeIcon icon={faStore} />
          <span className="text-brand-secondary/70 truncate">{product.seller_name || product.vendor || 'Vendedor Local'}</span>
        </div>

        <div className="mt-auto">
          {isOwner ? (
            <Link 
              to={`/product/${product.id}`}
              className="w-full py-3 rounded-xl border-2 border-brand-primary text-brand-secondary font-bold text-sm flex items-center justify-center gap-2 hover:bg-brand-primary transition-all group"
            >
              <FontAwesomeIcon icon={faStore} className="group-hover:rotate-12 transition-transform" />
              Ver y Gestionar
            </Link>
          ) : (
            <button 
              onClick={handleAddToCart}
              className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 group shadow-sm transition-all font-bold text-sm ${
                added 
                ? 'bg-green-500 text-white border-green-500' 
                : 'btn-primary'
              }`}
            >
              <FontAwesomeIcon icon={added ? faCheck : faShoppingBag} className="group-hover:scale-110 transition-transform" />
              {added ? '¡Añadido!' : 'Agregar al Carrito'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
