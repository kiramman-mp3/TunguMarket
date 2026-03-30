import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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

  // Redirect if no email (direct access to page)
  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  const handleChange = (index, value) => {
    if (isNaN(value)) return; // Only allow numbers

    const newCode = [...code];
    newCode[index] = value.substring(value.length - 1);
    setCode(newCode);

    // Move to next input if value is entered
    if (value && index < 5) {
      inputRefs[index + 1].current.focus();
    }

    // Auto-submit if all digits are filled
    if (newCode.every(digit => digit !== '') && value) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    // Move to previous input on backspace if current is empty
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
      
      // Log in automatically and redirect after a short delay
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
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full glass-card p-10 text-center space-y-8 shadow-2xl rounded-3xl border border-white/20"
      >
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-brand-primary/20 rounded-full flex items-center justify-center text-brand-primary shadow-inner">
            <FontAwesomeIcon icon={success ? faCircleCheck : faEnvelopeOpenText} size="3x" className={success ? 'text-green-500' : ''} />
          </div>
        </div>

        <div>
          <h2 className="text-3xl font-display font-bold text-brand-dark">
            {success ? '¡Cuenta Verificada!' : 'Verifica tu cuenta'}
          </h2>
          <p className="mt-2 text-gray-500">
            {success 
              ? 'Redirigiéndote al inicio...' 
              : 'Ingresa el código de 6 dígitos que enviamos a:'}
          </p>
          {!success && (
            <p className="font-bold text-brand-secondary">{email}</p>
          )}
        </div>

        {success ? (
          <div className="py-8">
            <div className="flex justify-center items-center gap-2 text-green-600 font-bold">
              <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              <span>Iniciando sesión...</span>
            </div>
          </div>
        ) : (
          <>
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
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/20 outline-none transition-all bg-white/50 backdrop-blur-sm disabled:opacity-50"
                />
              ))}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
                {error}
              </div>
            )}

            {message && !error && (
              <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium">
                {message}
              </div>
            )}

            <div className="space-y-4 pt-4">
              <button
                onClick={() => handleVerify()}
                disabled={loading || code.some(d => !d)}
                className="w-full py-4 px-4 bg-brand-primary hover:bg-brand-primary/90 text-brand-dark font-bold rounded-xl transition-all shadow-lg shadow-brand-primary/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                Verificar e iniciar sesión
              </button>

              <button
                onClick={handleResend}
                disabled={resendLoading || loading}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm font-semibold text-brand-secondary hover:text-brand-primary transition-colors disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faPaperPlane} className={resendLoading ? 'animate-pulse' : ''} />
                {resendLoading ? 'Reenviando...' : 'Reenviar código de verificación'}
              </button>

              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-brand-dark transition-colors"
              >
                <FontAwesomeIcon icon={faArrowLeft} />
                Volver al login
              </Link>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PendingVerification;
