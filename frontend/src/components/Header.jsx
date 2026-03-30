import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faShoppingBag, faUserCircle, faSignOutAlt, faShieldAlt, faStore, faHistory } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
    setIsOpen(false);
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
            
            {user ? (
              <>
                <Link to="/profile" className="text-gray-600 hover:text-brand-primary font-medium flex items-center gap-2 transition-colors">
                  <FontAwesomeIcon icon={faHistory} className="text-sm" />
                  Seguridad
                </Link>
                
                {!isAdmin && (
                  <>
                    <Link to="/#vender" className="text-gray-600 hover:text-brand-primary font-medium flex items-center gap-2 transition-colors">
                      <FontAwesomeIcon icon={faStore} className="text-sm" />
                      Vender
                    </Link>
                  </>
                )}

                {isAdmin && (
                  <Link to="/admin" className="text-brand-secondary bg-brand-primary/10 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 border border-brand-primary/30">
                    <FontAwesomeIcon icon={faShieldAlt} />
                    Panel Admin
                  </Link>
                )}

                <div className="flex items-center space-x-4 ml-6 pl-6 border-l border-gray-200">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold text-brand-secondary">{user.name}</span>
                    <span className="text-[10px] text-gray-400 capitalize">{user.role}</span>
                  </div>
                  <button 
                    onClick={handleLogout}
                    className="w-10 h-10 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition-all"
                    title="Cerrar sesión"
                  >
                    <FontAwesomeIcon icon={faSignOutAlt} />
                  </button>
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
              <div className="mr-4 flex flex-col items-end">
                <span className="text-[10px] font-bold text-brand-secondary">{user.name}</span>
              </div>
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
            <Link to="/" onClick={() => setIsOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-light/50">Inicio</Link>
            
            {user ? (
              <>
                <Link to="/profile" onClick={() => setIsOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-light/50">Mi Perfil y Seguridad</Link>
                {isAdmin && (
                  <Link to="/admin" onClick={() => setIsOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-brand-primary font-bold bg-brand-light/20">Panel Administrativo</Link>
                )}
                {!isAdmin && (
                  <Link to="/#vender" onClick={() => setIsOpen(false)} className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-light/50">Vender Productos</Link>
                )}
                <button 
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-3 rounded-md text-base font-medium text-red-600 hover:bg-red-50 flex items-center gap-2"
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
                  className="w-full btn-primary text-center"
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
