import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faArrowLeft, faPaperPlane } from '@fortawesome/free-solid-svg-icons';
import { forgotPassword } from '../api/auth';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      await forgotPassword(email);
      setMessage('Un código de 6 dígitos ha sido enviado a tu correo.');
      setSent(true);
    } catch (err) {
      setError(err.message || 'Error al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const [sent, setSent] = useState(false);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-card p-10 space-y-6 shadow-2xl rounded-3xl border border-white/20"
      >
        <div className="text-center">
            <h2 className="text-2xl font-display font-bold text-brand-dark">¿Olvidaste tu contraseña?</h2>
            <p className="mt-2 text-sm text-gray-600">No te preocupes. Ingresa tu correo para recibir un código.</p>
        </div>

        {sent ? (
          <div className="text-center space-y-6">
            <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl font-medium">
              {message}
            </div>
            
            <button
              onClick={() => navigate('/reset-password', { state: { email } })}
              className="w-full py-3 px-4 bg-brand-primary hover:bg-brand-primary/90 text-brand-dark font-bold rounded-xl transition-all shadow-lg"
            >
              Ingresar código
            </button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-2 text-sm text-brand-secondary hover:text-brand-primary font-bold transition-colors"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Volver al inicio de sesión
            </Link>
          </div>
        ) : (
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Tu correo electrónico
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-brand-primary transition-colors">
                  <FontAwesomeIcon icon={faEnvelope} className="text-gray-400 group-focus-within:text-brand-primary" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all sm:text-sm bg-white/50 backdrop-blur-sm"
                  placeholder="ejemplo@correo.com"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-primary hover:bg-brand-primary/90 text-brand-dark font-bold rounded-xl transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faPaperPlane} className={loading ? 'animate-pulse' : ''} />
              {loading ? 'Enviando...' : 'Enviar instrucciones'}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-brand-secondary hover:text-brand-primary font-bold transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                Volver al inicio de sesión
              </Link>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
