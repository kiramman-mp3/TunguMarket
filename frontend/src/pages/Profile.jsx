import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHistory, faShieldAlt, faLaptop, faMobileAlt, faTabletAlt, faSignOutAlt, faTimesCircle, faCheckCircle, faClock, faUserCircle } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { getSessions, getLogs, deleteSession } from '../api/user';

const Profile = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sessionsData, logsData] = await Promise.all([getSessions(), getLogs()]);
      setSessions(sessionsData);
      setLogs(logsData);
    } catch (err) {
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleTerminateSession = async (token) => {
    try {
      await deleteSession(token);
      setSessions(sessions.filter(s => s.token !== token));
    } catch (err) {
      setError('Error al cerrar sesión remota');
    }
  };

  const currentToken = localStorage.getItem('tungu_token');

  return (
    <div className="max-w-6xl mx-auto px-4 py-28 min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* User Info Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-8 h-fit lg:col-span-1"
        >
          <div className="text-center mb-10 pb-10 border-b border-gray-100">
            <div className="w-24 h-24 bg-brand-primary/20 rounded-2xl mx-auto flex items-center justify-center mb-6">
              <span className="text-4xl font-bold text-brand-secondary">
                {user?.name?.[0].toUpperCase()}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-brand-secondary">{user?.name}</h2>
            <div className="inline-flex mt-2 items-center px-4 py-1.5 rounded-full bg-brand-primary/10 border border-brand-primary/30 text-brand-secondary text-sm font-bold capitalize">
              {user?.role === 'admin' ? '🛡️ Administrador' : '👤 Cliente'}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-6">Información General</h3>
            
            <div className="flex items-center gap-4 text-gray-600">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-brand-secondary/60">
                <FontAwesomeIcon icon={faUserCircle} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Correo Electrónico</p>
                <p className="font-semibold text-sm text-brand-secondary truncate">{user?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-gray-600">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-brand-secondary/60">
                <FontAwesomeIcon icon={faShieldAlt} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Fecha de Nacimiento</p>
                <p className="font-semibold text-sm text-brand-secondary">
                  {user?.birthDate ? new Date(user.birthDate).toLocaleDateString('es-ES', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  }) : 'No disponible'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-gray-600">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                <FontAwesomeIcon icon={faCheckCircle} />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Estado de cuenta</p>
                <p className="font-semibold text-sm text-green-600">Activa & Verificada</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security & Activity */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Active Sessions */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8"
          >
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-brand-secondary flex items-center gap-3">
                <FontAwesomeIcon icon={faLaptop} className="text-brand-primary" />
                Sesiones Activas
              </h3>
              <span className="bg-brand-light px-3 py-1 rounded-lg text-xs font-bold text-brand-secondary">
                {sessions.length} dispositivos
              </span>
            </div>

            <div className="space-y-4">
              {sessions.map((session) => (
                <div 
                  key={session.id}
                  className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${session.token === currentToken ? 'bg-brand-primary/5 border-brand-primary/30 ring-1 ring-brand-primary/20' : 'bg-gray-50 border-gray-100'}`}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-xl text-brand-secondary">
                      <FontAwesomeIcon icon={session.device_info?.toLowerCase().includes('mobile') ? faMobileAlt : faLaptop} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-brand-secondary">{session.device_info || 'Dispositivo desconocido'}</p>
                        {session.token === currentToken && (
                          <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter">Este dispositivo</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{session.ip_address} • Expira {new Date(session.expires_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {session.token !== currentToken && (
                    <button 
                      onClick={() => handleTerminateSession(session.token)}
                      className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      title="Cerrar sesión"
                    >
                      <FontAwesomeIcon icon={faSignOutAlt} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Login History (Logs) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-8"
          >
            <h3 className="text-xl font-bold text-brand-secondary flex items-center gap-3 mb-8">
              <FontAwesomeIcon icon={faHistory} className="text-brand-primary" />
              Historial de Accesos
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-4 pt-1 text-xs font-bold uppercase tracking-wider text-gray-400">Fecha y Hora</th>
                    <th className="pb-4 pt-1 text-xs font-bold uppercase tracking-wider text-gray-400">Ubicación (IP)</th>
                    <th className="pb-4 pt-1 text-xs font-bold uppercase tracking-wider text-gray-400">Estado</th>
                    <th className="pb-4 pt-1 text-xs font-bold uppercase tracking-wider text-gray-400">Mensaje</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {logs.map((log) => (
                    <tr key={log.id} className="group hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 font-medium text-brand-secondary text-sm">
                        <div className="flex items-center gap-3">
                          <FontAwesomeIcon icon={faClock} className="text-gray-300" />
                          {new Date(log.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="py-4 text-sm text-gray-600 font-mono">{log.ip_address}</td>
                      <td className="py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${log.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          <FontAwesomeIcon icon={log.status === 'success' ? faCheckCircle : faTimesCircle} />
                          {log.status === 'success' ? 'Éxito' : 'Fallo'}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-gray-500 italic">{log.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
