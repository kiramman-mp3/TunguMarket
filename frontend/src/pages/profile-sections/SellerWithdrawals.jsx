import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMoneyBillWave, faClock, faCheckCircle, faTimesCircle, faChevronDown,
  faWallet, faCalendarAlt, faFilter
} from '@fortawesome/free-solid-svg-icons';
import {
  getMyWithdrawals,
  createWithdrawal
} from '../../api/withdrawals';
import { getMyBankAccounts } from '../../api/sellerBankAccounts';
import { useAuth } from '../../context/AuthContext';

const SellerWithdrawals = () => {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [walletBalance, setWalletBalance] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    monto: '',
    bankAccountId: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      const [withdrawalsData, accountsData] = await Promise.all([
        getMyWithdrawals(),
        getMyBankAccounts()
      ]);
      
      // Manejar diferentes estructuras de respuesta
      let withdrawalsArray = [];
      if (Array.isArray(withdrawalsData)) {
        withdrawalsArray = withdrawalsData;
      } else if (withdrawalsData?.data && Array.isArray(withdrawalsData.data)) {
        withdrawalsArray = withdrawalsData.data;
      } else if (withdrawalsData?.withdrawals && Array.isArray(withdrawalsData.withdrawals)) {
        withdrawalsArray = withdrawalsData.withdrawals;
      }
      
      let accountsArray = [];
      if (Array.isArray(accountsData)) {
        accountsArray = accountsData;
      } else if (accountsData?.data && Array.isArray(accountsData.data)) {
        accountsArray = accountsData.data;
      } else if (accountsData?.accounts && Array.isArray(accountsData.accounts)) {
        accountsArray = accountsData.accounts;
      }
      
      setWithdrawals(withdrawalsArray);
      setBankAccounts(accountsArray);
      
      // Calculate wallet balance (in real app, this would come from API)
      const totalEarnings = localStorage.getItem(`user_${user?.id}_earnings`) || '0';
      setWalletBalance(parseFloat(totalEarnings));
    } catch (err) {
      console.error('Error fetchData:', err);
      setError(err.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAmount = (amount) => {
    setFormData({
      ...formData,
      monto: amount.toString()
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const amount = parseFloat(formData.monto);
    if (isNaN(amount) || amount <= 0) {
      alert('Ingresa un monto válido');
      return;
    }

    if (amount < 5) {
      alert('El monto mínimo es $5');
      return;
    }

    if (amount > walletBalance) {
      alert('Saldo insuficiente en tu billetera');
      return;
    }

    if (!formData.bankAccountId) {
      alert('Selecciona una cuenta bancaria');
      return;
    }

    try {
      setSubmitting(true);
      await createWithdrawal(amount, formData.bankAccountId);
      alert('Solicitud de retiro creada exitosamente');
      fetchData();
      setFormData({ monto: '', bankAccountId: '' });
      setShowForm(false);
    } catch (err) {
      setError(err.message || 'Error al crear solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredWithdrawals = statusFilter === 'all'
    ? withdrawals
    : withdrawals.filter(w => w.estado === statusFilter);

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendiente':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'aprobado':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'rechazado':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pendiente':
        return faClock;
      case 'aprobado':
        return faCheckCircle;
      case 'rechazado':
        return faTimesCircle;
      default:
        return faClock;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pendiente':
        return 'Pendiente';
      case 'aprobado':
        return 'Aprobado';
      case 'rechazado':
        return 'Rechazado';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100"
        >
          {error}
        </motion.div>
      )}

      {/* Balance Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6 bg-gradient-to-br from-brand-primary/10 to-brand-secondary/10 border border-brand-secondary/20"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 font-medium mb-1">Saldo Disponible</p>
            <h3 className="text-4xl font-bold text-brand-secondary">${walletBalance.toFixed(2)}</h3>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-brand-secondary/20 flex items-center justify-center">
            <FontAwesomeIcon icon={faWallet} className="text-3xl text-brand-secondary" />
          </div>
        </div>
      </motion.div>

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-brand-secondary">Mi Historial de Retiros</h3>
        {!showForm && bankAccounts.length > 0 && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-brand-secondary text-white px-4 py-2 rounded-xl font-bold hover:opacity-90 transition-all"
          >
            <FontAwesomeIcon icon={faMoneyBillWave} />
            Solicitar Retiro
          </button>
        )}
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-6 space-y-4 bg-brand-primary/5 border-brand-primary/20"
          >
            <h4 className="font-bold text-brand-secondary">Nueva Solicitud de Retiro</h4>

            {bankAccounts.length === 0 ? (
              <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm font-bold border border-amber-100">
                Primero debes registrar una cuenta bancaria para solicitar retiros.
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Cuenta Bancaria
                  </label>
                  <select
                    value={formData.bankAccountId}
                    onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="">Selecciona una cuenta...</option>
                    {bankAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.banco} - {acc.numero_cuenta} ({acc.tipo_cuenta})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Monto Solicitado
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-600 font-bold">$</span>
                    <input
                      type="number"
                      value={formData.monto}
                      onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                      placeholder="Ej: 50.00"
                      min="5"
                      step="0.01"
                      className="input-field w-full pl-8"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Mínimo: $5 | Disponible: ${walletBalance.toFixed(2)}</p>
                </div>

                {/* Quick Action Buttons */}
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">O selecciona un monto rápido</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[5, 25, 50, 100].map((amount) => (
                      <button
                        key={amount}
                        type="button"
                        onClick={() => handleQuickAmount(amount)}
                        disabled={amount > walletBalance}
                        className={`py-2 px-3 rounded-xl text-sm font-bold transition-all ${
                          formData.monto === amount.toString()
                            ? 'bg-brand-secondary text-white'
                            : amount > walletBalance
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-brand-secondary text-white font-bold py-2 px-4 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {submitting ? 'Procesando...' : 'Solicitar Retiro'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setFormData({ monto: '', bankAccountId: '' });
                    }}
                    className="flex-1 bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl hover:bg-gray-300 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Filter */}
      {withdrawals.length > 0 && (
        <div className="flex gap-2 border-b border-gray-200 pb-4 flex-wrap">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 text-sm font-bold transition-all flex items-center gap-2 ${
              statusFilter === 'all'
                ? 'text-brand-secondary border-b-2 border-brand-secondary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FontAwesomeIcon icon={faMoneyBillWave} />
            Todos ({withdrawals.length})
          </button>
          <button
            onClick={() => setStatusFilter('pendiente')}
            className={`px-4 py-2 text-sm font-bold transition-all flex items-center gap-2 ${
              statusFilter === 'pendiente'
                ? 'text-amber-600 border-b-2 border-amber-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FontAwesomeIcon icon={faClock} />
            Pendientes ({withdrawals.filter(w => w.estado === 'pendiente').length})
          </button>
          <button
            onClick={() => setStatusFilter('aprobado')}
            className={`px-4 py-2 text-sm font-bold transition-all flex items-center gap-2 ${
              statusFilter === 'aprobado'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FontAwesomeIcon icon={faCheckCircle} />
            Aprobados ({withdrawals.filter(w => w.estado === 'aprobado').length})
          </button>
          <button
            onClick={() => setStatusFilter('rechazado')}
            className={`px-4 py-2 text-sm font-bold transition-all flex items-center gap-2 ${
              statusFilter === 'rechazado'
                ? 'text-red-600 border-b-2 border-red-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FontAwesomeIcon icon={faTimesCircle} />
            Rechazados ({withdrawals.filter(w => w.estado === 'rechazado').length})
          </button>
        </div>
      )}

      {/* Withdrawals List */}
      {filteredWithdrawals.length === 0 ? (
        <div className="text-center py-12 glass-card">
          <FontAwesomeIcon icon={faMoneyBillWave} className="text-4xl text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">
            {withdrawals.length === 0 ? 'No tienes solicitudes de retiro' : 'No hay retiros con este estado'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredWithdrawals.map((withdrawal) => (
            <motion.div
              key={withdrawal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-2xl overflow-hidden transition-all cursor-pointer ${getStatusColor(withdrawal.estado)}`}
            >
              <button
                onClick={() => setExpandedId(expandedId === withdrawal.id ? null : withdrawal.id)}
                className="w-full p-4 flex items-center justify-between hover:bg-black/5 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div className="w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center">
                    <FontAwesomeIcon icon={getStatusIcon(withdrawal.estado)} className="text-lg" />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold">${withdrawal.monto.toFixed(2)}</div>
                    <div className="text-xs opacity-70 flex items-center gap-2 mt-1">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-xs" />
                      {new Date(withdrawal.created_at).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                  <div className="text-right text-sm font-bold">{getStatusLabel(withdrawal.estado)}</div>
                </div>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`text-lg transition-transform ${expandedId === withdrawal.id ? 'rotate-180' : ''}`}
                />
              </button>

              {expandedId === withdrawal.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-current/20 p-4 space-y-3 bg-white/20"
                >
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs opacity-70 uppercase font-bold">Banco</p>
                      <p className="font-bold mt-1">{withdrawal.banco}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-70 uppercase font-bold">Tipo Cuenta</p>
                      <p className="font-bold mt-1 capitalize">{withdrawal.tipo_cuenta}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs opacity-70 uppercase font-bold">Cuenta</p>
                      <p className="font-mono font-bold mt-1">{withdrawal.numero_cuenta}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs opacity-70 uppercase font-bold">Titular</p>
                      <p className="font-bold mt-1">{withdrawal.titular_cuenta}</p>
                    </div>
                  </div>

                  {withdrawal.motivo_rechazo && (
                    <div className="bg-red-100/30 p-3 rounded-xl border border-red-200/30">
                      <p className="text-xs opacity-70 uppercase font-bold text-red-700 mb-1">Motivo Rechazo</p>
                      <p className="text-sm italic text-red-700">{withdrawal.motivo_rechazo}</p>
                    </div>
                  )}

                  {withdrawal.notas && (
                    <div className="bg-white/30 p-3 rounded-xl">
                      <p className="text-xs opacity-70 uppercase font-bold mb-1">Notas</p>
                      <p className="text-sm italic">{withdrawal.notas}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerWithdrawals;
