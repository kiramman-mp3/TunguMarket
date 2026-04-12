import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyBillWave, faClock, faCheckCircle, faTimesCircle, faEye, faWallet
} from '@fortawesome/free-solid-svg-icons';
import { getMyWithdrawals } from '../../api/withdrawals';
import { useAuth } from '../../context/AuthContext';

const SellerWithdrawals = ({ onNavigateTo }) => {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getMyWithdrawals();
      
      // Manejar diferentes estructuras de respuesta
      let withdrawalsArray = [];
      if (Array.isArray(response)) {
        withdrawalsArray = response;
      } else if (response?.data && Array.isArray(response.data)) {
        withdrawalsArray = response.data;
      } else if (response?.withdrawals && Array.isArray(response.withdrawals)) {
        withdrawalsArray = response.withdrawals;
      }
      
      setWithdrawals(withdrawalsArray);
    } catch (err) {
      console.error('Error fetchData:', err);
      setError(err.message || 'Error al cargar retiros');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch(status?.toLowerCase()) {
      case 'pendiente': return faClock;
      case 'aprobado': return faCheckCircle;
      case 'rechazado': return faTimesCircle;
      default: return faMoneyBillWave;
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'pendiente': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'aprobado': return 'bg-green-100 text-green-800 border-green-300';
      case 'rechazado': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusLabel = (status) => {
    switch(status?.toLowerCase()) {
      case 'pendiente': return 'Pendiente';
      case 'aprobado': return 'Aprobado';
      case 'rechazado': return 'Rechazado';
      default: return status;
    }
  };

  const filteredWithdrawals = withdrawals.filter(w => {
    if (statusFilter === 'all') return true;
    return w.status?.toLowerCase() === statusFilter.toLowerCase();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-3xl font-bold text-brand-secondary flex items-center gap-3">
          <FontAwesomeIcon icon={faMoneyBillWave} />
          Mis Retiros
        </h2>
        <p className="text-gray-400 mt-2 font-medium">Historial de tus solicitudes de retiro</p>
      </header>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl font-bold"
        >
          {error}
        </motion.div>
      )}

      {/* Action Button */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        onClick={() => onNavigateTo?.('wallet')}
        className="w-full md:w-auto px-6 py-3 bg-brand-secondary text-white font-bold rounded-xl hover:opacity-90 transition-all shadow-lg flex items-center gap-2 justify-center md:justify-start"
      >
        <FontAwesomeIcon icon={faWallet} />
        Hacer un Nuevo Retiro
      </motion.button>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'Pendiente', 'Aprobado', 'Rechazado'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
              statusFilter === status
                ? 'bg-brand-secondary text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'Todos' : status}
          </button>
        ))}
      </div>

      {/* Withdrawals List */}
      {filteredWithdrawals.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-12 text-center"
        >
          <FontAwesomeIcon icon={faMoneyBillWave} className="text-4xl text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium mb-4">
            {withdrawals.length === 0 
              ? 'No tienes retiros registrados' 
              : 'No hay retiros con este estado'}
          </p>
          <button
            onClick={() => onNavigateTo?.('wallet')}
            className="px-4 py-2 bg-brand-primary text-brand-secondary font-bold rounded-xl hover:opacity-90"
          >
            Crear Retiro
          </button>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredWithdrawals.map((withdrawal) => (
            <motion.div
              key={withdrawal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
              className="glass-card p-5 border border-gray-200 hover:border-brand-secondary/50 transition-all cursor-pointer"
              onClick={() => setSelectedWithdrawal(withdrawal)}
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                  <div className="w-12 h-12 rounded-xl bg-brand-secondary/10 flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon 
                      icon={getStatusIcon(withdrawal.status)} 
                      className="text-brand-secondary text-lg"
                    />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900">${(parseFloat(withdrawal.amount) || 0).toFixed(2)}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(withdrawal.created_at).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(withdrawal.status)}`}>
                    {getStatusLabel(withdrawal.status)}
                  </span>
                  <FontAwesomeIcon 
                    icon={faEye} 
                    className="text-gray-400 text-lg"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedWithdrawal && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedWithdrawal(null)}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold text-brand-secondary mb-6 flex items-center gap-2">
              <FontAwesomeIcon icon={getStatusIcon(selectedWithdrawal.status)} />
              Detalles del Retiro
            </h3>
            
            <div className="space-y-5">
              <div className="bg-gray-50 p-4 rounded-xl">
                <p className="text-xs uppercase text-gray-400 font-bold mb-1">Monto</p>
                <p className="text-3xl font-bold text-brand-secondary">${(parseFloat(selectedWithdrawal.amount) || 0).toFixed(2)}</p>
              </div>

              <div>
                <p className="text-xs uppercase text-gray-400 font-bold mb-2">Estado</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(selectedWithdrawal.status)}`}>
                  {getStatusLabel(selectedWithdrawal.status)}
                </span>
              </div>

              <div>
                <p className="text-xs uppercase text-gray-400 font-bold mb-1">Fecha de Solicitud</p>
                <p className="text-gray-700 text-sm">{new Date(selectedWithdrawal.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>

              {selectedWithdrawal.status?.toLowerCase() === 'rechazado' && selectedWithdrawal.validation_notes && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-xs uppercase text-red-400 font-bold mb-1">Razón del Rechazo</p>
                  <p className="text-red-700 text-sm">{selectedWithdrawal.validation_notes}</p>
                </div>
              )}

              {selectedWithdrawal.status?.toLowerCase() === 'pendiente' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <p className="text-amber-700 text-sm font-medium">
                    Tu solicitud está siendo procesada. Por favor espera a que sea aprobada.
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedWithdrawal(null)}
              className="w-full mt-8 py-3 bg-brand-secondary text-white font-bold rounded-xl hover:opacity-90 transition-all"
            >
              Cerrar
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default SellerWithdrawals;
