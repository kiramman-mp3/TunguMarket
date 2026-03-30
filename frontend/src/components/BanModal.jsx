import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

const BanModal = ({ isOpen, onClose }) => {
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

          {/* Modal Content - Using App's Glass Card style */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-md overflow-hidden glass-card p-10 shadow-premium"
          >
            {/* Top Pattern Decoration with Brand Colors */}
            <div className="absolute top-0 left-0 h-2 w-full bg-gradient-to-r from-brand-error via-brand-accent to-brand-error" />
            
            <div className="flex flex-col items-center text-center">
              <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-brand-error/10 border-2 border-brand-error/20">
                <FontAwesomeIcon icon={faExclamationTriangle} className="text-5xl text-brand-error" />
              </div>

              <h2 className="mb-4 text-3xl font-display font-black text-brand-secondary leading-tight">
                Cuenta <br />
                <span className="text-brand-error">Suspendida</span>
              </h2>
              
              <p className="mb-10 text-lg text-gray-600 font-sans leading-relaxed">
                Tu acceso a <strong>TunguMarket</strong> ha sido restringido por incumplimiento de nuestras políticas de seguridad.
              </p>

              <button
                onClick={onClose}
                className="w-full bg-brand-secondary text-white font-bold py-4 px-6 
                         rounded-2xl shadow-brand hover:shadow-brand-hover 
                         hover:-translate-y-1 active:translate-y-0 active:scale-[0.98] 
                         transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                <span className="relative z-10 text-lg">Cerrar Sesión Segura</span>
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              </button>
              
              <p className="mt-6 text-sm text-brand-muted font-medium">
                ¿Dudas? Escríbenos: <span className="text-brand-secondary underline">soporte@tungumarket.com</span>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BanModal;
