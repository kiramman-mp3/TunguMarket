import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faArrowLeft, faPaperPlane, faSpinner, faCheckCircle } from '@fortawesome/free-solid-svg-icons';
import { forgotPassword } from '../api/auth';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

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

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-card p-10 space-y-8"
      >
        <div className="text-center">
          <h2 className="text-3xl font-display font-bold text-brand-secondary">
            ¿Olvidaste tu contraseña?
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-medium font-sans">
            No te preocupes. Ingresa tu correo para recibir un código de recuperación.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {sent ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-8"
            >
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 shadow-inner">
                  <FontAwesomeIcon icon={faCheckCircle} size="3x" />
                </div>
              </div>

              <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl font-semibold text-sm">
                {message}
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => navigate('/reset-password', { state: { email } })}
                  className="btn-primary w-full"
                >
                  Continuar e ingresar código
                </button>

                <button
                  onClick={() => { setSent(false); setMessage(''); }}
                  className="flex items-center justify-center gap-2 text-sm font-bold text-gray-400 hover:text-brand-secondary transition-colors"
                >
                  <FontAwesomeIcon icon={faEnvelope} />
                  ¿No recibiste nada? Intentar de nuevo
                </button>
              </div>
            </motion.div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <AnimatePresence>
                {error && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-semibold">
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Tu correo electrónico</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-brand-secondary text-gray-400 transition-colors">
                    <FontAwesomeIcon icon={faEnvelope} />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input-field pl-12"
                    placeholder="ejemplo@correo.com"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full group py-4"
              >
                {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'Enviar código'}
                {!loading && <FontAwesomeIcon icon={faPaperPlane} className="h-4 w-4 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />}
              </button>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-secondary transition-colors"
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
