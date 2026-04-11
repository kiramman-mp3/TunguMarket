import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  faCheck,
  faSpinner,
  faHeart
} from '@fortawesome/free-solid-svg-icons';
import { getProductById } from '../api/product';
import { getProductReviews, createReview } from '../api/review';
import { toggleWishlist, getWishlist } from '../api/wishlist';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const ProductDetails = () => {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const [added, setAdded] = useState(false);
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [togglingFavorite, setTogglingFavorite] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const handleAddToCart = async () => {
    try {
      await addToCart(product, quantity);
      setAdded(true);
      setToast({ show: true, message: '¡Producto añadido al carrito!', type: 'success' });
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      setToast({ show: true, message: 'Error al añadir al carrito', type: 'error' });
    }
  };

  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => setToast({ ...toast, show: false }), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [prodRes, revRes] = await Promise.all([
          getProductById(id),
          getProductReviews(id)
        ]);
        setProduct(prodRes.data);
        setReviews(revRes.data.reviews);

        // Verificar si es favorito si el usuario está logueado
        if (localStorage.getItem('tungu_token')) {
          try {
            const wishRes = await getWishlist();
            const isInWishlist = wishRes.data.some(item => item.product_id === id);
            setIsFavorite(isInWishlist);
          } catch (err) {
            console.error('Error cargando wishlist:', err);
          }
        }
      } catch (err) {
        setError('No pudimos encontrar el producto solicitado.');
      } finally {
        setLoading(false);
        setReviewsLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleQuantityChange = (val) => {
    const newQty = quantity + val;
    if (newQty >= 1 && newQty <= (product?.stock || 1)) {
      setQuantity(newQty);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!user) return alert('Debes iniciar sesión para reseñar');
    setSubmittingReview(true);
    try {
      await createReview({ product_id: id, ...reviewData });
      const revRes = await getProductReviews(id);
      setReviews(revRes.data.reviews);
      const prodRes = await getProductById(id);
      setProduct(prodRes.data);
      setShowReviewForm(false);
      setReviewData({ rating: 5, comment: '' });
      alert('¡Reseña publicada con éxito!');
    } catch (err) {
      alert(err.response?.data?.error || 'No puedes reseñar este producto aún. Asegúrate de haberlo recibido primero.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!user) return alert('Debes iniciar sesión para guardar favoritos');
    setTogglingFavorite(true);
    try {
      const res = await toggleWishlist(id);
      setIsFavorite(res.isFavorite);
      setToast({ 
        show: true, 
        message: res.isFavorite ? '¡Añadido a favoritos!' : 'Eliminado de favoritos', 
        type: 'success' 
      });
    } catch (err) {
      setToast({ show: true, message: 'Error al actualizar favoritos', type: 'error' });
    } finally {
      setTogglingFavorite(false);
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
                <div className="flex items-center gap-2 text-gray-500 font-medium whitespace-nowrap">
                  <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm flex items-center justify-center text-[10px] font-black text-brand-secondary">
                    {product.seller_avatar ? (
                      <img src={product.seller_avatar} alt="Seller" className="w-full h-full object-cover" />
                    ) : (
                      <FontAwesomeIcon icon={faStore} className="text-brand-primary" />
                    )}
                  </div>
                  Vendido por: <Link to={`/seller/${product.seller_id}`} className="text-brand-secondary font-black hover:text-brand-primary transition-colors cursor-pointer decoration-2 underline-offset-4 hover:underline">{product.seller_name}</Link>
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
                  <button 
                    onClick={handleToggleWishlist}
                    disabled={togglingFavorite}
                    className={`btn-outline w-20 h-20 rounded-[1.5rem] flex items-center justify-center transition-all ${
                      isFavorite 
                        ? 'bg-red-50 text-red-500 border-red-200 shadow-inner' 
                        : 'hover:bg-red-50 hover:text-red-500 hover:border-red-200'
                    }`}
                  >
                    <motion.div
                      animate={isFavorite ? { scale: [1, 1.3, 1] } : {}}
                      transition={{ duration: 0.3 }}
                    >
                      <FontAwesomeIcon 
                        icon={faHeart} 
                        className={`text-3xl ${isFavorite ? 'text-red-500' : 'text-gray-300'}`} 
                      />
                    </motion.div>
                  </button>
                </div>
                
                <p className="text-xs text-center text-gray-400 font-medium">
                  {product.stock > 0 ? `Stock disponible: ${product.stock} unidades` : 'Agotado temporalmente'}
                </p>
              </div>
            )}

          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-20 space-y-12">
          <div className="flex items-center justify-between border-b border-gray-100 pb-8">
            <div>
              <h2 className="text-3xl font-black text-brand-secondary">Opiniones de compradores</h2>
              <p className="text-gray-400 font-bold text-sm uppercase tracking-widest mt-1">Calificación promedio: {product.average_rating || '5.0'}</p>
            </div>
            {user && product.seller_id !== user.id && !showReviewForm && (
              <button 
                onClick={() => setShowReviewForm(true)}
                className="btn-primary py-3 px-8 text-sm font-black shadow-lg"
              >
                Escribir una reseña
              </button>
            )}
          </div>

          <AnimatePresence>
            {showReviewForm && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <form onSubmit={handleSubmitReview} className="glass-card p-8 border-2 border-brand-primary/20 space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-brand-secondary">¿Qué te pareció el producto?</h3>
                    <button type="button" onClick={() => setShowReviewForm(false)} className="text-gray-400 hover:text-brand-primary transition-colors">
                      Cancelar
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <p className="text-xs font-black uppercase text-gray-400 tracking-wider">Tu Calificación</p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewData({ ...reviewData, rating: star })}
                          onMouseEnter={() => setReviewData({ ...reviewData, rating: star })}
                          className={`text-3xl transition-transform active:scale-90 ${
                            star <= reviewData.rating ? 'text-amber-500' : 'text-gray-200'
                          }`}
                        >
                          <FontAwesomeIcon icon={faStar} />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-black uppercase text-gray-400 tracking-wider">Tu Comentario</p>
                    <textarea 
                      required
                      placeholder="Cuéntanos tu experiencia con el producto..."
                      value={reviewData.comment}
                      onChange={(e) => setReviewData({ ...reviewData, comment: e.target.value })}
                      className="w-full bg-brand-light/20 border-2 border-transparent focus:border-brand-primary/30 rounded-2xl p-4 min-h-[120px] outline-none transition-all font-medium text-brand-secondary"
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={submittingReview}
                    className="btn-primary w-full py-4 text-sm font-black disabled:opacity-50"
                  >
                    {submittingReview ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'Publicar Reseña'}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {reviewsLoading ? (
               <div className="col-span-full py-20 text-center font-bold text-gray-400">Cargando reseñas...</div>
            ) : reviews.length === 0 ? (
              <div className="col-span-full py-20 text-center bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100 italic text-gray-400">
                Este producto aún no tiene reseñas. ¡Sé el primero en calificarlo!
              </div>
            ) : (
              reviews.map((review, idx) => (
                <motion.div 
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="glass-card p-8 space-y-4 border border-gray-50 hover:border-brand-primary/20 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-primary/20 flex items-center justify-center font-black text-brand-secondary text-sm overflow-hidden border border-gray-50 shadow-sm">
                        {review.user_avatar ? (
                          <img src={review.user_avatar} alt={review.user_name} className="w-full h-full object-cover" />
                        ) : (
                          review.user_name?.[0]?.toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-brand-secondary text-sm">{review.user_name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{new Date(review.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-0.5 text-amber-500 text-xs translate-y-1">
                      {[...Array(5)].map((_, i) => (
                        <FontAwesomeIcon 
                          key={i} 
                          icon={faStar} 
                          className={i < review.rating ? 'opacity-100' : 'opacity-20'} 
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-gray-600 font-medium text-sm leading-relaxed italic">
                    "{review.comment}"
                  </p>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
          >
            <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-md ${
              toast.type === 'success' 
                ? 'bg-green-600/90 text-white border-green-400' 
                : 'bg-red-600/90 text-white border-red-400'
            }`}>
              <FontAwesomeIcon icon={toast.type === 'success' ? faCheck : faHeart} />
              <span className="font-medium">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetails;
