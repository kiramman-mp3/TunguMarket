import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars, faTimes, faShoppingBag, faUserCircle } from '@fortawesome/free-solid-svg-icons';

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed w-full top-0 z-50 glass-card rounded-none border-b border-brand-primary/20 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
            <div className="w-10 h-10 bg-brand-primary rounded-lg flex items-center justify-center shadow-md">
              <FontAwesomeIcon icon={faShoppingBag} className="text-brand-secondary text-xl" />
            </div>
            <span className="font-display font-bold text-2xl text-brand-secondary tracking-tight">
              TunguMarket
            </span>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex space-x-8 items-center">
            <a href="#inicio" className="text-gray-600 hover:text-brand-primary font-medium transition-colors">Inicio</a>
            <a href="#beneficios" className="text-gray-600 hover:text-brand-primary font-medium transition-colors">Beneficios</a>
            <a href="#categorias" className="text-gray-600 hover:text-brand-primary font-medium transition-colors">Explorar</a>
            <a href="#comunidad" className="text-gray-600 hover:text-brand-primary font-medium transition-colors">Comunidad</a>
            
            <div className="flex items-center space-x-4 ml-6 pl-6 border-l border-gray-200">
              <button className="text-brand-secondary hover:text-brand-accent font-medium flex items-center gap-2 transition-colors">
                <FontAwesomeIcon icon={faUserCircle} className="text-lg" />
                <span>Ingresar</span>
              </button>
              <button className="btn-primary text-sm py-2 px-5">
                Regístrate
              </button>
            </div>
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
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
        <div className="md:hidden bg-white border-t border-gray-100 shadow-xl absolute w-full">
          <div className="px-4 pt-2 pb-6 space-y-1 sm:px-3">
            <a href="#inicio" className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-light/50">Inicio</a>
            <a href="#beneficios" className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-light/50">Beneficios</a>
            <a href="#categorias" className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:text-brand-primary hover:bg-brand-light/50">Explorar</a>
            
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-3 px-3">
              <button className="w-full text-left font-medium text-brand-secondary py-2 flex items-center gap-2">
                <FontAwesomeIcon icon={faUserCircle} />
                Ingresar
              </button>
              <button className="w-full btn-primary text-center">
                Regístrate
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
