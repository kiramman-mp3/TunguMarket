import { useState, useCallback } from 'react';

/**
 * Hook para manejar notificaciones Toast
 * @returns {Object} { message, type, showToast, closeToast }
 */
export const useToast = () => {
  const [message, setMessage] = useState('');
  const [type, setType] = useState('info');

  const showToast = useCallback((msg, toastType = 'info', duration = 3000) => {
    setMessage(msg);
    setType(toastType);
    
    if (duration) {
      setTimeout(() => {
        setMessage('');
      }, duration);
    }
  }, []);

  const closeToast = useCallback(() => {
    setMessage('');
  }, []);

  const success = useCallback((msg, duration = 3000) => {
    showToast(msg, 'success', duration);
  }, [showToast]);

  const error = useCallback((msg, duration = 3000) => {
    showToast(msg, 'error', duration);
  }, [showToast]);

  const info = useCallback((msg, duration = 3000) => {
    showToast(msg, 'info', duration);
  }, [showToast]);

  return {
    message,
    type,
    showToast,
    closeToast,
    success,
    error,
    info
  };
};

export default useToast;
