import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faShieldAlt, 
  faShoppingBag, 
  faStore, 
  faHeart, 
  faBell, 
  faWallet,
  faBars,
  faTimes,
  faUserCircle,
  faSignOutAlt,
  faLaptop,
  faHistory,
  faMapMarkerAlt
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { getSessions, getLogs, deleteSession } from '../api/user';

// Profile Sections
import BuyerOrders from './profile-sections/BuyerOrders';
import SellerSales from './profile-sections/SellerSales';
import Wishlist from './profile-sections/Wishlist';
import NotificationPanel from './profile-sections/NotificationPanel';
import WalletView from './profile-sections/WalletView';
import AddressManager from './profile-sections/AddressManager';

const Profile = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const tabs = [
    { id: 'overview', label: 'Mi Actividad', icon: faShieldAlt },
    { id: 'purchases', label: 'Mis Compras', icon: faShoppingBag },
    { id: 'sales', label: 'Mis Ventas', icon: faStore },
    { id: 'wishlist', label: 'Favoritos', icon: faHeart },
    { id: 'notifications', label: 'Notificaciones', icon: faBell },
    { id: 'wallet', label: 'Billetera', icon: faWallet },
    { id: 'addresses', label: 'Direcciones', icon: faMapMarkerAlt },
  ];

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchActivityData();
    }
  }, [activeTab]);

  const fetchActivityData = async () => {
    try {
      setLoading(true);
      const [sessionsData, logsData] = await Promise.all([getSessions(), getLogs()]);
      setSessions(sessionsData);
      setLogs(logsData);
    } catch (err) {
      console.error('Error al cargar actividad:', err);
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'purchases': return <BuyerOrders />;
      case 'sales': return <SellerSales />;
      case 'wishlist': return <Wishlist />;
      case 'notifications': return <NotificationPanel />;
      case 'wallet': return <WalletView />;
      case 'addresses': return <AddressManager />;
      default: return renderOverview();
    }
  };

  const renderOverview = () => (
    <div className="space-y-8">
      {/* Security Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8">
          <h3 className="text-xl font-bold text-brand-secondary mb-6 flex items-center gap-3">
            <FontAwesomeIcon icon={faLaptop} className="text-brand-primary" />
            Sesiones Activas
          </h3>
          <div className="space-y-4">
            {sessions.map(s => (
              <div key={s.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-brand-secondary shadow-sm">
                      <FontAwesomeIcon icon={faLaptop} size="xs" />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-brand-secondary">{s.device_info || 'Unknown Device'}</p>
                     <p className="text-[10px] text-gray-400">{s.ip_address}</p>
                   </div>
                </div>
                {s.token !== localStorage.getItem('tungu_token') && (
                  <button onClick={() => deleteSession(s.token)} className="text-red-400 hover:text-red-600 p-2"><FontAwesomeIcon icon={faSignOutAlt} size="sm" /></button>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8 font-medium">
           <h3 className="text-xl font-bold text-brand-secondary mb-6 flex items-center gap-3">
            <FontAwesomeIcon icon={faHistory} className="text-brand-primary" />
            Últimos Accesos
          </h3>
          <div className="space-y-3">
             {logs.slice(0, 5).map(log => (
               <div key={log.id} className="flex items-center justify-between text-xs py-2 border-b border-gray-50 last:border-0">
                 <span className="text-gray-500">{new Date(log.timestamp).toLocaleString()}</span>
                 <span className={`font-bold ${log.status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                   {log.status === 'success' ? 'Éxito' : 'Fallo'}
                 </span>
               </div>
             ))}
          </div>
        </motion.div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#fcfdff] pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">
        
        {/* Mobile Sidebar Toggle */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden fixed bottom-6 right-6 w-14 h-14 bg-brand-secondary text-white rounded-full shadow-2xl z-50 flex items-center justify-center text-xl"
        >
          <FontAwesomeIcon icon={isSidebarOpen ? faTimes : faBars} />
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar */}
          <motion.div 
            className={`
              fixed inset-0 lg:relative lg:inset-auto z-40 lg:z-auto
              ${isSidebarOpen ? 'flex' : 'hidden lg:flex'}
              lg:w-80 flex-col
            `}
          >
            <div className="absolute inset-0 bg-brand-secondary/40 backdrop-blur-sm lg:hidden" onClick={() => setIsSidebarOpen(false)} />
            
            <div className="relative w-72 lg:w-full bg-white h-full lg:h-fit min-h-[calc(100vh-15rem)] lg:rounded-[2rem] shadow-2xl lg:shadow-xl lg:border border-gray-100 flex flex-col p-6 overflow-hidden">
               {/* User Brief */}
               <div className="text-center mb-8 pb-8 border-b border-gray-50">
                  <div className="w-20 h-20 bg-brand-primary/20 rounded-[1.5rem] mx-auto flex items-center justify-center text-brand-secondary text-3xl font-bold mb-4">
                    {user?.name?.[0].toUpperCase()}
                  </div>
                  <h2 className="font-bold text-brand-secondary text-xl truncate">{user?.name}</h2>
                  <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">
                    {user?.role === 'admin' ? 'Administrador' : 'Miembro Gold'}
                  </p>
               </div>

               {/* Nav Links */}
               <nav className="space-y-2 flex-1">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
                      className={`
                        w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-bold text-sm
                        ${activeTab === tab.id 
                          ? 'bg-brand-primary text-brand-secondary shadow-lg shadow-brand-primary/20' 
                          : 'text-gray-400 hover:bg-gray-50 hover:text-brand-secondary'
                        }
                      `}
                    >
                      <FontAwesomeIcon icon={tab.icon} className="w-5" />
                      {tab.label}
                    </button>
                  ))}
               </nav>

               {/* Logout */}
               <button 
                onClick={logout}
                className="mt-8 pt-8 border-t border-gray-50 w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-400 hover:bg-red-50 transition-all font-bold text-sm"
               >
                 <FontAwesomeIcon icon={faSignOutAlt} className="w-5" />
                 Cerrar Sesión
               </button>
            </div>
          </motion.div>

          {/* Content Area */}
          <main className="flex-1 min-h-[600px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>

        </div>
      </div>
    </div>
  );
};

export default Profile;
