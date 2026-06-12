import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getWishlist, toggleWishlist } from '../../api/wishlist';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faTrash, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { Link } from 'react-router-dom';

const Wishlist = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const res = await getWishlist();
      setItems(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleRemove = async (productId) => {
    try {
      await toggleWishlist(productId);
      setItems(items.filter(item => item.product_id !== productId));
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando tus favoritos...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-brand-secondary mb-6 flex items-center gap-3">
        <FontAwesomeIcon icon={faHeart} className="text-red-500" />
        Mis Favoritos
      </h2>

      {items.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400">Tu lista de deseos está vacía.</p>
          <Link to="/shop" className="text-brand-primary font-bold mt-4 inline-block hover:underline">Explorar tienda</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <motion.div 
              key={item.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card overflow-hidden group"
            >
              <div className="relative aspect-square overflow-hidden">
                <img 
                  src={item.image_url || 'https://via.placeholder.com/300'} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <button 
                  onClick={() => handleRemove(item.product_id)}
                  className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-red-500 shadow-lg hover:bg-red-500 hover:text-white transition-all"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
              <div className="p-5">
                <h4 className="font-bold text-brand-secondary truncate mb-1">{item.title}</h4>
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-bold text-brand-primary">${item.price}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${item.stock > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    {item.stock > 0 ? 'En Stock' : 'Agotado'}
                  </span>
                </div>
                <Link 
                  to={`/product/${item.product_id}`}
                  className="w-full py-3 bg-brand-secondary text-white rounded-xl text-center text-sm font-bold block hover:bg-brand-primary transition-all shadow-sm"
                >
                  <FontAwesomeIcon icon={faShoppingCart} className="mr-2" />
                  Ver Producto
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
