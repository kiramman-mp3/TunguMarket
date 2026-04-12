import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle, faTimesCircle, faChevronDown, faClock,
  faUser, faMoneyBillWave, faCalendarAlt, faMapPin
} from '@fortawesome/free-solid-svg-icons';
import { getAdminPendingWithdrawals, getAdminAllWithdrawals, approveWithdrawal, rejectWithdrawal, markTransferred } from '../api/withdrawals';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../hooks/useToast';

const AdminWithdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPayment, setExpandedPayment] = useState(null);
  const [viewMode, setViewMode] = useState('pending');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processingId, setProcessingId] = useState(null);
  const [transferDetails, setTransferDetails] = useState({});
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [selectedWithdrawalId, setSelectedWithdrawalId] = useState(null);
  const { message, type, closeToast, success, error: showError } = useToast();

  useEffect(() => {
    fetchWithdrawals();
  }, [viewMode]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      setError('');
      let data;
      if (viewMode === 'pending') {
        data = await getAdminPendingWithdrawals();
      } else {
        data = await getAdminAllWithdrawals();
      }
      
      // Manejar diferentes estructuras de respuesta de la API
      let withdrawalsArray = [];
      if (Array.isArray(data)) {
        withdrawalsArray = data;
      } else if (data?.data && Array.isArray(data.data)) {
        withdrawalsArray = data.data;
      } else if (data?.withdrawals && Array.isArray(data.withdrawals)) {
        withdrawalsArray = data.withdrawals;
      } else if (typeof data === 'object' && data !== null) {
        // Si es un objeto pero no tiene las propiedades esperadas, log para debug
        console.error('Estructura de respuesta inesperada:', data);
        withdrawalsArray = [];
      }
      
      setWithdrawals(withdrawalsArray);
    } catch (err) {
      console.error('Error fetchWithdrawals:', err);
      setError(err.message || 'Error al cargar retiros');
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = (withdrawalId) => {
    setSelectedWithdrawalId(withdrawalId);
    setShowApproveConfirm(true);
  };

  const confirmApprove = async () => {
    if (!selectedWithdrawalId) return;
    try {
      setProcessingId(selectedWithdrawalId);
      await approveWithdrawal(selectedWithdrawalId, 'Aprobado por administrador');
      setWithdrawals(withdrawals.map(w => 
        w.id === selectedWithdrawalId ? { ...w, status: 'aprobado' } : w
      ));
      success('Retiro aprobado');
      setExpandedPayment(null);
      setShowApproveConfirm(false);
      setSelectedWithdrawalId(null);
    } catch (err) {
      showError(err.message || 'Error al aprobar retiro');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = (withdrawalId) => {
    if (!rejectReason.trim()) {
      showError('Ingresa un motivo para rechazar el retiro');
      return;
    }
    setSelectedWithdrawalId(withdrawalId);
    setShowRejectConfirm(true);
  };

  const confirmReject = async () => {
    if (!selectedWithdrawalId) return;
    
    try {
      setProcessingId(selectedWithdrawalId);
      await rejectWithdrawal(selectedWithdrawalId, rejectReason);
      setWithdrawals(withdrawals.map(w => 
        w.id === selectedWithdrawalId ? { ...w, status: 'rechazado' } : w
      ));
      success('Retiro rechazado');
      setRejectingId(null);
      setRejectReason('');
      setShowRejectConfirm(false);
      setSelectedWithdrawalId(null);
      setRejectingId(null);
      setRejectReason('');
      setExpandedPayment(null);
    } catch (err) {
      showError(err.message || 'Error al rechazar retiro');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendiente':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'aprobado':
        return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'transferido':
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
      case 'transferido':
        return faMoneyBillWave;
      case 'rechazado':
        return faTimesCircle;
      default:
        return faClock;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pendiente':
        return 'Pendiente de Aprobación';
      case 'aprobado':
        return 'Aprobado, Esperando Transferencia';
      case 'transferido':
        return 'Transferencia Confirmada';
      case 'rechazado':
        return 'Rechazado';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando retiros...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Toast message={message} type={type} onClose={closeToast} />
      <ConfirmModal
        isOpen={showApproveConfirm}
        title="¿Aprobar retiro?"
        message="Confirma que deseas aprobar este retiro. El dinero será procesado en la próxima transferencia."
        confirmText="Aprobar"
        cancelText="Cancelar"
        onConfirm={confirmApprove}
        onCancel={() => {
          setShowApproveConfirm(false);
          setSelectedWithdrawalId(null);
        }}
      />
      <ConfirmModal
        isOpen={showRejectConfirm}
        title="¿Rechazar retiro?"
        message={`Se rechazará este retiro con el motivo: "${rejectReason}"`}
        confirmText="Rechazar"
        cancelText="Cancelar"
        onConfirm={confirmReject}
        onCancel={() => {
          setShowRejectConfirm(false);
          setSelectedWithdrawalId(null);
        }}
        isDangerous={true}
      />
      {/* View Mode Tabs */}
      <div className="flex gap-3 border-b border-gray-200 pb-4">
        <button
          onClick={() => {
            setViewMode('pending');
            setExpandedPayment(null);
          }}
          className={`px-4 py-2 font-bold text-sm transition-all flex items-center gap-2 ${
            viewMode === 'pending'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FontAwesomeIcon icon={faClock} />
          Pendientes ({withdrawals.length})
        </button>
        <button
          onClick={() => {
            setViewMode('all');
            setExpandedPayment(null);
          }}
          className={`px-4 py-2 font-bold text-sm transition-all flex items-center gap-2 ${
            viewMode === 'all'
              ? 'text-brand-secondary border-b-2 border-brand-secondary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FontAwesomeIcon icon={faMoneyBillWave} />
          Todos ({withdrawals.length})
        </button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100"
        >
          {error}
        </motion.div>
      )}

      {withdrawals.length === 0 ? (
        <div className="text-center py-12">
          <FontAwesomeIcon icon={faMoneyBillWave} className="text-4xl text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">
            {viewMode === 'pending' ? 'No hay retiros pendientes' : 'No hay retiros registrados'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {withdrawals.map((withdrawal) => (
            <motion.div
              key={withdrawal.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-2xl overflow-hidden transition-all ${getStatusColor(withdrawal.status)}`}
            >
              <button
                onClick={() =>
                  setExpandedPayment(expandedPayment === withdrawal.id ? null : withdrawal.id)
                }
                className="w-full p-4 flex items-center justify-between hover:bg-black/5 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div className="w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={getStatusIcon(withdrawal.status)}
                      className="text-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold flex items-center gap-2">
                      <FontAwesomeIcon icon={faUser} className="text-xs opacity-60" />
                      {withdrawal.user_name || 'Usuario'}
                    </div>
                    <div className="text-xs opacity-70 flex items-center gap-2 mt-1">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-xs" />
                      {new Date(withdrawal.created_at).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">${(parseFloat(withdrawal.amount) || 0).toFixed(2)}</div>
                    <div className="text-xs opacity-70">{getStatusLabel(withdrawal.status)}</div>
                  </div>
                </div>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`text-lg transition-transform ${
                    expandedPayment === withdrawal.id ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedPayment === withdrawal.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-current/20 p-4 space-y-4 bg-white/20"
                >
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs opacity-70 uppercase font-bold">Vendedor</p>
                      <p className="font-bold mt-1">{withdrawal.user_name}</p>
                      <p className="text-xs opacity-70 mt-1">{withdrawal.user_email}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-70 uppercase font-bold">Monto Solicitado</p>
                      <p className="font-bold text-lg mt-1">${(parseFloat(withdrawal.amount) || 0).toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-70 uppercase font-bold">Cuenta Bancaria</p>
                      <p className="font-bold mt-1">{withdrawal.banco}</p>
                      <p className="text-xs opacity-70 mt-1 font-mono">
                        {withdrawal.numero_cuenta}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs opacity-70 uppercase font-bold">Titular</p>
                      <p className="font-bold mt-1">{withdrawal.titular}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-70 uppercase font-bold">Cédula</p>
                      <p className="font-bold mt-1 font-mono">{withdrawal.cedula_ruc}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-70 uppercase font-bold">Tipo Cuenta</p>
                      <p className="font-bold mt-1 capitalize">{withdrawal.tipo_cuenta}</p>
                    </div>
                  </div>

                  {withdrawal.notas && (
                    <div className="bg-white/30 p-3 rounded-xl">
                      <p className="text-xs opacity-70 uppercase font-bold">Notas</p>
                      <p className="text-sm mt-1 italic">{withdrawal.notas}</p>
                    </div>
                  )}

                  {withdrawal.status === 'rechazado' && withdrawal.validation_notes && (
                    <div className="bg-red-100/30 p-3 rounded-xl border border-red-200/30">
                      <p className="text-xs opacity-70 uppercase font-bold text-red-700">
                        Motivo Rechazo
                      </p>
                      <p className="text-sm mt-1 italic text-red-700">{withdrawal.validation_notes}</p>
                    </div>
                  )}

                  {withdrawal.status === 'aprobado' && !withdrawal.transfer_number && (
                    <div className="space-y-3 pt-4 border-t border-current/20 bg-green-100/20 p-4 rounded-xl">
                      <div>
                        <label className="text-xs opacity-70 uppercase font-bold block mb-2">
                          Número de Transacción/Operación
                        </label>
                        <input
                          type="text"
                          value={transferDetails[withdrawal.id]?.number || ''}
                          onChange={(e) => setTransferDetails({
                            ...transferDetails,
                            [withdrawal.id]: { ...transferDetails[withdrawal.id], number: e.target.value }
                          })}
                          placeholder="Ej: TRX123456789"
                          className="w-full px-3 py-2 bg-white/50 border border-green-200 rounded-xl text-sm"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          const transferNo = transferDetails[withdrawal.id]?.number;
                          if (!transferNo?.trim()) {
                            showError('Ingresa el número de transacción');
                            return;
                          }
                          try {
                            setProcessingId(withdrawal.id);
                            await markTransferred(withdrawal.id, transferNo);
                            
                            setWithdrawals(withdrawals.map(w => 
                              w.id === withdrawal.id 
                                ? { ...w, status: 'transferido', transfer_number: transferNo }
                                : w
                            ));
                            setTransferDetails({ ...transferDetails, [withdrawal.id]: {} });
                            success('Transferencia marcada como realizada');
                          } catch (err) {
                            showError(err.message || 'Error al marcar transferencia');
                          } finally {
                            setProcessingId(null);
                          }
                        }}
                        disabled={processingId === withdrawal.id}
                        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-xl transition-all"
                      >
                        {processingId === withdrawal.id ? 'Procesando...' : '✓ Transferencia Realizada'}
                      </button>
                    </div>
                  )}

                  {withdrawal.transfer_number && (
                    <div className="bg-green-100/30 p-3 rounded-xl border border-green-200/30">
                      <p className="text-xs opacity-70 uppercase font-bold text-green-700 mb-1">✓ Transferencia Confirmada</p>
                      <p className="text-sm font-mono font-bold text-green-700">{withdrawal.transfer_number}</p>
                    </div>
                  )}

                  {withdrawal.status === 'pendiente' && (
                    <div className="space-y-3 pt-4 border-t border-current/20">
                      <div>
                        <label className="text-xs opacity-70 uppercase font-bold block mb-2">
                          Notas de Validación (Opcional)
                        </label>
                        <textarea
                          value={rejectingId === withdrawal.id ? rejectReason : ''}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Ej: Datos incorrectos, cuenta no validable..."
                          className="w-full px-3 py-2 bg-white/50 border border-current/20 rounded-xl text-sm resize-none"
                          rows="2"
                          disabled={processingId === withdrawal.id}
                        />
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(withdrawal.id)}
                          disabled={processingId === withdrawal.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <FontAwesomeIcon icon={faCheckCircle} />
                          {processingId === withdrawal.id ? 'Procesando...' : 'Aprobar'}
                        </button>
                        <button
                          onClick={() => {
                            if (rejectingId === withdrawal.id) {
                              handleReject(withdrawal.id);
                            } else {
                              setRejectingId(withdrawal.id);
                              setRejectReason('');
                            }
                          }}
                          disabled={processingId === withdrawal.id}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <FontAwesomeIcon icon={faTimesCircle} />
                          {rejectingId === withdrawal.id ? 'Confirmar' : 'Rechazar'}
                        </button>
                        {rejectingId === withdrawal.id && (
                          <button
                            onClick={() => {
                              setRejectingId(null);
                              setRejectReason('');
                            }}
                            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold rounded-xl transition-all"
                          >
                            Cancelar
                          </button>
                        )}
                      </div>
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

export default AdminWithdrawals;
