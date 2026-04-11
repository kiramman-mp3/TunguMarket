import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faShoppingBag, faUserCircle, faSignOutAlt, faShieldAlt, faStore, faHistory, faUser, faChevronDown, faShoppingCart } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const navigate = useNavigate();
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

  const isAdmin = user?.role === 'admin';

  return (
    <header className="fixed w-full top-0 z-50 glass-card rounded-none border-b border-brand-primary/20 transition-all duration-300">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <Link to="/" className="flex-shrink-0 flex items-center gap-2 cursor-pointer group">
            <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <FontAwesomeIcon icon={faShoppingBag} className="text-brand-secondary text-xl" />
            </div>
            <span className="font-display font-bold text-2xl text-brand-secondary tracking-tight">
              TunguMarket
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-8 items-center">
            <Link to="/" className="text-gray-600 hover:text-brand-primary font-medium transition-colors">Inicio</Link>
            <Link to="/shop" className="text-gray-600 hover:text-brand-primary font-medium transition-colors">Explorar</Link>
            
            {/* Cart Icon */}
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-brand-primary transition-colors group">
              <FontAwesomeIcon icon={faShoppingCart} className="text-xl" />
              <AnimatePresence>
                {totalItems > 0 && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1 -right-1 bg-brand-accent text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-lg border-2 border-white"
                  >
                    {totalItems > 9 ? '9+' : totalItems}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>

            {user ? (
              <>
                {!isAdmin && (
                  <Link to="/my-products" className="text-gray-600 hover:text-brand-primary font-medium flex items-center gap-2 transition-colors">
                    <FontAwesomeIcon icon={faStore} className="text-sm" />
                    Vender
                  </Link>
                )}

                {isAdmin && (
                  <Link to="/admin" className="text-brand-secondary bg-brand-primary/10 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border border-brand-primary/30 hover:bg-brand-primary/20 transition-colors">
                    <FontAwesomeIcon icon={faShieldAlt} />
                    Panel Admin
                  </Link>
                )}

                {/* Profile Avatar & Dropdown */}
                <div className="relative ml-4 pl-4 border-l border-gray-200" ref={dropdownRef}>
                  <button 
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <div className="flex flex-col items-end mr-1">
                      <span className="text-xs font-bold text-brand-secondary">{user.name}</span>
                      <span className="text-[10px] text-gray-400 capitalize">{user.role}</span>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-brand-primary/20 border-2 border-brand-primary/30 flex items-center justify-center text-brand-secondary font-bold overflow-hidden">
                      {user.name && user.name[0].toUpperCase()}
                    </div>
                    <FontAwesomeIcon 
                      icon={faChevronDown} 
                      className={`text-[10px] text-gray-400 transition-transform ${showProfileMenu ? 'rotate-180' : ''}`} 
                    />
                  </button>

                  <AnimatePresence>
                    {showProfileMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-4 w-56 glass-card shadow-xl p-2 z-[100]"
                      >
                        <Link 
                          to="/profile" 
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-brand-light/50 transition-colors text-sm font-semibold text-gray-700"
                        >
                          <FontAwesomeIcon icon={faUser} className="text-brand-secondary/60" />
                          Cuenta y Seguridad
                        </Link>
                        
                        <div className="h-px bg-gray-100 my-2 mx-2"></div>
                        
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-red-50 transition-colors text-sm font-semibold text-red-600"
                        >
                          <FontAwesomeIcon icon={faSignOutAlt} />
                          Cerrar sesión
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-4 ml-6 pl-6 border-l border-gray-200">
                <Link to="/login" className="text-brand-secondary hover:text-brand-primary font-medium flex items-center gap-2 transition-colors">
                  <FontAwesomeIcon icon={faUserCircle} className="text-lg" />
                  <span>Ingresar</span>
                </Link>
                <Link to="/register" className="btn-primary text-sm py-2 px-5 shadow-sm">
                  Regístrate
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            {user && (
              <Link to="/profile" className="mr-4">
                <div className="w-9 h-9 rounded-full bg-brand-primary/20 border border-brand-primary/30 flex items-center justify-center text-brand-secondary font-bold text-sm">
                  {user.name && user.name[0].toUpperCase()}
                </div>
              </Link>
            )}
            <button 
              onClick={() => setIsOpen(!isOpen)}
              className="text-brand-secondary hover:text-brand-primary focus:outline-none"
            >
              <FontAwesomeIcon icon={isOpen ? faTimes : faBars} className="text-2xl" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl absolute w-full rounded-b-2xl">
          <div className="px-4 pt-2 pb-6 space-y-1 sm:px-3">
            <Link to="/" onClick={() => setIsOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-light/50 transition-colors">Inicio</Link>
            <Link to="/shop" onClick={() => setIsOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-light/50 transition-colors">Explorar Marketplace</Link>
            <Link to="/cart" onClick={() => setIsOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-light/50 transition-colors flex items-center justify-between">
              <span>Mi Carrito</span>
              {totalItems > 0 && (
                <span className="bg-brand-accent text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
            
            {user ? (
              <>
                <Link to="/profile" onClick={() => setIsOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-light/50 transition-colors">Mi Perfil y Seguridad</Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setIsOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-brand-primary font-bold bg-brand-light/20 transition-colors">Panel Administrativo</Link>
                )}
                {!isAdmin && (
                  <Link to="/my-products" onClick={() => setIsOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-light/50 transition-colors">Vender (Mis Productos)</Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-3 rounded-md text-base font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                >
                  <FontAwesomeIcon icon={faSignOutAlt} />
                  Cerrar sesión
                </button>
              </>
            ) : (
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3 px-3">
                <Link 
                  to="/login" 
                  onClick={() => setIsOpen(false)}
                  className="w-full text-left font-medium text-brand-secondary py-2 flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faUserCircle} />
                  Ingresar
                </Link>
                <Link 
                  to="/register" 
                  onClick={() => setIsOpen(false)}
                  className="w-full btn-primary text-center shadow-md"
                >
                  Regístrate
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
