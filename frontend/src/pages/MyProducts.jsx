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
  faHistory,
  faTimes,
  faChevronDown,
  faChevronUp,
  faStore,
  faSave,
  faEyeSlash
} from '@fortawesome/free-solid-svg-icons';
import { getSellerProducts, deleteProduct, getSellerStats, updateProduct, updateProductStatus } from '../api/product';
import { getCategories } from '../api/category';
import { updateSellerProfile } from '../api/user';
import { useAuth } from '../context/AuthContext';

const MyProducts = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ activeProducts: 0, totalSales: 0, totalViews: 0, avgRating: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  
  // Perfil de vendedor
  const [showSettings, setShowSettings] = useState(false);
  const [sellerData, setSellerData] = useState({
    seller_name: '',
    seller_bio: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Cargar datos iniciales del vendedor desde el usuario logueado
  useEffect(() => {
    if (user) {
      setSellerData({
        seller_name: user.seller_name || user.name || '',
        seller_bio: user.seller_bio || ''
      });
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
     setLoading(true);
     await Promise.all([fetchProducts(), fetchStats(), fetchCategories()]);
     setLoading(false);
  };

  const fetchCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data || []);
    } catch (error) {
       console.error('Error loading categories:', error);
       setCategories([]);
    }
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
    if (window.confirm(`¿Estás seguro de que deseas eliminar permanentemente "${title}"? Esta acción no se puede deshacer.`)) {
      try {
        const res = await deleteProduct(id);
        
        // Si el servidor indica que el producto se ocultó en lugar de borrarse (por tener ventas)
        if (res.hidden) {
          setProducts(prev => prev.map(p => 
            String(p.id).toLowerCase() === String(id).toLowerCase() 
            ? { ...p, status: 'oculto' } 
            : p
          ));
          alert('El producto tiene ventas registradas, por lo que ha sido ocultado en lugar de eliminado para declarar el historial.');
        } else {
          // Borrado físico exitoso
          setProducts(prev => prev.filter(p => p.id !== id));
        }
      } catch (error) {
        alert('Error al eliminar el producto: ' + error.message);
      }
    }
  };

  const handleToggleVisibility = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'activo' ? 'oculto' : 'activo';
    try {
      const res = await updateProductStatus(id, nextStatus);
      
      // Verificación de seguridad de la respuesta
      if (!res || !res.data) {
        throw new Error('El servidor no devolvió una respuesta válida');
      }

      // Comparación robusta insensible a mayúsculas
      const targetId = String(id).toLowerCase();
      
      setProducts(prev => (prev || []).map(p => {
        if (!p) return p;
        const currentId = String(p.id).toLowerCase();
        if (currentId === targetId) {
          return { 
            ...p, 
            status: nextStatus, // Forzamos el estado visual
            sales_count: p.sales_count // Mantenemos ventas intocables
          };
        }
        return p;
      }));
    } catch (error) {
      console.error('Visibility Toggle Error:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleUpdateSellerProfile = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await updateSellerProfile(sellerData);
      alert('Perfil de vendedor actualizado con éxito');
      
      // Actualizar el contexto global para que los cambios se reflejen en toda la app
      if (res.user) {
        login(res.user, localStorage.getItem('tungu_token'));
      }
    } catch (error) {
      alert(error.message);
    } finally {
      setSavingSettings(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
            className="flex flex-wrap items-center gap-4"
          >
            <div className="relative flex-grow md:flex-grow-0">
              <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input 
                type="text" 
                placeholder="Buscar mis productos..."
                className="bg-white border-0 rounded-2xl py-3 pl-12 pr-10 shadow-sm focus:ring-2 ring-brand-primary w-full md:w-64 font-bold text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-500"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              )}
            </div>

            <select 
              className="bg-white border-0 rounded-2xl py-3 px-6 shadow-sm focus:ring-2 ring-brand-primary font-bold text-sm outline-none cursor-pointer"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>

            <Link to="/sell" className="btn-primary py-3 px-8 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:shadow-2xl transition-all active:scale-95">
              <FontAwesomeIcon icon={faPlus} />
              Publicar
            </Link>
          </motion.div>
        </div>

        {/* Seller Settings Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className="w-full bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between group hover:border-brand-primary/30 transition-all"
          >
            <div className="flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-secondary flex items-center justify-center text-xl">
                  <FontAwesomeIcon icon={faStore} />
               </div>
               <div className="text-left">
                  <h3 className="text-lg font-black text-brand-secondary">Configuración de Mi Tienda</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Personaliza cómo te ven los compradores</p>
               </div>
            </div>
            <FontAwesomeIcon icon={showSettings ? faChevronUp : faChevronDown} className="text-gray-300 group-hover:text-brand-primary transition-colors" />
          </button>

          <AnimatePresence>
            {showSettings && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white/50 backdrop-blur-sm p-8 rounded-b-[2rem] border-x border-b border-gray-100 shadow-inner">
                  <form onSubmit={handleUpdateSellerProfile} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Nombre Comercial / Tienda</label>
                          <input 
                            type="text"
                            required
                            placeholder="Ej: Artesanías del Valle"
                            className="w-full bg-white border-2 border-gray-50 rounded-2xl p-4 font-bold text-brand-secondary focus:border-brand-primary/30 outline-none transition-all"
                            value={sellerData.seller_name}
                            onChange={(e) => setSellerData({...sellerData, seller_name: e.target.value})}
                          />
                        </div>
                        <p className="text-xs text-gray-400 italic">Este es el nombre que aparecerá en tus productos y perfil público.</p>
                     </div>
                     <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Biografía / Descripción de Tienda</label>
                          <textarea 
                            placeholder="Cuéntale a tus clientes quién eres y qué ofreces..."
                            className="w-full bg-white border-2 border-gray-50 rounded-2xl p-4 font-bold text-brand-secondary focus:border-brand-primary/30 outline-none transition-all min-h-[120px]"
                            value={sellerData.seller_bio}
                            onChange={(e) => setSellerData({...sellerData, seller_bio: e.target.value})}
                          />
                        </div>
                        <button 
                          type="submit" 
                          disabled={savingSettings}
                          className="btn-primary w-full py-4 rounded-2xl font-black flex items-center justify-center gap-3 disabled:opacity-50"
                        >
                          {savingSettings ? 'Guardando...' : (
                            <>
                              <FontAwesomeIcon icon={faSave} />
                              Guardar Cambios
                            </>
                          )}
                        </button>
                     </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

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
                  className={`glass-card overflow-hidden group hover:shadow-2xl transition-all duration-300 flex flex-col ${
                    product.is_flagged ? 'ring-2 ring-red-500/50 bg-red-50/30' : ''
                  }`}
                >
                  <div className="relative aspect-video overflow-hidden">
                    <img 
                      src={product.primary_image || 'https://via.placeholder.com/400x300?text=No+Image'} 
                      alt={product.title} 
                      className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ${product.is_flagged ? 'grayscale opacity-60' : ''}`}
                    />
                    
                    {/* Overlay de producto peligroso */}
                    {product.is_flagged && (
                      <div className="absolute inset-0 bg-red-900/70 flex flex-col items-center justify-center text-center p-4">
                        <FontAwesomeIcon icon={faExclamationCircle} className="text-red-300 text-4xl mb-2" />
                        <p className="text-white text-xs font-black uppercase tracking-widest">Producto Peligroso</p>
                        <p className="text-red-200 text-[10px] font-bold mt-1">Bloqueado Automáticamente</p>
                      </div>
                    )}

                    {!product.is_flagged && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                         <p className="text-white text-xs font-bold">Publicado el {new Date(product.created_at).toLocaleDateString()}</p>
                      </div>
                    )}

                    <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
                      <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase text-brand-secondary shadow-lg">
                        Stock: {product.stock}
                      </div>
                      {product.status !== 'activo' && (
                        <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-lg ${
                          product.status === 'oculto' ? 'bg-orange-500 text-white' : 
                          product.status === 'pendiente' ? 'bg-amber-500 text-white' : 
                          'bg-red-500 text-white'
                        }`}>
                          {product.status === 'pendiente' ? 'Pendiente' : product.is_flagged ? 'Peligroso' : product.status}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 space-y-4 flex-1 flex flex-col">
                    <div>
                      <h3 className={`text-lg font-black uppercase tracking-tight truncate line-clamp-1 ${product.is_flagged ? 'text-red-600' : 'text-brand-secondary'}`}>{product.title}</h3>
                      <p className={`text-2xl font-black mt-1 ${product.is_flagged ? 'text-red-400' : 'text-brand-primary'}`}>${parseFloat(product.price).toFixed(2)}</p>
                      {product.is_flagged && product.blocked_reason && (
                        <p className="text-[11px] text-red-500 font-bold mt-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
                          ⚠️ {product.blocked_reason}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 pt-4 mt-auto">
                      {product.is_flagged ? (
                        /* Producto peligroso: sin acciones */
                        <div className="w-full bg-red-100 text-red-500 py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-tight cursor-not-allowed">
                          <FontAwesomeIcon icon={faExclamationCircle} />
                          Acciones no disponibles
                        </div>
                      ) : product.status === 'bloqueado' || product.status === 'pendiente' ? (
                        /* Producto bloqueado o pendiente: solo ver */
                        <Link 
                          to={`/product/${product.id}`}
                          className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-tight transition-all ${
                            product.status === 'bloqueado' 
                              ? 'bg-red-50 text-red-500 hover:bg-red-100' 
                              : 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                          }`}
                        >
                          <FontAwesomeIcon icon={faEye} />
                          Ver producto
                        </Link>
                      ) : (
                        /* Producto normal: acciones completas */
                        <>
                          <Link 
                            to={`/product/${product.id}`}
                            className="flex-[1.5] bg-gray-50 text-gray-500 py-3 rounded-xl flex items-center justify-center hover:bg-brand-light hover:text-brand-secondary transition-all text-[10px] font-black uppercase tracking-tight"
                            title="Ver detalle del producto"
                          >
                             Ver más
                          </Link>
                          <Link 
                            to={`/edit-product/${product.id}`}
                            className="flex-1 bg-brand-primary/10 text-brand-secondary py-3 rounded-xl flex items-center justify-center hover:bg-brand-primary hover:text-brand-secondary transition-all"
                            title="Editar"
                          >
                             <FontAwesomeIcon icon={faEdit} />
                          </Link>
                          
                          {(Number(product.sales_count) > 0 || product.status === 'oculto') ? (
                            <button 
                              onClick={() => handleToggleVisibility(product.id, product.status)}
                              className={`flex-1 py-3 rounded-xl flex items-center justify-center transition-all ${
                                product.status === 'activo' 
                                ? 'bg-orange-50 text-orange-500 hover:bg-orange-500 hover:text-white' 
                                : 'bg-green-50 text-green-500 hover:bg-green-500 hover:text-white'
                              }`}
                              title={product.status === 'activo' ? 'Ocultar (tiene ventas)' : 'Volver a mostrar'}
                            >
                              <FontAwesomeIcon icon={product.status === 'activo' ? faEyeSlash : faEye} />
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleDelete(product.id, product.title)}
                              className="flex-1 bg-red-50 text-red-500 py-3 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                              title="Eliminar permanentemente"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          )}
                        </>
                      )}
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
