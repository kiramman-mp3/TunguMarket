import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle, faTimesCircle, faChevronDown, faClock,
  faUser, faFileImage, faCalendarAlt, faEye, faCheck, faTimes
} from '@fortawesome/free-solid-svg-icons';

const AdminPaymentVerification = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPayment, setExpandedPayment] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [previewImage, setPreviewImage] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(
        `http://localhost:5000/api/admin/payment-verifications?status=${statusFilter}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('tungu_token')}`
          }
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al cargar pagos');
      
      let paymentsArray = [];
      if (Array.isArray(data)) {
        paymentsArray = data;
      } else if (data?.data && Array.isArray(data.data)) {
        paymentsArray = data.data;
      } else if (data?.payments && Array.isArray(data.payments)) {
        paymentsArray = data.payments;
      }
      
      setPayments(paymentsArray);
    } catch (err) {
      console.error('Error fetchPayments:', err);
      setError(err.message || 'Error al cargar pagos');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = async (paymentId, orderId) => {
    if (!window.confirm('¿Confirmar que el pago es válido?')) return;
    
    try {
      setProcessingId(paymentId);
      const response = await fetch(
        `http://localhost:5000/api/admin/payment-verifications/${paymentId}/approve`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('tungu_token')}`
          },
          body: JSON.stringify({ 
            order_id: orderId,
            notes: 'Comprobante verificado por administrador'
          })
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al aprobar pago');
      
      setPayments(payments.map(p => 
        p.id === paymentId ? { ...p, status: 'approved' } : p
      ));
      alert('✓ Pago aprobado - Orden confirmada');
      setExpandedPayment(null);
    } catch (err) {
      setError(err.message || 'Error al aprobar pago');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectPayment = async (paymentId, reason) => {
    if (!reason?.trim()) {
      alert('Ingresa un motivo para rechazar el pago');
      return;
    }
    
    if (!window.confirm('¿Confirmar rechazo del pago?')) return;
    
    try {
      setProcessingId(paymentId);
      const response = await fetch(
        `http://localhost:5000/api/admin/payment-verifications/${paymentId}/reject`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('tungu_token')}`
          },
          body: JSON.stringify({ rejection_reason: reason })
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al rechazar pago');
      
      setPayments(payments.map(p => 
        p.id === paymentId ? { ...p, status: 'rejected' } : p
      ));
      alert('✗ Pago rechazado - Cliente deberá realizar nueva transferencia');
      setExpandedPayment(null);
    } catch (err) {
      setError(err.message || 'Error al rechazar pago');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'approved':
        return 'bg-green-50 border-green-200 text-green-700';
      case 'rejected':
        return 'bg-red-50 border-red-200 text-red-700';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-700';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return faClock;
      case 'approved':
        return faCheckCircle;
      case 'rejected':
        return faTimesCircle;
      default:
        return faClock;
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'approved':
        return 'Aprobado';
      case 'rejected':
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
          <p className="text-gray-600 font-medium">Cargando comprobantes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Filter */}
      <div className="flex gap-3 border-b border-gray-200 pb-4 flex-wrap">
        <button
          onClick={() => setStatusFilter('pending')}
          className={`px-4 py-2 text-sm font-bold transition-all flex items-center gap-2 ${
            statusFilter === 'pending'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FontAwesomeIcon icon={faClock} />
          Pendientes ({payments.length})
        </button>
        <button
          onClick={() => setStatusFilter('approved')}
          className={`px-4 py-2 text-sm font-bold transition-all flex items-center gap-2 ${
            statusFilter === 'approved'
              ? 'text-green-600 border-b-2 border-green-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FontAwesomeIcon icon={faCheckCircle} />
          Aprobados
        </button>
        <button
          onClick={() => setStatusFilter('rejected')}
          className={`px-4 py-2 text-sm font-bold transition-all flex items-center gap-2 ${
            statusFilter === 'rejected'
              ? 'text-red-600 border-b-2 border-red-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FontAwesomeIcon icon={faTimesCircle} />
          Rechazados
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

      {payments.length === 0 ? (
        <div className="text-center py-12">
          <FontAwesomeIcon icon={faFileImage} className="text-4xl text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">
            {statusFilter === 'pending' ? 'No hay comprobantes pendientes' : 'No hay comprobantes en este estado'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((payment) => (
            <motion.div
              key={payment.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-2xl overflow-hidden transition-all ${getStatusColor(payment.status)}`}
            >
              <button
                onClick={() =>
                  setExpandedPayment(expandedPayment === payment.id ? null : payment.id)
                }
                className="w-full p-4 flex items-center justify-between hover:bg-black/5 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 text-left">
                  <div className="w-10 h-10 rounded-xl bg-white/30 flex items-center justify-center">
                    <FontAwesomeIcon
                      icon={getStatusIcon(payment.status)}
                      className="text-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold flex items-center gap-2">
                      <FontAwesomeIcon icon={faUser} className="text-xs opacity-60" />
                      {payment.customer_name || 'Cliente'}
                    </div>
                    <div className="text-xs opacity-70 flex items-center gap-2 mt-1">
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-xs" />
                      {new Date(payment.created_at).toLocaleDateString('es-ES')}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">${payment.amount?.toFixed(2) || '0.00'}</div>
                    <div className="text-xs opacity-70">Orden #{payment.order_id}</div>
                  </div>
                </div>
                <FontAwesomeIcon
                  icon={faChevronDown}
                  className={`text-lg transition-transform ${
                    expandedPayment === payment.id ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedPayment === payment.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-current/20 p-4 space-y-4 bg-white/20"
                >
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs opacity-70 uppercase font-bold">Cliente</p>
                      <p className="font-bold mt-1">{payment.customer_name}</p>
                      <p className="text-xs opacity-70 mt-1">{payment.customer_email}</p>
                    </div>
                    <div>
                      <p className="text-xs opacity-70 uppercase font-bold">Monto</p>
                      <p className="font-bold text-lg mt-1">${payment.amount?.toFixed(2)}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs opacity-70 uppercase font-bold">Referencia Transacción</p>
                      <p className="font-mono font-bold mt-1">{payment.transaction_ref || 'No especificado'}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs opacity-70 uppercase font-bold">Método de Pago</p>
                      <p className="font-bold mt-1">Transferencia Bancaria</p>
                    </div>
                  </div>

                  {/* Payment Proof Image */}
                  {payment.proof_image && (
                    <div className="space-y-2">
                      <p className="text-xs opacity-70 uppercase font-bold flex items-center gap-2">
                        <FontAwesomeIcon icon={faFileImage} />
                        Comprobante Subido
                      </p>
                      <div className="relative bg-gray-100 rounded-xl overflow-hidden">
                        <img
                          src={payment.proof_image}
                          alt="Comprobante"
                          className="w-full h-64 object-cover cursor-pointer hover:opacity-75 transition-opacity"
                          onClick={() => setPreviewImage(payment.proof_image)}
                        />
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                          <FontAwesomeIcon icon={faEye} className="text-white text-2xl opacity-0 hover:opacity-100" />
                        </div>
                      </div>
                    </div>
                  )}

                  {payment.notes && (
                    <div className="bg-white/30 p-3 rounded-xl">
                      <p className="text-xs opacity-70 uppercase font-bold">Notas del Cliente</p>
                      <p className="text-sm mt-1 italic">{payment.notes}</p>
                    </div>
                  )}

                  {payment.status === 'pending' && (
                    <div className="space-y-3 pt-4 border-t border-current/20">
                      <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-200/30">
                        <p className="text-xs font-bold text-blue-700 mb-2">
                          ¿Es válido el comprobante? Verifica el número de referencia y el monto.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprovePayment(payment.id, payment.order_id)}
                          disabled={processingId === payment.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <FontAwesomeIcon icon={faCheck} />
                          {processingId === payment.id ? 'Procesando...' : 'Aprobar Pago'}
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('¿Por qué rechazar este pago?');
                            if (reason) handleRejectPayment(payment.id, reason);
                          }}
                          disabled={processingId === payment.id}
                          className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                          {processingId === payment.id ? 'Procesando...' : 'Rechazar'}
                        </button>
                      </div>
                    </div>
                  )}

                  {payment.status === 'rejected' && payment.rejection_reason && (
                    <div className="bg-red-100/30 p-3 rounded-xl border border-red-200/30">
                      <p className="text-xs opacity-70 uppercase font-bold text-red-700 mb-1">Motivo Rechazo</p>
                      <p className="text-sm italic text-red-700">{payment.rejection_reason}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
          onClick={() => setPreviewImage(null)}
        >
          <motion.img
            src={previewImage}
            alt="Vista completa"
            className="max-w-2xl max-h-[90vh] object-contain rounded-2xl cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          />
        </motion.div>
      )}
    </div>
  );
};

export default AdminPaymentVerification;
