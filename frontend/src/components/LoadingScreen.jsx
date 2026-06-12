import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShoppingBag } from '@fortawesome/free-solid-svg-icons';

const LoadingScreen = ({ message = "Cargando..." }) => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-brand-light/80 backdrop-blur-md">
      <div className="relative">
        {/* Outer Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-24 h-24 border-4 border-brand-primary/20 border-t-brand-primary rounded-full"
        />
        
        {/* Inner Pulsing Circle */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 m-auto w-12 h-12 bg-brand-secondary rounded-2xl shadow-lg flex items-center justify-center"
        >
          <FontAwesomeIcon icon={faShoppingBag} className="text-white text-xl" />
        </motion.div>
      </div>
      
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6 text-brand-secondary font-black text-xs uppercase tracking-[0.3em]"
      >
        {message}
      </motion.p>
    </div>
  );
};

export default LoadingScreen;
