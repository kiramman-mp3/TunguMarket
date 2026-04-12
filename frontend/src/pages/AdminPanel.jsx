import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUsers, faBan, faUndo, faCheckCircle, faExclamationCircle, 
  faShieldAlt, faEnvelope, faUserShield, faCalendarAlt, 
  faBoxOpen, faTag, faStore, faCheck, faTimes, faTrashAlt,
  faEye, faClock, faLock, faLockOpen, faMoneyBillWave, faFileImage
} from '@fortawesome/free-solid-svg-icons';
import { getAdminUsers, updateUserStatus } from '../api/user';
import { getAdminProducts, adminUpdateProductStatus, deleteProduct } from '../api/product';
import AdminWithdrawals from './AdminWithdrawals';
import AdminPaymentVerification from './AdminPaymentVerification';
import LoadingScreen from '../components/LoadingScreen';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      if (activeTab === 'users') {
        const data = await getAdminUsers();
        setUsers(data);
      } else {
        const data = await getAdminProducts(1, 100);
        setProducts(data.data.products);
      }
    } catch (err) {
      setError(err.message || `Error al cargar ${activeTab === 'users' ? 'usuarios' : 'productos'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (userId, currentStatus) => {
    try {
      await updateUserStatus(userId, !currentStatus);
      setUsers(users.map(u => u.id === userId ? { ...u, is_banned: !currentStatus } : u));
    } catch (err) {
      setError(err.message || 'Error al actualizar estado del usuario');
    }
  };

  const handleProductStatus = async (productId, newStatus, reason = null) => {
    try {
      await adminUpdateProductStatus(productId, newStatus, reason);
      setProducts(products.map(p => p.id === productId ? { ...p, status: newStatus } : p));
    } catch (err) {
      setError(err.message || 'Error al actualizar producto');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('¿Estás seguro de eliminar este producto definitivamente?')) return;
    try {
      await deleteProduct(productId);
      setProducts(products.filter(p => p.id !== productId));
    } catch (err) {
      setError(err.message || 'Error al eliminar producto');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(filter.toLowerCase()) || 
    u.email.toLowerCase().includes(filter.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    p.title.toLowerCase().includes(filter.toLowerCase()) || 
    p.seller_name.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading && users.length === 0 && products.length === 0) return <LoadingScreen message="Cargando panel de administración..." />;

  return (
    <div className="max-w-7xl mx-auto px-4 py-28 min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center lg:text-left flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6"
      >
        <div>
          <h1 className="text-4xl font-display font-bold text-brand-secondary mb-2">Panel Administrativo</h1>
          <p className="text-gray-500 font-medium tracking-tight">Gestión centralizada de TunguMarket.</p>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 p-1.5 rounded-2xl w-fit mx-auto lg:mx-0">
          <button 
            onClick={() => { setActiveTab('users'); setFilter(''); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'users' ? 'bg-white text-brand-secondary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <FontAwesomeIcon icon={faUsers} />
            Usuarios
          </button>
          <button 
            onClick={() => { setActiveTab('products'); setFilter(''); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'products' ? 'bg-white text-brand-secondary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <FontAwesomeIcon icon={faBoxOpen} />
            Productos
          </button>
          <button 
            onClick={() => { setActiveTab('withdrawals'); setFilter(''); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'withdrawals' ? 'bg-white text-brand-secondary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <FontAwesomeIcon icon={faMoneyBillWave} />
            Retiros
          </button>
          <button 
            onClick={() => { setActiveTab('payments'); setFilter(''); }}
            className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'payments' ? 'bg-white text-brand-secondary shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <FontAwesomeIcon icon={faFileImage} />
            Comprobantes
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Stats Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 bg-brand-primary/5 border-brand-primary/20">
            <h3 className="text-xs font-bold text-brand-secondary uppercase tracking-widest mb-4 opacity-50">Resumen {activeTab === 'users' ? 'Usuarios' : activeTab === 'products' ? 'Productos' : activeTab === 'withdrawals' ? 'Retiros' : 'Comprobantes'}</h3>
            <div className="space-y-4">
              {activeTab === 'users' ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium text-sm">Total Usuarios</span>
                    <span className="font-bold text-brand-secondary">{users.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium text-sm">Baneados</span>
                    <span className="font-bold text-red-600">{users.filter(u => u.is_banned).length}</span>
                  </div>
                </>
              ) : activeTab === 'withdrawals' ? (
                <div className="flex flex-col gap-2 text-sm text-gray-600">
                  <p className="font-medium">Gestión de retiros de vendedores</p>
                  <p className="text-xs text-gray-500">Aprueba o rechaza solicitudes de retiro de fondos desde billeteras.</p>
                </div>
              ) : activeTab === 'payments' ? (
                <div className="flex flex-col gap-2 text-sm text-gray-600">
                  <p className="font-medium">Verificación de comprobantes</p>
                  <p className="text-xs text-gray-500">Revisa y aprueba los comprobantes de transferencia de los clientes.</p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium text-sm">Total Productos</span>
                    <span className="font-bold text-brand-secondary">{products.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium text-sm">Pendientes</span>
                    <span className="font-bold text-amber-600">{products.filter(p => p.status === 'pendiente').length}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          
          {activeTab !== 'withdrawals' && activeTab !== 'payments' && (
            <div className="glass-card p-6">
              <h3 className="text-xs font-bold text-brand-secondary uppercase tracking-widest mb-4 opacity-50 text-center lg:text-left">Filtros</h3>
              <div className="relative">
              <input 
                type="text" 
                placeholder={activeTab === 'users' ? "Buscar por nombre o email..." : "Buscar por título o vendedor..."}
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="input-field px-4 py-3 text-sm w-full"
              />
            </div>
          </div>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold border border-red-100"
            >
              {error}
            </motion.div>
          )}
        </div>

        {/* Content Column */}
        <motion.div 
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 glass-card p-4 overflow-hidden min-h-[500px]"
        >
          <div className="overflow-x-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'users' ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Usuario</th>
                      <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Rol</th>
                      <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Estado</th>
                      <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-sm font-bold shadow-sm ${user.is_banned ? 'bg-red-100 text-red-500' : 'bg-brand-primary/10 text-brand-secondary'}`}>
                              {user.name[0].toUpperCase()}
                            </div>
                            <div>
                              <p className={`font-bold text-sm transition-all ${user.is_banned ? 'text-gray-400 line-through' : 'text-brand-secondary'}`}>{user.name}</p>
                              <p className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                                <FontAwesomeIcon icon={faEnvelope} className="text-[9px]" />
                                {user.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${user.role_name === 'admin' ? 'bg-brand-secondary/10 text-brand-secondary' : 'bg-gray-100 text-gray-600'}`}>
                            <FontAwesomeIcon icon={user.role_name === 'admin' ? faUserShield : faUsers} className="text-[9px]" />
                            {user.role_name}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col gap-1">
                            <span className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${user.is_verified ? 'text-green-600' : 'text-amber-500'}`}>
                              <FontAwesomeIcon icon={user.is_verified ? faCheckCircle : faExclamationCircle} />
                              {user.is_verified ? 'Verificado' : 'Pendiente'}
                            </span>
                            {user.is_banned && (
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-red-600">
                                 <FontAwesomeIcon icon={faBan} /> Ban Activado
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          {user.role_name !== 'admin' && (
                            <button 
                              onClick={() => handleToggleBan(user.id, user.is_banned)}
                              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-bold transition-all shadow-sm ${user.is_banned ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white'}`}
                            >
                              <FontAwesomeIcon icon={user.is_banned ? faUndo : faBan} />
                              {user.is_banned ? 'Reactivar' : 'Bloquear'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : activeTab === 'withdrawals' ? (
                <AdminWithdrawals />
              ) : activeTab === 'payments' ? (
                <AdminPaymentVerification />
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Producto</th>
                      <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Vendedor</th>
                      <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Estado</th>
                      <th className="px-6 py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden shadow-sm flex-shrink-0">
                              {product.primary_image ? (
                                <img src={product.primary_image} alt={product.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                  <FontAwesomeIcon icon={faBoxOpen} />
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-sm text-brand-secondary line-clamp-1">{product.title}</p>
                              <p className="text-[11px] text-brand-primary font-bold">
                                ${parseFloat(product.price).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-700">{product.seller_name}</span>
                            <span className="text-[10px] text-gray-400 font-medium">ID: {product.seller_id.split('-')[0]}...</span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold ${
                            product.status === 'activo' ? 'bg-green-100 text-green-700' :
                            product.status === 'pendiente' ? 'bg-amber-100 text-amber-700' :
                            product.status === 'bloqueado' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            <FontAwesomeIcon icon={
                              product.status === 'activo' ? faCheckCircle : 
                              product.status === 'pendiente' ? faClock : 
                              faExclamationCircle
                            } />
                            {product.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            {product.status === 'pendiente' && (
                              <button 
                                onClick={() => handleProductStatus(product.id, 'activo')}
                                title="Aprobar"
                                className="w-8 h-8 rounded-lg bg-green-100 text-green-600 hover:bg-green-600 hover:text-white transition-all flex items-center justify-center"
                              >
                                <FontAwesomeIcon icon={faCheck} />
                              </button>
                            )}
                            {product.status === 'activo' && (
                              <button 
                                onClick={() => handleProductStatus(product.id, 'bloqueado', 'Infringe normas de la comunidad')}
                                title="Bloquear producto"
                                className="w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                              >
                                <FontAwesomeIcon icon={faLock} />
                              </button>
                            )}
                            {product.status === 'bloqueado' && (
                              <button 
                                onClick={() => handleProductStatus(product.id, 'activo')}
                                title="Desbloquear producto"
                                className="w-8 h-8 rounded-lg bg-green-50 text-green-500 hover:bg-green-500 hover:text-white transition-all flex items-center justify-center"
                              >
                                <FontAwesomeIcon icon={faLockOpen} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanel;

