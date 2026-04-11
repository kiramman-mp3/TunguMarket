import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, 
  faLock, 
  faCamera, 
  faCheck, 
  faSpinner,
  faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';

const EditProfile = () => {
  const { user, login } = useAuth(); // Usamos login para refrescar el estado del usuario si es necesario
  const [name, setName] = useState(user?.name || '');
  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [loading, setLoading] = useState({ profile: false, password: false, avatar: false });
  const [message, setMessage] = useState({ text: '', type: '' });
  const fileInputRef = useRef(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const headers = {
    'Authorization': `Bearer ${localStorage.getItem('tungu_token')}`
  };

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setLoading(prev => ({ ...prev, profile: true }));
    try {
      const res = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      // Actualizar estado global a través de AuthContext
      login(data.user, localStorage.getItem('tungu_token'));
      
      setMessage({ text: 'Nombre actualizado correctamente', type: 'success' });
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      return setMessage({ text: 'Las contraseñas nuevas no coinciden', type: 'error' });
    }
    
    setLoading(prev => ({ ...prev, password: true }));
    try {
      const res = await fetch(`${API_URL}/users/change-password`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          currentPassword: passwords.current, 
          newPassword: passwords.new 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setPasswords({ current: '', new: '', confirm: '' });
      setMessage({ text: 'Contraseña actualizada con éxito', type: 'success' });
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(prev => ({ ...prev, password: false }));
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    setLoading(prev => ({ ...prev, avatar: true }));
    try {
      const res = await fetch(`${API_URL}/users/profile/avatar`, {
        method: 'POST',
        headers, // No Content-Type header for FormData
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Actualizar estado global a través de AuthContext
      login(data.user, localStorage.getItem('tungu_token'));
      
      setMessage({ text: 'Foto de perfil actualizada', type: 'success' });
      // Forzar recarga ligera del componente o notificación al padre si fuera necesario
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setLoading(prev => ({ ...prev, avatar: false }));
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <header>
        <h2 className="text-3xl font-bold text-brand-secondary">Editar Perfil</h2>
        <p className="text-gray-400 mt-2 font-medium">Gestiona tu identidad y seguridad de acceso.</p>
      </header>

      {message.text && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center gap-3 font-bold border ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-600 border-green-100' 
              : 'bg-red-50 text-red-600 border-red-100'
          }`}
        >
          <FontAwesomeIcon icon={message.type === 'success' ? faCheck : faExclamationCircle} />
          {message.text}
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Avatar Section */}
        <div className="md:col-span-1">
          <div className="glass-card p-8 flex flex-col items-center text-center">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
              <div className="w-40 h-40 rounded-[2.5rem] overflow-hidden bg-brand-primary/10 border-4 border-white shadow-xl flex items-center justify-center text-brand-secondary">
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <FontAwesomeIcon icon={faUser} className="text-5xl" />
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xl backdrop-blur-[2px]">
                {loading.avatar ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCamera} />}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarChange} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            <h4 className="mt-6 font-bold text-brand-secondary">Foto de Perfil</h4>
            <p className="text-xs text-gray-400 mt-2">Recomendado: Cuadrada, máx 5MB</p>
          </div>
        </div>

        {/* Personal Info & Password */}
        <div className="md:col-span-2 space-y-8">
          {/* Name Update */}
          <section className="glass-card p-8">
            <h3 className="text-xl font-bold text-brand-secondary mb-6 flex items-center gap-3">
              <FontAwesomeIcon icon={faUser} className="text-brand-primary" />
              Información Personal
            </h3>
            <form onSubmit={handleUpdateName} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Nombre Completo</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-brand-primary outline-none font-bold text-brand-secondary transition-all"
                  required
                />
              </div>
              <button 
                disabled={loading.profile}
                className="btn-primary w-full md:w-fit px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 group"
              >
                {loading.profile ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faCheck} className="group-hover:scale-110 transition-transform" />}
                Guardar Cambios
              </button>
            </form>
          </section>

          {/* Password Update */}
          <section className="glass-card p-8">
            <h3 className="text-xl font-bold text-brand-secondary mb-6 flex items-center gap-3">
              <FontAwesomeIcon icon={faLock} className="text-brand-primary" />
              Seguridad de la Cuenta
            </h3>
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-400 mb-2">Contraseña Actual</label>
                <input 
                  type="password" 
                  value={passwords.current}
                  onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                  className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-brand-primary outline-none font-bold text-brand-secondary transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Nueva Contraseña</label>
                  <input 
                    type="password" 
                    value={passwords.new}
                    onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-brand-primary outline-none font-bold text-brand-secondary transition-all"
                    placeholder="Mín. 6 caracteres"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 mb-2">Confirmar Nueva</label>
                  <input 
                    type="password" 
                    value={passwords.confirm}
                    onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 focus:ring-2 focus:ring-brand-primary outline-none font-bold text-brand-secondary transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
              <button 
                disabled={loading.password}
                className="bg-brand-secondary text-white w-full md:w-fit px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-opacity-90 transition-all shadow-lg shadow-brand-secondary/20"
              >
                {loading.password ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faLock} />}
                Actualizar Contraseña
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
};

export default EditProfile;
