import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUsers, faBan, faUndo, faCheckCircle, faExclamationCircle, faShieldAlt, faEnvelope, faUserShield, faCalendarAlt } from '@fortawesome/free-solid-svg-icons';
import { getAdminUsers, updateUserStatus } from '../api/user';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await getAdminUsers();
      setUsers(data);
    } catch (err) {
      setError(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (userId, currentStatus) => {
    try {
      await updateUserStatus(userId, !currentStatus);
      setUsers(users.map(u => u.id === userId ? { ...u, is_banned: !currentStatus } : u));
    } catch (err) {
      setError(err.message || 'Error al actualizar estado del usuario');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(filter.toLowerCase()) || 
    u.email.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-28 min-h-screen">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-10 text-center lg:text-left"
      >
        <h1 className="text-4xl font-display font-bold text-brand-secondary mb-2">Panel Administrativo</h1>
        <p className="text-gray-500 font-medium">Gestión de usuarios y seguridad de la plataforma TunguMarket.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Stats Column */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card p-6 bg-brand-primary/5 border-brand-primary/20">
            <h3 className="text-sm font-bold text-brand-secondary uppercase tracking-widest mb-4 opacity-60">Resumen</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Total Usuarios</span>
                <span className="font-bold text-brand-secondary">{users.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Baneados</span>
                <span className="font-bold text-red-600">{users.filter(u => u.is_banned).length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-medium">Verificados</span>
                <span className="font-bold text-green-600">{users.filter(u => u.is_verified).length}</span>
              </div>
            </div>
          </div>
          
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-brand-secondary uppercase tracking-widest mb-4 opacity-60">Filtros</h3>
            <input 
              type="text" 
              placeholder="Buscar por nombre o email..." 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="input-field px-4 py-3 text-sm"
            />
          </div>
        </div>

        {/* User Table Column */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3 glass-card p-4 overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-gray-400">Usuario</th>
                  <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-gray-400">Rol</th>
                  <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-gray-400">Estado</th>
                  <th className="px-6 py-5 text-xs font-bold uppercase tracking-wider text-gray-400">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="group hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm ${user.is_banned ? 'bg-red-50 text-red-400' : 'bg-brand-primary/20 text-brand-secondary'}`}>
                          {user.name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className={`font-bold transition-all ${user.is_banned ? 'text-gray-400 line-through' : 'text-brand-secondary'}`}>{user.name}</p>
                          <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                            <FontAwesomeIcon icon={faEnvelope} className="text-[10px]" />
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${user.role_name === 'admin' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'}`}>
                        <FontAwesomeIcon icon={user.role_name === 'admin' ? faUserShield : faUsers} className="text-[10px]" />
                        {user.role_name}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col gap-1.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${user.is_verified ? 'text-green-600' : 'text-amber-500'}`}>
                          <FontAwesomeIcon icon={user.is_verified ? faCheckCircle : faExclamationCircle} />
                          {user.is_verified ? 'Verificado' : 'Pendiente'}
                        </span>
                        {user.is_banned && (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600">
                             <FontAwesomeIcon icon={faBan} /> Baneado
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        {user.role_name !== 'admin' && (
                          <button 
                            onClick={() => handleToggleBan(user.id, user.is_banned)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${user.is_banned ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                          >
                            <FontAwesomeIcon icon={user.is_banned ? faUndo : faBan} />
                            {user.is_banned ? 'Desbanear' : 'Banear'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPanel;
