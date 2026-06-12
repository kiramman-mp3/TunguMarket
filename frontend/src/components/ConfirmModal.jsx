import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationCircle, faTimes } from '@fortawesome/free-solid-svg-icons';

const ConfirmModal = ({ 
  isOpen, 
  title = '¿Estás seguro?', 
  message = '¿Confirmar esta acción?',
  confirmText = 'Aceptar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  isDangerous = false
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay oscuro */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black/50 z-40"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md mx-4"
          >
            <div className="bg-slate-800 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden">
              {/* Header */}
              <div className={`p-6 flex items-start gap-4 ${isDangerous ? 'bg-red-950/30 border-b border-red-900/30' : 'bg-blue-950/20 border-b border-blue-900/30'}`}>
                <div className={`text-2xl ${isDangerous ? 'text-red-400' : 'text-blue-400'}`}>
                  <FontAwesomeIcon icon={faExclamationCircle} />
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-bold ${isDangerous ? 'text-red-300' : 'text-blue-300'}`}>
                    {title}
                  </h3>
                  <p className="text-gray-300 text-sm mt-2 leading-relaxed">
                    {message}
                  </p>
                </div>
                <button
                  onClick={onCancel}
                  className="text-gray-400 hover:text-gray-200 transition-colors"
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>

              {/* Buttons */}
              <div className="p-6 flex gap-3 justify-end">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onCancel}
                  className="px-6 py-3 rounded-xl font-semibold text-slate-200 bg-slate-700/50 hover:bg-slate-700 border border-slate-600 transition-colors"
                >
                  {cancelText}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onConfirm}
                  className={`px-6 py-3 rounded-xl font-semibold text-white transition-all ${
                    isDangerous
                      ? 'bg-red-600 hover:bg-red-700 border border-red-500'
                      : 'bg-brand-primary hover:bg-blue-700 border border-blue-400'
                  }`}
                >
                  {confirmText}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ConfirmModal;
