import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faEdit, 
  faTrash, 
  faBoxOpen, 
  faEye, 
  faSearch,
  faExclamationCircle,
  faEllipsisV,
  faCheckCircle,
  faHistory
} from '@fortawesome/free-solid-svg-icons';
import { getSellerProducts, deleteProduct, getSellerStats } from '../api/product';
import { useAuth } from '../context/AuthContext';

const MyProducts = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ activeProducts: 0, totalSales: 0, totalViews: 0, avgRating: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
     setLoading(true);
     await Promise.all([fetchProducts(), fetchStats()]);
     setLoading(false);
  };

  const fetchProducts = async () => {
    try {
      const res = await getSellerProducts(user.id, 1, 50);
      setProducts(res.data.products);
    } catch (error) {
      console.error('Error al cargar productos:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await getSellerStats();
      setStats(res.data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const handleDelete = async (id, title) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar "${title}"? Esta acción no se puede deshacer.`)) {
      try {
        await deleteProduct(id);
        setProducts(products.filter(p => p.id !== id));
      } catch (error) {
        alert(error.message);
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-brand-light/30 pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <h1 className="text-4xl font-display font-black text-brand-secondary tracking-tight">
              Mis Productos
            </h1>
            <p className="text-gray-500 font-medium mt-1">Gestiona tus publicaciones y aumenta tus ventas</p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="relative">
              <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input 
                type="text" 
                placeholder="Buscar por nombre..."
                className="bg-white border-0 rounded-2xl py-3 pl-12 pr-6 shadow-sm focus:ring-2 ring-brand-primary w-full md:w-64 font-bold text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Link to="/sell" className="btn-primary py-3 px-8 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:shadow-2xl transition-all active:scale-95">
              <FontAwesomeIcon icon={faPlus} />
              Publicar Nuevo
            </Link>
          </motion.div>
        </div>

        {/* Stats Grid Placeholder (Optional but looks premium) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
           {[
             { label: 'Activos', value: stats.activeProducts, icon: faBoxOpen, color: 'text-brand-secondary' },
             { label: 'Ventas Totales', value: stats.totalSales, icon: faHistory, color: 'text-brand-primary' },
             { label: 'Visto por', value: stats.totalViews > 999 ? (stats.totalViews/1000).toFixed(1) + 'k' : stats.totalViews, icon: faEye, color: 'text-blue-500' },
             { label: 'Rating Promedio', value: stats.avgRating, icon: faCheckCircle, color: 'text-green-500' }
           ].map((stat, i) => (
             <motion.div 
               key={i}
               initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
               className="glass-card p-6 flex flex-col items-center text-center space-y-2 border border-brand-primary/10"
             >
                <div className={`text-2xl ${stat.color}`}>
                  <FontAwesomeIcon icon={stat.icon} />
                </div>
                <p className="text-2xl font-black text-brand-secondary">{stat.value}</p>
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
             </motion.div>
           ))}
        </div>

        {/* Products Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <div className="animate-spin rounded-full h-12 w-12 border-4 border-brand-primary border-t-transparent"></div>
             <p className="text-gray-400 font-bold">Cargando tu inventario...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <motion.div 
             initial={{ opacity: 0 }} animate={{ opacity: 1 }}
             className="glass-card p-20 text-center flex flex-col items-center gap-6 border-dashed border-4 border-gray-100"
          >
             <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 text-5xl">
                <FontAwesomeIcon icon={faBoxOpen} />
             </div>
             <div className="space-y-1">
                <h3 className="text-2xl font-black text-brand-secondary">No tienes productos aún</h3>
                <p className="text-gray-500 font-medium">¡Comienza a vender hoy mismo y llega a miles de personas!</p>
             </div>
             <Link to="/sell" className="btn-primary py-4 px-12 rounded-2xl font-black">Publicar mi primer producto</Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <AnimatePresence>
              {filteredProducts.map((product) => (
                <motion.div 
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="glass-card overflow-hidden group hover:shadow-2xl transition-all duration-300 flex flex-col"
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      src={product.primary_image || 'https://via.placeholder.com/400x300?text=No+Image'} 
                      alt={product.title} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                       <p className="text-white text-xs font-bold">Publicado el {new Date(product.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase text-brand-secondary shadow-lg">
                       Stock: {product.stock}
                    </div>
                  </div>

                  <div className="p-6 space-y-4 flex-1 flex flex-col">
                    <div>
                      <h3 className="text-lg font-black text-brand-secondary uppercase tracking-tight truncate line-clamp-1">{product.title}</h3>
                      <p className="text-2xl font-black text-brand-primary mt-1">${parseFloat(product.price).toFixed(2)}</p>
                    </div>

                    <div className="flex gap-2 pt-4 mt-auto">
                      <Link 
                        to={`/product/${product.id}`}
                        className="flex-1 bg-gray-50 text-gray-400 py-3 rounded-xl flex items-center justify-center hover:bg-brand-light hover:text-brand-secondary transition-colors"
                      >
                         <FontAwesomeIcon icon={faEye} />
                      </Link>
                      <Link 
                        to={`/edit-product/${product.id}`}
                        className="flex-1 bg-brand-primary/20 text-brand-secondary py-3 rounded-xl flex items-center justify-center hover:bg-brand-primary hover:text-brand-secondary transition-colors"
                      >
                         <FontAwesomeIcon icon={faEdit} />
                      </Link>
                      <button 
                        onClick={() => handleDelete(product.id, product.title)}
                        className="flex-1 bg-red-50 text-red-500 py-3 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors"
                      >
                         <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

      </div>
    </div>
  );
};

export default MyProducts;
