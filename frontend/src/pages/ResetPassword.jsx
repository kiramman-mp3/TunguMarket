import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faArrowLeft, faCheckCircle, faShieldAlt, faSpinner, faKey } from '@fortawesome/free-solid-svg-icons';
import { validateResetToken, resetPassword } from '../api/auth';

const ResetPassword = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';

  const [step, setStep] = useState(1); // 1: Valida código, 2: Ingresa nueva clave
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState(false);

  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    if (!email) {
      navigate('/forgot-password');
    }
  }, [email, navigate]);

  const handleCodeChange = (index, value) => {
    if (isNaN(value)) return;
    const newCode = [...code];
    newCode[index] = value.substring(value.length - 1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }

    if (newCode.every(digit => digit !== '') && value) {
      handleValidate(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleValidate = async (tokenString) => {
    const finalToken = tokenString || code.join('');
    if (finalToken.length !== 6) return;

    setLoading(true);
    setError('');

    try {
      await validateResetToken(email, finalToken);
      setStep(2);
    } catch (err) {
      setError(err.message || 'Código inválido o expirado.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await resetPassword(email, code.join(''), password);
      setSuccess(true);
      setMessage('¡Contraseña restablecida correctamente!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Error al restablecer la contraseña.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-card p-10 space-y-8"
      >
        <div className="text-center">
          <h2 className="text-3xl font-display font-bold text-brand-secondary">
            {success ? '¡Hecho!' : 'Nueva contraseña'}
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            {step === 1
              ? 'Ingresa el código que recibiste por correo.'
              : success
                ? 'Tu contraseña ha sido actualizada.'
                : 'Crea una clave segura para tu cuenta.'}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-10 space-y-6">
              <div className="flex justify-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-green-500 shadow-inner">
                  <FontAwesomeIcon icon={faCheckCircle} size="3x" />
                </div>
              </div>
              <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-sm font-semibold">
                {message}
              </div>
              <p className="text-xs text-gray-400 font-bold animate-pulse">Redirigiéndote al login...</p>
            </motion.div>
          ) : step === 1 ? (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-8">
              <div className="flex justify-between gap-2">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={inputRefs[index]}
                    type="text"
                    maxLength="1"
                    value={digit}
                    onChange={(e) => handleCodeChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    disabled={loading}
                    className="w-full h-14 text-center text-2xl font-bold border-2 border-brand-border rounded-2xl focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 outline-none transition-all bg-white/50"
                  />
                ))}
              </div>

              {error && <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-semibold text-center">{error}</div>}

              <div className="space-y-4 pt-4">
                <button
                  onClick={() => handleValidate()}
                  disabled={loading || code.some(d => !d)}
                  className="btn-primary w-full py-4"
                >
                  {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'Validar código'}
                </button>

                <div className="text-center">
                  <Link to="/forgot-password" size="sm" className="text-xs font-bold text-gray-400 hover:text-brand-secondary transition-colors underline">
                    ¿No recibiste el código?
                  </Link>
                </div>
              </div>
            </motion.div>
          ) : (
            <form key="step2" className="space-y-6" onSubmit={handleReset}>
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-3">
                <FontAwesomeIcon icon={faShieldAlt} className="text-brand-secondary" />
                <p className="text-xs font-bold text-brand-secondary">Código validado para: {email}</p>
              </div>

              {error && <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-semibold">{error}</div>}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nueva Contraseña</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-brand-secondary text-gray-400">
                      <FontAwesomeIcon icon={faLock} />
                    </div>
                    <input
                      type="password"
                      required
                      autoFocus
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pl-12"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Confirmar Contraseña</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-brand-secondary text-gray-400">
                      <FontAwesomeIcon icon={faKey} />
                    </div>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field pl-12"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 group"
              >
                {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'Restablecer contraseña'}
                {!loading && <FontAwesomeIcon icon={faArrowLeft} className="hidden group-hover:block ml-2 group-hover:rotate-180 transition-transform" size="xs" />}
              </button>
            </form>
          )}
        </AnimatePresence>

        <div className="text-center pt-2">
          <Link to="/login" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-brand-secondary transition-colors font-sans">
            <FontAwesomeIcon icon={faArrowLeft} />
            Volver al inicio de sesión
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ResetPassword;
