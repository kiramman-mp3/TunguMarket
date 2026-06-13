import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faUser, faArrowRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { registerUser } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Simple client-side age check
    const today = new Date();
    const birthDateObj = new Date(birthDate);
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const m = today.getMonth() - birthDateObj.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    
    if (age < 10) {
      setError('Debes tener al menos 10 años para registrarte.');
      return;
    }

    setLoading(true);

    try {
      await registerUser({ name, email, password, birthDate });
      navigate('/pending-verification', { state: { email } });
    } catch (err) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-12 bg-brand-light/30">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full glass-card p-10 space-y-8"
      >
        <div className="text-center">
          <h2 className="text-3xl font-display font-bold text-brand-secondary">
            Crea tu cuenta
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            Únete a la comunidad y apoya lo local.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl overflow-hidden"
              >
                <p className="text-sm text-red-700 font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre completo</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-brand-secondary text-gray-400 transition-colors">
                  <FontAwesomeIcon icon={faUser} />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field pl-12"
                  placeholder="Juan Pérez"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Correo electrónico</label>
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

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha de nacimiento</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-brand-secondary text-gray-400 transition-colors">
                  <FontAwesomeIcon icon={faUser} />
                </div>
                <input
                  type="date"
                  required
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  className="input-field pl-12 text-gray-500"
                />
              </div>
              <p className="mt-1 text-[10px] text-gray-400">Debes ser mayor de 10 años.</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Contraseña</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-brand-secondary text-gray-400 transition-colors">
                  <FontAwesomeIcon icon={faLock} />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>
            </div>
          </div>

          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-brand-secondary focus:ring-brand-primary border-gray-300 rounded cursor-pointer transition-all"
              />
            </div>
            <div className="ml-3 text-xs leading-5">
              <label htmlFor="terms" className="text-gray-500 font-medium font-sans">
                Acepto los <a href="#" className="font-bold text-brand-secondary hover:underline">Términos</a> y la <a href="#" className="font-bold text-brand-secondary hover:underline">Política de Privacidad</a>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full group py-4"
          >
            {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'Crear cuenta'}
            {!loading && <FontAwesomeIcon icon={faArrowRight} className="h-4 w-4 group-hover:translate-x-1 transition-transform" />}
          </button>

          <div className="text-center mt-6">
            <p className="text-sm text-gray-500 font-medium">
              ¿Ya tienes cuenta?{' '}
              <Link to="/login" className="text-brand-secondary font-bold hover:underline transition-all">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Register;
