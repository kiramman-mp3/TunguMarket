import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faUser, faArrowRight, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { registerUser, googleLogin as apiGoogleLogin } from '../api/auth';
import { useAuth } from '../context/AuthContext';
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup } from 'firebase/auth';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await registerUser({ name, email, password });
      navigate('/login');
    } catch (err) {
      setError(err.message || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const idToken = await result.user.getIdToken();
      const data = await apiGoogleLogin(idToken);
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión con Google');
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

        {/* Google Register Section */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="btn-outline w-full"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
            <span className="text-brand-secondary">Continuar con Google</span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest text-gray-400">
              <span className="bg-[#fbfcff] px-4 font-bold">o regístrate con correo</span>
            </div>
          </div>
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
