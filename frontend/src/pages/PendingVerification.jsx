import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelopeOpenText, faPaperPlane, faArrowLeft, faCircleCheck, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { resendVerification, verifyEmail } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const PendingVerification = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const email = location.state?.email || '';

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newCode = [...code];
    newCode[index] = value.substring(value.length - 1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }

    if (newCode.every(digit => digit !== '') && value) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs[index - 1].current.focus();
    }
  };

  const handleVerify = async (verificationCode) => {
    const finalCode = verificationCode || code.join('');
    if (finalCode.length !== 6) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const data = await verifyEmail(email, finalCode);
      setSuccess(true);
      setMessage(data.message);

      setTimeout(() => {
        login(data.user, data.token);
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Código inválido o expirado.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError('');
    setMessage('');

    try {
      await resendVerification(email);
      setMessage('Un nuevo código de 6 dígitos ha sido enviado a tu correo.');
    } catch (err) {
      setError(err.message || 'Error al reenviar el correo.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass-card p-10 text-center space-y-8"
      >
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center text-brand-primary shadow-inner">
            <FontAwesomeIcon icon={success ? faCircleCheck : faEnvelopeOpenText} size="3x" className={success ? 'text-green-500' : ''} />
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-display font-bold text-brand-secondary">
            {success ? '¡Cuenta Verificada!' : 'Verifica tu cuenta'}
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-medium">
            {success
              ? 'Redirigiéndote al inicio...'
              : 'Ingresa el código de 6 dígitos que enviamos a:'}
          </p>
          {!success && (
            <p className="font-bold text-brand-secondary mt-1">{email}</p>
          )}
        </div>

        {success ? (
          <div className="py-8">
            <div className="flex justify-center items-center gap-3 text-green-600 font-bold bg-green-50 p-4 rounded-2xl">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              <span>Iniciando sesión...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex justify-between gap-2">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={inputRefs[index]}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  disabled={loading}
                  className="w-full h-14 text-center text-2xl font-bold border-2 border-brand-border rounded-2xl focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 outline-none transition-all bg-white/50"
                />
              ))}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-sm font-semibold">
                  {error}
                </motion.div>
              )}
              {message && !error && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-2xl text-sm font-semibold">
                  {message}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4 pt-4">
              <button
                onClick={() => handleVerify()}
                disabled={loading || code.some(d => !d)}
                className="btn-primary w-full py-4"
              >
                {loading && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                {!loading && <span>Verificar e iniciar sesión</span>}
              </button>

              <div className="flex flex-col gap-4 items-center">
                <button
                  onClick={handleResend}
                  disabled={resendLoading || loading}
                  className="flex items-center gap-2 text-sm font-bold text-brand-secondary hover:text-brand-accent transition-colors disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faPaperPlane} className={resendLoading ? 'animate-pulse' : ''} />
                  {resendLoading ? 'Reenviando...' : 'Reenviar código'}
                </button>

                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-secondary transition-colors"
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  Volver al inicio de sesión
                </Link>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PendingVerification;
