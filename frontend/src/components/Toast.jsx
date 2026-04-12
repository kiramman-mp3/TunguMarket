import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faExclamationCircle, faInfoCircle, faTimes } from '@fortawesome/free-solid-svg-icons';

const Toast = ({ 
  message, 
  type = 'info', 
  onClose, 
  duration = 3000,
  position = 'top-right'
}) => {
  useEffect(() => {
    if (!message) return;
    
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  const getIcon = () => {
    switch(type) {
      case 'success': return faCheckCircle;
      case 'error': return faExclamationCircle;
      case 'info': return faInfoCircle;
      default: return faInfoCircle;
    }
  };

  const getStyles = () => {
    switch(type) {
      case 'success':
        return 'bg-green-50 border border-green-200 text-green-700';
      case 'error':
        return 'bg-red-50 border border-red-200 text-red-700';
      case 'info':
        return 'bg-blue-50 border border-blue-200 text-blue-700';
      default:
        return 'bg-gray-50 border border-gray-200 text-gray-700';
    }
  };

  const positionClasses = {
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-center': 'top-6 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-6 left-1/2 -translate-x-1/2'
  };

  if (!message) return null;

  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className={`fixed ${positionClasses[position]} z-50 max-w-sm`}
        >
          <div className={`p-4 rounded-xl font-bold text-sm flex items-center gap-3 shadow-lg backdrop-blur-sm ${getStyles()}`}>
            <FontAwesomeIcon icon={getIcon()} className="flex-shrink-0" />
            <span className="flex-1">{message}</span>
            <button
              onClick={onClose}
              className="flex-shrink-0 hover:opacity-70 transition-opacity"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Toast;
