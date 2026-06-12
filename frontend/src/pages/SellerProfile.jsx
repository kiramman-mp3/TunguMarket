import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faStore, 
  faCalendarAlt, 
  faCheckCircle, 
  faStar, 
  faBoxOpen,
  faArrowLeft
} from '@fortawesome/free-solid-svg-icons';

const SellerProfile = () => {
  const { id } = useParams();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSellerData();
  }, [id]);

  const fetchSellerData = async () => {
    try {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      
      const [userRes, prodRes] = await Promise.all([
        fetch(`${baseUrl}/users/seller/${id}`).then(r => r.json()),
        fetch(`${baseUrl}/products/seller/${id}`).then(r => r.json())
      ]);

      setSeller(userRes);
      setProducts(prodRes.data.products);
    } catch (error) {
      console.error('Error fetching seller data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen pt-32 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-brand-primary"></div>
    </div>
  );

  if (!seller) return (
    <div className="min-h-screen pt-32 text-center space-y-4">
      <h2 className="text-2xl font-bold text-brand-secondary">Vendedor no encontrado</h2>
      <Link to="/shop" className="btn-primary inline-block px-8">Volver a la tienda</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-light/20 pt-24 pb-20">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header / Brand Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 mb-12 relative overflow-hidden"
        >
          {/* Decorative background circle */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-brand-primary/10 rounded-full blur-3xl"></div>
          
          <div className="flex flex-col md:flex-row items-center gap-12 relative z-10">
            <div className="w-40 h-40 bg-brand-secondary text-brand-primary rounded-[3rem] flex items-center justify-center text-6xl font-black shadow-2xl overflow-hidden border-4 border-white">
              {seller.avatar_url ? (
                <img src={seller.avatar_url} alt={seller.name} className="w-full h-full object-cover" />
              ) : (
                seller.name?.[0].toUpperCase()
              )}
            </div>
            
            <div className="text-center md:text-left space-y-4 flex-1">
              <div className="space-y-1">
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <h1 className="text-4xl md:text-5xl font-display font-black text-brand-secondary">
                    {seller.seller_name || seller.name}
                  </h1>
                  <FontAwesomeIcon icon={faCheckCircle} className="text-blue-500 text-2xl" />
                </div>
                {seller.seller_bio && (
                  <p className="text-gray-600 font-medium max-w-2xl line-clamp-3">
                    {seller.seller_bio}
                  </p>
                )}
                <p className="text-brand-primary font-black uppercase tracking-[0.2em] text-[10px] mt-2">
                  Vendedor Verificado
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 text-gray-500 font-bold text-xs">
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-brand-primary" />
                  Desde {new Date(seller.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}
                </span>
                <span className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faBoxOpen} className="text-brand-primary" />
                  {products.length} Productos Activos
                </span>
              </div>
            </div>


          </div>
        </motion.div>

        {/* Catalog Section */}
        <div className="space-y-8">
           <div className="flex justify-between items-center">
              <h2 className="text-3xl font-display font-black text-brand-secondary">Catálogo de {seller.seller_name || seller.name}</h2>
              <div className="h-1 flex-1 mx-8 bg-gray-100 rounded-full hidden md:block"></div>
           </div>

           {products.length === 0 ? (
             <div className="p-20 text-center glass-card border-dashed">
                <p className="text-gray-400 font-bold">Este vendedor aún no tiene productos públicos.</p>
             </div>
           ) : (
             <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                {products.map((product) => (
                  <motion.div
                    key={product.id}
                    whileHover={{ y: -10 }}
                    className="glass-card group overflow-hidden"
                  >
                    <Link to={`/product/${product.id}`}>
                      <div className="aspect-square bg-gray-50 relative overflow-hidden">
                        <img 
                          src={product.primary_image} 
                          alt={product.title} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-black text-brand-secondary shadow-sm">
                          ${product.price}
                        </div>
                      </div>
                      <div className="p-6 space-y-2">
                        <p className="text-[10px] font-black uppercase text-brand-primary tracking-widest">{product.category_name}</p>
                        <h3 className="font-bold text-brand-secondary truncate group-hover:text-brand-primary transition-colors">
                          {product.title}
                        </h3>
                      </div>
                    </Link>
                  </motion.div>
                ))}
             </div>
           )}
        </div>

      </div>
    </div>
  );
};

export default SellerProfile;
