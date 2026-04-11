import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingBag, faUserLock, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useNavigate, useLocation } from 'react-router-dom';

const LoginPromptModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = () => {
    // Guardar la ubicación actual para volver después del login
    onClose();
    navigate('/login', { state: { from: location.pathname } });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop with premium blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-brand-dark/40 backdrop-blur-md"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md overflow-hidden glass-card p-10 shadow-premium"
          >
            {/* Top Pattern Decoration */}
            <div className="absolute top-0 left-0 h-2 w-full bg-gradient-to-r from-brand-primary via-brand-accent to-brand-primary" />
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-brand-secondary transition-colors"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-brand-primary/10 border-2 border-brand-primary/20">
                <FontAwesomeIcon icon={faUserLock} className="text-5xl text-brand-primary" />
              </div>

              <h2 className="mb-4 text-3xl font-display font-black text-brand-secondary leading-tight">
                ¡Tu Carrito te <br />
                <span className="text-brand-primary">está esperando!</span>
              </h2>
              
              <p className="mb-10 text-lg text-gray-600 font-sans leading-relaxed">
                Para agregar productos y disfrutar de la mejor experiencia en <strong>TunguMarket</strong>, necesitas iniciar sesión.
              </p>

              <div className="flex flex-col w-full gap-4">
                <button
                  onClick={handleLogin}
                  className="w-full bg-brand-secondary text-white font-bold py-4 px-6 
                           rounded-2xl shadow-brand hover:shadow-brand-hover 
                           hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] 
                           transition-all duration-300 flex items-center justify-center gap-2 group"
                >
                  <span className="relative z-10 text-lg">Iniciar Sesión</span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
                </button>

                <button
                  onClick={onClose}
                  className="w-full bg-transparent text-brand-secondary font-bold py-4 px-6 
                           rounded-2xl border-2 border-gray-100 hover:bg-gray-50
                           transition-all duration-300"
                >
                  Continuar Explorando
                </button>
              </div>
              
              <p className="mt-8 text-sm text-brand-muted font-medium">
                ¿No tienes cuenta? <span onClick={() => { onClose(); navigate('/register'); }} className="text-brand-primary cursor-pointer hover:underline">Regístrate gratis</span>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoginPromptModal;
