import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faLock, faArrowRight } from '@fortawesome/free-solid-svg-icons';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { loginUser, googleLogin as apiGoogleLogin } from '../api/auth';
import { auth, googleProvider } from '../config/firebase';
import { signInWithPopup } from 'firebase/auth';

const Login = () => {
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
      const data = await loginUser({ email, password });
      login(data.user, data.token);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Error al iniciar sesión');
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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-brand-light/30">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full space-y-8 glass-card p-8 md:p-10 shadow-2xl rounded-3xl border border-white/20"
      >
        <div>
          <h2 className="mt-6 text-center text-3xl font-display font-bold text-brand-dark">
            Bienvenido de nuevo
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingresa a tu cuenta en <span className="text-brand-primary font-bold">TunguMarket</span>
          </p>
        </div>

        {/* Google Sign In Button */}
        <div className="mt-6">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-gray-200 rounded-xl bg-white hover:bg-gray-50 text-gray-700 font-medium transition-all shadow-sm group"
          >
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
            Continuar con Google
          </button>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-gray-200"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-transparent text-gray-500 font-medium bg-[#fcfcfc] backdrop-blur-md">o ingresa con correo</span>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-brand-primary transition-colors">
                  <FontAwesomeIcon icon={faEnvelope} className="text-gray-400 group-focus-within:text-brand-primary" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all sm:text-sm bg-white/50 backdrop-blur-sm"
                  placeholder="ejemplo@correo.com"
                />
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Contraseña
                </label>
                <div className="text-sm">
                  <a href="#" className="font-medium text-brand-secondary hover:text-brand-primary transition-colors">
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none group-focus-within:text-brand-primary transition-colors">
                  <FontAwesomeIcon icon={faLock} className="text-gray-400 group-focus-within:text-brand-primary" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary transition-all sm:text-sm bg-white/50 backdrop-blur-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              className="h-4 w-4 text-brand-primary focus:ring-brand-primary border-gray-300 rounded cursor-pointer"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
              Recordarme
            </label>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-brand-dark bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all shadow-lg hover:shadow-brand-primary/25 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              <span className="absolute right-4 inset-y-0 flex items-center pl-3">
                <FontAwesomeIcon icon={faArrowRight} className={`h-4 w-4 transition-transform ${loading ? '' : 'group-hover:translate-x-1'}`} />
              </span>
            </button>
          </div>
          
          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="font-bold text-brand-secondary hover:text-brand-primary transition-colors ml-1">
                Regístrate gratis
              </Link>
            </p>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default Login;
