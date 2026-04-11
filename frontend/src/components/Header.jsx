import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBars, faTimes, faShoppingBag, faUserCircle, faSignOutAlt, 
  faShieldAlt, faStore, faUser, faChevronDown, faShoppingCart,
  faHome, faCompass, faSearch
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsOpen(false);
    setShowProfileMenu(false);
  };

  const isActive = (path) => location.pathname === path;
  const isAdmin = user?.role === 'admin';

  const NavLink = ({ to, icon, children }) => (
    <Link 
      to={to} 
      className={`relative px-4 py-2 flex items-center gap-2 font-semibold transition-all duration-300 group ${
        isActive(to) ? 'text-brand-secondary' : 'text-gray-500 hover:text-brand-secondary'
      }`}
    >
      <FontAwesomeIcon icon={icon} className={`text-sm ${isActive(to) ? 'text-brand-primary' : 'text-gray-400 group-hover:text-brand-primary'}`} />
      <span className="relative z-10">{children}</span>
      {isActive(to) && (
        <motion.div 
          layoutId="nav-pill"
          className="absolute inset-0 bg-brand-primary/10 rounded-xl -z-0"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
    </Link>
  );

  return (
    <header className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20 gap-4">
          
          {/* Logo Section */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-3 cursor-pointer group pr-4 border-r border-gray-100 hidden lg:flex">
            <div className="w-11 h-11 bg-gradient-to-br from-brand-primary to-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20 group-hover:rotate-6 transition-transform">
              <FontAwesomeIcon icon={faShoppingBag} className="text-white text-xl" />
            </div>
            <span className="font-display font-black text-2xl text-brand-secondary tracking-tighter decoration-brand-primary decoration-4 underline-offset-4 group-hover:underline">
              TunguMarket
            </span>
          </Link>

          {/* Simple Mobile Logo */}
          <Link to="/" className="lg:hidden flex-shrink-0">
             <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faShoppingBag} className="text-brand-secondary" />
            </div>
          </Link>

          {/* Desktop Nav - Left */}
          <nav className="flex items-center space-x-1 hidden md:flex">
            <NavLink to="/" icon={faHome}>Inicio</NavLink>
            <NavLink to="/shop" icon={faCompass}>Explorar</NavLink>
          </nav>

          <div className="flex-1 hidden md:block"></div>

          {/* Actions - Right */}
          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            
            {/* Admin Panel Button (Desktop Only) */}
            {user && isAdmin && (
              <Link 
                to="/admin" 
                className="hidden lg:flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-brand-secondary text-white hover:bg-brand-secondary/90 transition-all shadow-sm"
              >
                <FontAwesomeIcon icon={faShieldAlt} />
                Panel Admin
              </Link>
            )}

            {/* Vender (Desktop Only) */}
            {user && !isAdmin && (
              <Link 
                to="/my-products" 
                className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold text-brand-secondary hover:bg-brand-primary/10 transition-colors border border-transparent hover:border-brand-primary/20"
              >
                <FontAwesomeIcon icon={faStore} className="text-brand-primary" />
                Vender
              </Link>
            )}

            {/* Cart Icon - Solo para usuarios comunes */}
            {!isAdmin && (
              <Link to="/cart" className="relative p-2.5 text-brand-secondary hover:bg-gray-100 rounded-xl transition-all group">
                <FontAwesomeIcon icon={faShoppingCart} className="text-xl group-hover:scale-110 transition-transform" />
                <AnimatePresence>
                  {totalItems > 0 && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="absolute top-1 right-1 bg-brand-accent text-white text-[10px] font-black min-w-[20px] h-[20px] px-1 rounded-full flex items-center justify-center shadow-md border-2 border-white"
                    >
                      {totalItems > 99 ? '99+' : totalItems}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            )}

            {!user ? (
               <div className="flex items-center gap-2 ml-2">
                <Link to="/login" className="hidden sm:block text-brand-secondary font-bold text-sm px-4 py-2 hover:bg-gray-100 rounded-xl transition-colors">
                  Ingresar
                </Link>
                <Link to="/register" className="btn-primary text-xs py-2.5 px-6 shadow-brand/20">
                  Registrarse
                </Link>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <button 
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 pl-3 bg-gray-100/50 border border-gray-200 rounded-2xl hover:bg-white hover:shadow-md transition-all group"
                >
                  <div className="hidden sm:flex flex-col items-end mr-1 text-right">
                    <span className="text-[11px] font-black text-brand-secondary leading-tight">{user.name}</span>
                    <span className="text-[9px] text-gray-500 font-medium uppercase tracking-tighter">Mi Cuenta</span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-secondary to-blue-800 flex items-center justify-center text-white font-black shadow-inner shadow-black/20 text-sm overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      user.name && user.name[0].toUpperCase()
                    )}
                  </div>
                  <FontAwesomeIcon 
                    icon={faChevronDown} 
                    className={`text-[10px] text-gray-400 mr-2 transition-transform duration-300 ${showProfileMenu ? 'rotate-180 text-brand-secondary' : ''}`} 
                  />
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 p-2 z-[100] overflow-hidden"
                    >
                      <div className="px-4 py-3 mb-2 bg-gray-50 rounded-xl border border-gray-100 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center text-brand-secondary font-black text-xs overflow-hidden flex-shrink-0">
                          {user.avatar_url ? (
                            <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                          ) : (
                            user.name?.[0]?.toUpperCase()
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-tight">Identificado como</p>
                          <p className="text-sm font-black text-brand-secondary truncate">{user.name}</p>
                        </div>
                      </div>

                      {!isAdmin && (
                        <Link 
                          to="/profile" 
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-brand-primary/10 transition-all text-sm font-bold text-gray-700 hover:text-brand-secondary"
                        >
                          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-brand-primary/20">
                            <FontAwesomeIcon icon={faUser} className="text-gray-400" />
                          </div>
                          Panel de Control
                        </Link>
                      )}

                      {isAdmin && (
                        <Link 
                          to="/admin" 
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-blue-50 transition-all text-sm font-bold text-blue-700"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <FontAwesomeIcon icon={faShieldAlt} />
                          </div>
                          Administración
                        </Link>
                      )}

                      {!isAdmin && (
                        <Link 
                          to="/my-products" 
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-amber-50 lg:hidden transition-all text-sm font-bold text-amber-600"
                        >
                          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                            <FontAwesomeIcon icon={faStore} />
                          </div>
                          Vender productos
                        </Link>
                      )}
                      
                      <div className="h-px bg-gray-100 my-2 mx-2"></div>
                      
                      <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-all text-sm font-bold text-red-600"
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center">
                          <FontAwesomeIcon icon={faSignOutAlt} />
                        </div>
                        Cerrar sesión
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Mobile Menu Trigger */}
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="xl:hidden p-2.5 text-brand-secondary hover:bg-gray-100 rounded-xl transition-all"
            >
              <FontAwesomeIcon icon={isOpen ? faTimes : faBars} className="text-xl" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="xl:hidden bg-white border-t border-gray-100 shadow-2xl overflow-hidden"
          >
            <div className="px-4 py-6 space-y-2">
              <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center gap-4 px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:bg-brand-primary/10 transition-colors">
                <FontAwesomeIcon icon={faHome} className="text-brand-primary w-5" />
                Inicio
              </Link>
              <Link to="/shop" onClick={() => setIsOpen(false)} className="flex items-center gap-4 px-4 py-3 rounded-xl text-base font-bold text-gray-700 hover:bg-brand-primary/10 transition-colors">
                <FontAwesomeIcon icon={faCompass} className="text-brand-primary w-5" />
                Explorar Marketplace
              </Link>
              
              {!user && (
                <div className="pt-4 grid grid-cols-2 gap-4">
                  <Link to="/login" onClick={() => setIsOpen(false)} className="btn-outline text-sm">Ingresar</Link>
                  <Link to="/register" onClick={() => setIsOpen(false)} className="btn-primary text-sm">Regístrate</Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
