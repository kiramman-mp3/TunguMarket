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
  faMapMarkerAlt,
  faUserEdit,
  faChartLine,
  faBank,
  faMoneyBillWave
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { getSessions, getLogs, deleteSession } from '../api/user';
import { getWalletSummary } from '../api/wallet';
import EditProfile from './profile-sections/EditProfile';

// Profile Sections
import AccountWrapper from './profile-sections/AccountWrapper';
import TransactionsWrapper from './profile-sections/TransactionsWrapper';
import FinancesWrapper from './profile-sections/FinancesWrapper';
import ActivityWrapper from './profile-sections/ActivityWrapper';
import LoadingScreen from '../components/LoadingScreen';

const Profile = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [walletBalance, setWalletBalance] = useState(user?.balance || 0);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      getWalletSummary()
        .then(res => setWalletBalance(res.data?.balance || 0))
        .catch(err => console.error('Error fetching wallet:', err));
    }
  }, [activeTab]);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: faChartLine },
    { id: 'account', label: 'Mi Cuenta', icon: faUserEdit },
    { id: 'transactions', label: 'Mis Transacciones', icon: faShoppingBag },
    { id: 'finances', label: 'Finanzas', icon: faWallet },
    { id: 'activity', label: 'Actividad', icon: faBell },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return renderDashboard();
      case 'account': return <AccountWrapper />;
      case 'transactions': return <TransactionsWrapper />;
      case 'finances': return <FinancesWrapper user={user} />;
      case 'activity': return <ActivityWrapper />;
      default: return null;
    }
  };

  const renderDashboard = () => (
    <div className="space-y-8">
      <header>
        <h2 className="text-3xl font-bold text-brand-secondary">Panel de Control</h2>
        <p className="text-gray-400 mt-2 font-medium italic">Hola {user?.name.split(' ')[0]}, bienvenido de vuelta a TunguMarket.</p>
      </header>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-8 bg-gradient-to-br from-white to-brand-primary/10">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/20 flex items-center justify-center text-brand-secondary">
              <FontAwesomeIcon icon={faWallet} className="text-xl" />
            </div>
            <span className="text-[10px] bg-white px-2 py-1 rounded-full font-bold text-brand-secondary shadow-sm">SALDO DISPONIBLE</span>
          </div>
          <p className="text-4xl font-extrabold text-brand-secondary tracking-tight">${walletBalance.toFixed(2)}</p>
          <button 
            onClick={() => setActiveTab('wallet')}
            className="mt-6 text-sm font-bold text-brand-secondary hover:text-brand-primary transition-colors flex items-center gap-2"
          >
            Gestionar Billetera <FontAwesomeIcon icon={faBars} size="xs" />
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500">
              <FontAwesomeIcon icon={faShoppingBag} className="text-xl" />
            </div>
          </div>
          <p className="text-2xl font-bold text-brand-secondary">Mis Compras</p>
          <p className="text-sm text-gray-400 mt-1">Revisa el estado de tus pedidos</p>
          <button onClick={() => setActiveTab('transactions')} className="mt-4 btn-outline py-2 px-4 rounded-xl text-xs font-bold">Ver Todo</button>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-8">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-500">
              <FontAwesomeIcon icon={faBell} className="text-xl" />
            </div>
          </div>
          <p className="text-2xl font-bold text-brand-secondary">Alertas</p>
          <p className="text-sm text-gray-400 mt-1">Nuevas notificaciones recibidas</p>
          <button onClick={() => setActiveTab('activity')} className="mt-4 btn-outline py-2 px-4 rounded-xl text-xs font-bold">Ver Centro de Mensajes</button>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Action Shortcut */}
         <div className="glass-card p-8 border-l-8 border-brand-primary">
            <h3 className="font-bold text-brand-secondary text-xl mb-4">¿Quieres vender algo?</h3>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">Publica tus productos locales y llega a miles de compradores en Quero y toda Tungurahua.</p>
            <a href="/sell" className="btn-primary inline-flex items-center gap-3 px-8 py-3 rounded-2xl font-bold">
               <FontAwesomeIcon icon={faStore} /> Empezar a Vender
            </a>
         </div>

         {/* Identity Short Info */}
         <div className="glass-card p-8">
            <div className="flex items-center gap-6 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 overflow-hidden flex items-center justify-center text-brand-secondary text-2xl font-bold">
                  {user?.avatar_url ? <img src={user.avatar_url} className="w-full h-full object-cover" /> : user?.name?.[0].toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-brand-secondary text-lg">{user?.name}</h4>
                  <p className="text-sm text-gray-400">Verificamos tu identidad para mayor seguridad.</p>
                </div>
            </div>
            <button 
              onClick={() => setActiveTab('account')}
              className="w-full py-4 border-2 border-dashed border-gray-100 rounded-2xl text-gray-400 hover:border-brand-primary hover:text-brand-primary transition-all font-bold text-sm"
            >
              Completar Perfil / cambiar foto 📸
            </button>
         </div>
      </div>
    </div>
  );

  if (loading) return <LoadingScreen message="Cargando tu panel de control..." />;

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
            
            <div className="relative w-72 lg:w-full bg-white h-full lg:h-fit max-h-[85vh] lg:max-h-none lg:rounded-[2rem] shadow-2xl lg:shadow-xl lg:border border-gray-100 flex flex-col p-6 overflow-y-auto lg:overflow-visible">
               {/* User Brief */}
               <div className="text-center mb-8 pb-8 border-b border-gray-50 px-2 flex-shrink-0">
                  <div className="w-24 h-24 mx-auto mb-4 relative">
                    <div className="w-full h-full bg-brand-primary/20 rounded-[2rem] flex items-center justify-center text-brand-secondary text-4xl font-bold overflow-hidden border-4 border-white shadow-lg">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        user?.name?.[0].toUpperCase()
                      )}
                    </div>
                  </div>
                  <h2 className="font-bold text-brand-secondary text-xl truncate px-2">{user?.name}</h2>
                  <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest font-bold">
                    {user?.role === 'admin' ? 'Administrador' : 'Usuario Verificado'}
                  </p>
               </div>

               {/* Nav Links - Scrollable */}
               <nav className="space-y-2 flex-1 overflow-y-auto pr-2 lg:pr-0">
                  {tabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setIsSidebarOpen(false); }}
                      className={`
                        w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-bold text-sm whitespace-nowrap lg:whitespace-normal
                        ${activeTab === tab.id 
                          ? 'bg-brand-primary text-brand-secondary shadow-lg shadow-brand-primary/20' 
                          : 'text-gray-400 hover:bg-gray-50 hover:text-brand-secondary'
                        }
                      `}
                    >
                      <FontAwesomeIcon icon={tab.icon} className="w-5 flex-shrink-0" />
                      <span className="overflow-hidden text-ellipsis">{tab.label}</span>
                    </button>
                  ))}
               </nav>

               {/* Logout - Sticky Bottom */}
               <button 
                onClick={logout}
                className="mt-8 pt-8 border-t border-gray-50 w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-red-400 hover:bg-red-50 transition-all font-bold text-sm flex-shrink-0 -mx-6 px-6"
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
