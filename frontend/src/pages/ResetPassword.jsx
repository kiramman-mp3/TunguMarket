import React, { useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faCheckCircle, faSpinner, faArrowLeft, faEnvelope, faCheck } from '@fortawesome/free-solid-svg-icons';
import { validateResetToken, resetPassword } from '../api/auth';

const ResetPassword = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const passedEmail = location.state?.email || '';

    const [email, setEmail] = useState(passedEmail);
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Validate Code, 2: New Password
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    const inputRefs = [useRef(), useRef(), useRef(), useRef(), useRef(), useRef()];

    const handleCodeChange = (index, value) => {
        if (isNaN(value)) return;
        const newCode = [...code];
        newCode[index] = value.substring(value.length - 1);
        setCode(newCode);

        if (value && index < 5) {
            inputRefs[index + 1].current.focus();
        }

        // Auto-validate if 6th digit is entered
        if (newCode.every(digit => digit !== '') && value) {
            handleValidate(newCode.join(''));
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            inputRefs[index - 1].current.focus();
        }
    };

    const handleValidate = async (finalCode) => {
        const token = finalCode || code.join('');
        if (!email || token.length !== 6) {
            setStatus('error');
            setMessage('Por favor completa el correo y el código de 6 dígitos.');
            return;
        }

        setLoading(true);
        setStatus('loading');
        
        try {
            await validateResetToken(email, token);
            setStep(2);
            setStatus('idle');
            setMessage('');
        } catch (err) {
            setStatus('error');
            setMessage(err.message || 'Código inválido o expirado.');
        } finally {
            setLoading(false);
        }
    };

    const handleReset = async (e) => {
        e.preventDefault();
        const finalCode = code.join('');

        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Las contraseñas no coinciden.');
            return;
        }

        if (password.length < 6) {
            setStatus('error');
            setMessage('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setLoading(true);
        setStatus('loading');
        
        try {
            await resetPassword(email, finalCode, password);
            setStatus('success');
            setMessage('Tu contraseña ha sido restablecida con éxito.');
        } catch (err) {
            setStatus('error');
            setMessage(err.message || 'Error al restablecer la contraseña.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full glass-card p-10 space-y-6 shadow-2xl rounded-3xl border border-white/20"
            >
                <div className="text-center">
                    <h2 className="text-2xl font-display font-bold text-brand-dark">Nueva contraseña</h2>
                    <p className="mt-2 text-sm text-gray-600">
                        {step === 1 
                            ? 'Ingresa el código que recibiste para validar tu identidad.' 
                            : 'Ingresa tu nueva clave de acceso.'}
                    </p>
                </div>

                <AnimatePresence mode="wait">
                    {status === 'success' ? (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center space-y-6"
                        >
                            <div className="flex justify-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-500">
                                    <FontAwesomeIcon icon={faCheckCircle} size="2x" />
                                </div>
                            </div>
                            <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl font-medium">
                                {message}
                            </div>
                            <button
                                onClick={() => navigate('/login')}
                                className="w-full py-3 px-4 bg-brand-primary hover:bg-brand-primary/90 text-brand-dark font-bold rounded-xl transition-all shadow-lg"
                            >
                                Iniciar sesión
                            </button>
                        </motion.div>
                    ) : (
                        <form className="space-y-6" onSubmit={step === 1 ? (e) => { e.preventDefault(); handleValidate(); } : handleReset}>
                            {message && (
                                <div className={`p-3 rounded-xl text-sm font-medium ${status === 'error' ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-gray-50 text-gray-600'}`}>
                                    {message}
                                </div>
                            )}

                            <div className="space-y-4">
                                {step === 1 && (
                                    <motion.div 
                                        key="step1"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="space-y-4"
                                    >
                                        {!passedEmail && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Tu correo electrónico</label>
                                                <div className="relative group">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-primary">
                                                        <FontAwesomeIcon icon={faEnvelope} />
                                                    </div>
                                                    <input
                                                        type="email"
                                                        required
                                                        value={email}
                                                        onChange={(e) => setEmail(e.target.value)}
                                                        className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary bg-white/50 backdrop-blur-sm sm:text-sm"
                                                        placeholder="ejemplo@correo.com"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Código de 6 dígitos</label>
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
                                                        className="w-full h-12 text-center text-xl font-bold border border-gray-200 rounded-xl focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/30 outline-none bg-white/50"
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-primary hover:bg-brand-primary/90 text-brand-dark font-bold rounded-xl transition-all shadow-lg"
                                        >
                                            {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'Validar código'}
                                        </button>
                                    </motion.div>
                                )}

                                {step === 2 && (
                                    <motion.div 
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        className="space-y-4"
                                    >
                                        <div className="p-3 bg-blue-50 border border-blue-100 text-blue-700 rounded-xl text-sm flex items-center gap-2">
                                            <FontAwesomeIcon icon={faCheck} className="text-blue-500" />
                                            <span>Código validado para <strong>{email}</strong></span>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nueva contraseña</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-primary">
                                                    <FontAwesomeIcon icon={faLock} />
                                                </div>
                                                <input
                                                    type="password"
                                                    autoFocus
                                                    required
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary bg-white/50 backdrop-blur-sm sm:text-sm"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar contraseña</label>
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-brand-primary">
                                                    <FontAwesomeIcon icon={faLock} />
                                                </div>
                                                <input
                                                    type="password"
                                                    required
                                                    value={confirmPassword}
                                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                                    className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/50 focus:border-brand-primary bg-white/50 backdrop-blur-sm sm:text-sm"
                                                    placeholder="••••••••"
                                                />
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-primary hover:bg-brand-primary/90 text-brand-dark font-bold rounded-xl transition-all shadow-lg"
                                        >
                                            {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'Restablecer contraseña'}
                                        </button>
                                    </motion.div>
                                )}
                            </div>

                            <div className="text-center">
                                <Link
                                    to="/login"
                                    className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-brand-primary font-medium transition-colors"
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

export default ResetPassword;
