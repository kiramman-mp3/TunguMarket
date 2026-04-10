import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faStar, 
  faShoppingBag, 
  faStore, 
  faMapMarkerAlt, 
  faShieldAlt, 
  faTruck, 
  faArrowLeft,
  faMinus,
  faPlus,
  faShareAlt,
  faAlignLeft,
  faCheck
} from '@fortawesome/free-solid-svg-icons';
import { getProductById } from '../api/product';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const ProductDetails = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const { id } = useParams();
// ... (omitted lines)
  const handleAddToCart = async () => {
    try {
      await addToCart(product, quantity);
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await getProductById(id);
        setProduct(response.data);
      } catch (err) {
        setError('No pudimos encontrar el producto solicitado.');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleQuantityChange = (val) => {
    const newQty = quantity + val;
    if (newQty >= 1 && newQty <= (product?.stock || 1)) {
      setQuantity(newQty);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-primary border-t-transparent"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20 px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-brand-secondary mb-4">{error || 'Producto no encontrado'}</h2>
          <Link to="/shop" className="btn-primary py-3 px-8">Volver al catálogo</Link>
        </div>
      </div>
    );
  }

  // Placeholder images logic
  const images = product.images?.length > 0 
    ? product.images.map(img => img.image_url) 
    : [product.primary_image || product.main_image || product.image_url || 'https://via.placeholder.com/800x600?text=Sin+Imagen'];

  return (
    <div className="min-h-screen bg-brand-light/20 pt-20 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Breadcrumbs / Back */}
        <div className="mb-8 flex items-center justify-between">
          <Link to="/shop" className="flex items-center gap-2 text-gray-500 hover:text-brand-primary font-bold transition-colors">
            <FontAwesomeIcon icon={faArrowLeft} />
            Volver al catálogo
          </Link>
          <button className="text-gray-400 hover:text-brand-secondary transition-colors">
            <FontAwesomeIcon icon={faShareAlt} />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Gallery Section */}
          <div className="lg:w-1/2 space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card overflow-hidden rounded-[2rem] aspect-square relative"
            >
              <img 
                src={images[activeImage]} 
                alt={product.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-6 right-6 bg-brand-secondary text-white px-4 py-2 rounded-full font-bold shadow-lg">
                ${parseFloat(product.price).toFixed(2)}
              </div>
            </motion.div>
            
            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                {images.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setActiveImage(idx)}
                    className={`w-24 h-24 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${
                      activeImage === idx ? 'border-brand-primary shadow-md scale-95' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="lg:w-1/2 space-y-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="bg-brand-light text-brand-secondary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  {product.category_name}
                </span>
                <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                  <FontAwesomeIcon icon={faStar} />
                  <span>{product.average_rating || '5.0'}</span>
                  <span className="text-gray-400 font-medium">({product.review_count || 0} reseñas)</span>
                </div>
              </div>
              
              <h1 className="text-4xl md:text-5xl font-display font-black text-brand-secondary leading-tight">
                {product.title}
              </h1>

              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2 text-gray-500 font-medium">
                  <FontAwesomeIcon icon={faStore} className="text-brand-primary" />
                  Vendido por: <span className="text-brand-secondary font-bold hover:underline cursor-pointer">{product.seller_name}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 font-medium">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="text-brand-primary" />
                  Ubicación: <span className="text-brand-secondary font-bold">{product.location || 'Ambato'}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] shadow-premium border border-gray-50 space-y-6">
              {user && product.seller_id === user.id && (
                <div className="bg-brand-primary/10 border-2 border-brand-primary/20 rounded-2xl p-6 mb-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-brand-primary text-brand-secondary flex items-center justify-center text-xl">
                      <FontAwesomeIcon icon={faStore} />
                    </div>
                    <div>
                      <h4 className="font-black text-brand-secondary">Este es tu producto</h4>
                      <p className="text-xs font-bold text-brand-secondary/60 uppercase tracking-wider">Modo Administrador</p>
                    </div>
                  </div>
                  <Link 
                    to={`/edit-product/${product.id}`}
                    className="btn-primary w-full py-4 flex items-center justify-center gap-3 font-black transition-transform active:scale-95"
                  >
                    <FontAwesomeIcon icon={faAlignLeft} />
                    Editar detalles y stock
                  </Link>
                </div>
              )}

              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-brand-primary mb-3">Descripción</h3>
                <p className="text-gray-600 leading-relaxed font-medium">
                  {product.description || 'Sin descripción disponible para este producto.'}
                </p>
              </div>

              <div className="pt-6 border-t border-gray-100 flex flex-wrap gap-6">
                <div className="flex items-center gap-3 text-sm font-bold text-brand-secondary">
                  <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center">
                    <FontAwesomeIcon icon={faShieldAlt} />
                  </div>
                  Compra Segura
                </div>
                <div className="flex items-center gap-3 text-sm font-bold text-brand-secondary">
                  <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FontAwesomeIcon icon={faTruck} />
                  </div>
                  Entrega local garantizada
                </div>
              </div>
            </div>

            {(!user || product.seller_id !== user.id) && (
              <div className="space-y-6">
                <div className="flex items-center gap-8">
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Cantidad</h3>
                    <div className="flex items-center bg-white rounded-2xl border-2 border-gray-100 p-1">
                      <button 
                        onClick={() => handleQuantityChange(-1)}
                        className="w-10 h-10 rounded-xl hover:bg-brand-light transition-colors text-brand-secondary"
                      >
                        <FontAwesomeIcon icon={faMinus} size="xs" />
                      </button>
                      <span className="w-12 text-center font-bold text-brand-secondary">{quantity}</span>
                      <button 
                        onClick={() => handleQuantityChange(1)}
                        className="w-10 h-10 rounded-xl hover:bg-brand-light transition-colors text-brand-secondary"
                      >
                        <FontAwesomeIcon icon={faPlus} size="xs" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-grow space-y-2">
                    <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Precio Total</h3>
                    <p className="text-3xl font-black text-brand-accent">
                      ${(parseFloat(product.price) * quantity).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={handleAddToCart}
                    className={`flex-grow py-4 text-lg flex items-center justify-center gap-3 group transition-all font-bold rounded-2xl ${
                      added ? 'bg-green-500 text-white shadow-lg' : 'btn-primary'
                    }`}
                  >
                    <FontAwesomeIcon icon={added ? faCheck : faShoppingBag} className="group-hover:scale-110 transition-transform" />
                    {added ? '¡Producto Añadido!' : 'Agregar al Carrito'}
                  </button>
                  <button className="btn-outline w-16 h-16 rounded-[1.25rem] flex items-center justify-center hover:bg-red-50 hover:text-red-500 hover:border-red-200 transition-all">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-xs text-center text-gray-400 font-medium">
                  {product.stock > 0 ? `Stock disponible: ${product.stock} unidades` : 'Agotado temporalmente'}
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
