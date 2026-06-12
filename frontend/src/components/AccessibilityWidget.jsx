import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUniversalAccess, faTimes, faMoon, faSun, faAdjust, faBold, faUndo } from '@fortawesome/free-solid-svg-icons';
import { useTheme } from '../context/ThemeContext';

const AccessibilityWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  const { darkMode, highContrast, boldText, toggleDarkMode, toggleHighContrast, toggleBoldText, resetAll } = useTheme();

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hasAnyActive = darkMode || highContrast || boldText;

  return (
    <div className="fixed bottom-6 left-6 z-[9999]" ref={panelRef}>
      {/* Botón flotante */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className={`accessibility-fab w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${
          isOpen 
            ? 'bg-brand-secondary text-white rotate-0' 
            : hasAnyActive
              ? 'bg-brand-primary text-brand-secondary'
              : 'bg-brand-secondary text-white'
        }`}
        aria-label="Opciones de accesibilidad"
        title="Accesibilidad"
      >
        <FontAwesomeIcon 
          icon={isOpen ? faTimes : faUniversalAccess} 
          className="text-2xl"
        />
        {hasAnyActive && !isOpen && (
          <span className="absolute top-0 right-0 w-4 h-4 bg-brand-primary border-2 border-white rounded-full animate-pulse" />
        )}
      </motion.button>

      {/* Panel de opciones */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: 'spring', bounce: 0.25, duration: 0.4 }}
            className="accessibility-panel absolute bottom-20 left-0 w-72 rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="accessibility-panel-header px-5 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <FontAwesomeIcon icon={faUniversalAccess} className="text-lg" />
              </div>
              <div>
                <h3 className="font-black text-sm">Accesibilidad</h3>
                <p className="text-[10px] font-bold opacity-70 uppercase tracking-widest">Preferencias visuales</p>
              </div>
            </div>

            {/* Opciones */}
            <div className="p-3 space-y-1.5">
              {/* Modo Oscuro */}
              <button
                onClick={toggleDarkMode}
                className={`accessibility-option w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-sm font-bold ${
                  darkMode ? 'active' : ''
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  darkMode ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  <FontAwesomeIcon icon={darkMode ? faSun : faMoon} />
                </div>
                <span className="flex-1 text-left">Modo Oscuro</span>
                <div className={`accessibility-toggle w-11 h-6 rounded-full p-0.5 transition-all ${
                  darkMode ? 'active' : ''
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                    darkMode ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              </button>

              {/* Alto Contraste */}
              <button
                onClick={toggleHighContrast}
                className={`accessibility-option w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-sm font-bold ${
                  highContrast ? 'active' : ''
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  highContrast ? 'bg-yellow-500 text-black' : 'bg-gray-100 text-gray-400'
                }`}>
                  <FontAwesomeIcon icon={faAdjust} />
                </div>
                <span className="flex-1 text-left">Alto Contraste</span>
                <div className={`accessibility-toggle w-11 h-6 rounded-full p-0.5 transition-all ${
                  highContrast ? 'active' : ''
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                    highContrast ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              </button>

              {/* Texto en Negritas */}
              <button
                onClick={toggleBoldText}
                className={`accessibility-option w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all text-sm font-bold ${
                  boldText ? 'active' : ''
                }`}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                  boldText ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  <FontAwesomeIcon icon={faBold} />
                </div>
                <span className="flex-1 text-left">Texto en Negritas</span>
                <div className={`accessibility-toggle w-11 h-6 rounded-full p-0.5 transition-all ${
                  boldText ? 'active' : ''
                }`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                    boldText ? 'translate-x-5' : 'translate-x-0'
                  }`} />
                </div>
              </button>
            </div>

            {/* Reset */}
            {hasAnyActive && (
              <div className="px-3 pb-3">
                <button
                  onClick={resetAll}
                  className="accessibility-reset w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all"
                >
                  <FontAwesomeIcon icon={faUndo} />
                  Restablecer todo
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AccessibilityWidget;
