import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faLock, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { faCcVisa } from '@fortawesome/free-brands-svg-icons';

const CreditCardForm = ({ onSubmit, total }) => {
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [cardType, setCardType] = useState('unknown');

  useEffect(() => {
    const checkCardType = (number) => {
      const firstDigit = number.charAt(0);
      const firstTwo = number.substring(0, 2);

      if (firstDigit === '4') return 'visa';
      if (['51', '52', '53', '54', '55'].includes(firstTwo)) return 'mastercard';
      if (['34', '37'].includes(firstTwo)) return 'amex';
      return 'unknown';
    };
    setCardType(checkCardType(cardNumber.replace(/\s/g, '')));
  }, [cardNumber]);

  const handleCardNumberChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    value = value.substring(0, 16);
    const parts = value.match(/.{1,4}/g) || [];
    setCardNumber(parts.join(' '));
  };

  const handleExpiryChange = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setExpiry(value.substring(0, 5));
  };

  const handleCvcChange = (e) => {
    setCvc(e.target.value.replace(/\D/g, '').substring(0, 4));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (cardNumber.length < 15 || expiry.length < 5 || cvc.length < 3) {
      alert('Por favor completa los datos de la tarjeta correctamente');
      return;
    }
    onSubmit();
  };

  const getCardIcon = () => {
    switch (cardType) {
      case 'visa': return { type: 'icon', value: faCcVisa, color: 'white' };
      case 'mastercard': return { type: 'image', value: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg' };
      case 'amex': return { type: 'image', value: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/American_Express_logo_%282018%29.svg' };
      default: return null;
    }
  };

  // Clases de gradiente dinámicas según el tipo de tarjeta
  const getCardClasses = () => {
    switch (cardType) {
      case 'visa': return 'bg-gradient-to-br from-[#1A1F71] to-[#2B32B2]';
      case 'mastercard': return 'bg-gradient-to-br from-[#EB001B] to-[#FF5F00]';
      case 'amex': return 'bg-gradient-to-br from-[#007BC1] to-[#01a6ce]';
      default: return 'bg-gradient-to-br from-gray-700 to-gray-900';
    }
  };

  return (
    <div className="space-y-8">
      {/* Card Preview - REAL ASPECT RATIO 1.586/1 */}
      <motion.div
        layout
        className={`relative aspect-[1.586/1] w-full max-w-sm mx-auto rounded-[1.25rem] p-8 text-white shadow-2xl overflow-hidden transition-all duration-700 ${getCardClasses()}`}
      >
        <div className="relative z-10 h-full flex flex-col justify-between">
          <div className="flex justify-between items-start">
            {/* Chip Reemplazado por uno más Realista */}
            <div className="w-12 h-9 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-md shadow-inner opacity-90 border border-yellow-200/50" />
            {getCardIcon() && (
              <div className="h-16 flex items-center">
                {getCardIcon().type === 'icon' ? (
                  <FontAwesomeIcon
                    icon={getCardIcon().value}
                    style={{ color: 'white' }}
                    className="text-6xl drop-shadow-md bg-white/10 p-2 rounded-xl backdrop-blur-sm"
                  />
                ) : (
                  <img
                    src={getCardIcon().value}
                    alt={cardType}
                    className="h-14 object-contain drop-shadow-md p-1 bg-white/20 rounded-xl backdrop-blur-sm"
                  />
                )}
              </div>
            )}
          </div>

          <div className="mt-auto">
            <p className="text-xl md:text-2xl tracking-[0.15em] font-mono drop-shadow-lg mb-6">
              {cardNumber || '•••• •••• •••• ••••'}
            </p>

            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <p className="text-[9px] uppercase tracking-[0.2em] font-black opacity-80 text-shadow-sm">Titular </p>
                <p className="text-sm font-black tracking-widest truncate max-w-[180px] drop-shadow-md">
                  {cardHolder.toUpperCase() || 'TU NOMBRE AQUÍ'}
                </p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-[9px] uppercase tracking-[0.2em] font-black opacity-80 text-shadow-sm">Expiración</p>
                <p className="text-sm font-black tracking-widest drop-shadow-md">{expiry || 'MM/YY'}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Número de Tarjeta</label>
          <div className="relative">
            <input
              required
              type="text"
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={handleCardNumberChange}
              className="w-full bg-white border-2 border-gray-100 rounded-2xl px-12 py-4 font-bold text-brand-secondary focus:border-brand-primary outline-none transition-all"
            />
            <FontAwesomeIcon icon={faCreditCard} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Nombre en la Tarjeta</label>
          <input
            required
            type="text"
            placeholder="TU NOMBRE"
            value={cardHolder}
            onChange={(e) => setCardHolder(e.target.value)}
            className="w-full bg-white border-2 border-gray-100 rounded-2xl px-6 py-4 font-bold text-brand-secondary focus:border-brand-primary outline-none transition-all uppercase"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Expira</label>
            <input
              required
              type="text"
              placeholder="MM/YY"
              value={expiry}
              onChange={handleExpiryChange}
              className="w-full bg-white border-2 border-gray-100 rounded-2xl px-6 py-4 font-bold text-brand-secondary focus:border-brand-primary outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">CVC</label>
            <div className="relative">
              <input
                required
                type="password"
                placeholder="•••"
                value={cvc}
                onChange={handleCvcChange}
                className="w-full bg-white border-2 border-gray-100 rounded-2xl px-12 py-4 font-bold text-brand-secondary focus:border-brand-primary outline-none transition-all"
              />
              <FontAwesomeIcon icon={faLock} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary w-full py-5 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <FontAwesomeIcon icon={faCheckCircle} />
          Pagar ${total}
        </button>
      </form>
    </div>
  );
};

export default CreditCardForm;
