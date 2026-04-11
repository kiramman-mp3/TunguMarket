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
      alert(err.message || 'No se pudo agregar al carrito');
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
      <Link to={`/product/${product.id}`} className="relative aspect-video overflow-hidden block">
        <img 
          src={imageUrl} 
          alt={product.title || product.name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full shadow-sm">
          <span className="text-[10px] font-black uppercase text-brand-secondary tracking-wider">
            {product.category_name || product.category || 'General'}
          </span>
        </div>
        <div className="absolute bottom-4 right-4 bg-brand-secondary/90 backdrop-blur text-white px-3 py-1 rounded-lg font-black shadow-lg border border-white/10">
          ${price.toFixed(2)}
        </div>
      </Link>
      
      <div className="p-5 flex flex-col flex-grow">
        {/* Título arriba */}
        <Link to={`/product/${product.id}`} className="mb-2">
          <h3 className="text-xl font-bold text-brand-secondary group-hover:text-brand-primary transition-colors line-clamp-2 min-h-[3.5rem] flex items-center leading-snug">
            {product.title || product.name}
          </h3>
        </Link>

        {/* Reseñas abajo a la izquierda del título */}
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center gap-1 text-amber-500 font-black text-sm">
            <span>{product.average_rating || '5.0'}</span>
            <FontAwesomeIcon icon={faStar} className="text-[10px]" />
          </div>
          <span className="text-[11px] text-gray-400 font-bold uppercase tracking-tighter">
            ({product.review_count || 0}) reseñas
          </span>
        </div>
        
        {/* Vendedor (Clicable) */}
        <div className="flex items-center gap-2 text-gray-400 text-[11px] mb-6 font-bold uppercase tracking-tight">
          <FontAwesomeIcon icon={faStore} className="text-brand-primary/60" />
          <Link 
            to={`/seller/${product.seller_id}`} 
            className="text-brand-secondary/80 hover:text-brand-primary transition-colors decoration-brand-primary/30 underline-offset-2 hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            {product.seller_name || product.vendor || 'Vendedor Local'}
          </Link>
        </div>

        <div className="mt-auto flex gap-2">
          {isOwner ? (
            <Link 
              to={`/product/${product.id}`}
              className="w-full py-3.5 rounded-xl bg-brand-light text-brand-secondary font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-primary transition-all border border-brand-primary/20 shadow-sm"
            >
              <FontAwesomeIcon icon={faStore} />
              Gestionar Producto
            </Link>
          ) : (
            <>
              <Link 
                to={`/product/${product.id}`}
                className="flex-grow py-3.5 rounded-xl bg-brand-secondary text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-primary transition-all shadow-md group/btn"
              >
                Ver Producto
              </Link>
              <button 
                onClick={handleAddToCart}
                disabled={added}
                className={`w-14 h-12.5 flex items-center justify-center rounded-xl transition-all shadow-sm ${
                  added 
                  ? 'bg-green-500 text-white' 
                  : 'bg-brand-primary text-brand-secondary hover:scale-105 active:scale-95'
                }`}
                title="Agregar al carrito"
              >
                <FontAwesomeIcon icon={added ? faCheck : faShoppingBag} className={added ? "" : "group-hover:rotate-12 transition-transform"} />
              </button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ProductCard;
