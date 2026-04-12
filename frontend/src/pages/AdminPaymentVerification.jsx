import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCheckCircle, faTimesCircle, faChevronDown, faClock,
  faUser, faFileImage, faCalendarAlt, faEye, faCheck, faTimes,
  faMagnifyingGlassPlus, faMagnifyingGlassMinus, faArrowRotateRight
} from '@fortawesome/free-solid-svg-icons';
import Toast from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../hooks/useToast';

const AdminPaymentVerification = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedPayment, setExpandedPayment] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pendiente');
  const [previewImage, setPreviewImage] = useState(null);
  const [imageZoom, setImageZoom] = useState(1);
  const [imagePan, setImagePan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [processingId, setProcessingId] = useState(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const { message, type, closeToast, success, error: showError } = useToast();

  useEffect(() => {
    const token = localStorage.getItem('tungu_token');
    if (token) {
      fetchPayments();
    } else {
      setError('No autenticado. Por favor, vuelve a iniciar sesión.');
      setLoading(false);
    }
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(
        `http://localhost:5000/api/orders/admin/payments/pending`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('tungu_token')}`
          }
        }
      );
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.error || `Error al cargar pagos (${response.status})`);
      
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
      console.error('Error loadingpayments:', err);
      setError(err.message || 'Error al cargar comprobantes de pago');
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleApprovePayment = (paymentId) => {
    setSelectedPaymentId(paymentId);
    setShowApproveConfirm(true);
  };

  const confirmApprovePayment = async () => {
    if (!selectedPaymentId) return;
    
    try {
      setProcessingId(selectedPaymentId);
      const response = await fetch(
        `http://localhost:5000/api/orders/admin/payments/${selectedPaymentId}/approve`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('tungu_token')}`
          },
          body: JSON.stringify({ notes: 'Comprobante verificado por administrador' })
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al aprobar pago');
      
      setPayments(payments.map(p => 
        p.id === selectedPaymentId ? { ...p, status: 'aprobado' } : p
      ));
      success('Pago aprobado - Orden confirmada');
      setExpandedPayment(null);
      setShowApproveConfirm(false);
      setSelectedPaymentId(null);
    } catch (err) {
      showError(err.message || 'Error al aprobar pago');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectPayment = (paymentId) => {
    if (!rejectReason?.trim()) {
      showError('Ingresa un motivo para rechazar el pago');
      return;
    }
    setSelectedPaymentId(paymentId);
    setShowRejectConfirm(true);
  };

  const confirmRejectPayment = async () => {
    if (!selectedPaymentId) return;
    
    try {
      setProcessingId(selectedPaymentId);
      const response = await fetch(
        `http://localhost:5000/api/orders/admin/payments/${selectedPaymentId}/reject`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('tungu_token')}`
          },
          body: JSON.stringify({ rejection_reason: rejectReason })
        }
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al rechazar pago');
      
      setPayments(payments.map(p => 
        p.id === selectedPaymentId ? { ...p, status: 'rechazado' } : p
      ));
      success('Pago rechazado - Cliente deberá realizar nueva transferencia');
      setExpandedPayment(null);
      setRejectReason('');
      setShowRejectConfirm(false);
      setSelectedPaymentId(null);
    } catch (err) {
      showError(err.message || 'Error al rechazar pago');
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pendiente':
        return 'bg-amber-50 border-l-4 border-amber-400 text-amber-900';
      case 'aprobado':
        return 'bg-green-50 border-l-4 border-green-400 text-green-900';
      case 'rechazado':
        return 'bg-red-50 border-l-4 border-red-400 text-red-900';
      default:
        return 'bg-gray-50 border-l-4 border-gray-400 text-gray-900';
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

  const handleImageZoom = (direction) => {
    const zoomStep = 0.2;
    let newZoom = imageZoom + (direction === 'in' ? zoomStep : -zoomStep);
    newZoom = Math.max(1, Math.min(3, newZoom)); // Entre 1x y 3x
    setImageZoom(newZoom);
  };

  const handleImageWheel = (e) => {
    const zoomStep = 0.1;
    let newZoom = imageZoom + (e.deltaY > 0 ? -zoomStep : zoomStep);
    newZoom = Math.max(1, Math.min(3, newZoom));
    setImageZoom(newZoom);
  };

  const handleMouseDown = (e) => {
    if (imageZoom > 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - imagePan.x, y: e.clientY - imagePan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning && imageZoom > 1) {
      setImagePan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const resetZoom = () => {
    setImageZoom(1);
    setImagePan({ x: 0, y: 0 });
  };

  const closePreview = () => {
    setPreviewImage(null);
    resetZoom();
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
      <Toast message={message} type={type} onClose={closeToast} />
      <ConfirmModal
        isOpen={showApproveConfirm}
        title="¿Aprobar pago?"
        message="Confirma que este comprobante de pago es válido. Se confirmará la orden del cliente."
        confirmText="Aprobar"
        cancelText="Cancelar"
        onConfirm={confirmApprovePayment}
        onCancel={() => {
          setShowApproveConfirm(false);
          setSelectedPaymentId(null);
        }}
      />
      <ConfirmModal
        isOpen={showRejectConfirm}
        title="¿Rechazar pago?"
        message={`Se rechazará el pago con el motivo: "${rejectReason}". El cliente deberá realizar una nueva transferencia.`}
        confirmText="Rechazar"
        cancelText="Cancelar"
        onConfirm={confirmRejectPayment}
        onCancel={() => {
          setShowRejectConfirm(false);
          setSelectedPaymentId(null);
        }}
        isDangerous={true}
      />
      {/* Status Filter */}
      <div className="flex gap-3 border-b border-gray-200 pb-4 flex-wrap">
        <button
          onClick={() => setStatusFilter('pendiente')}
          className={`px-4 py-2 text-sm font-bold transition-all flex items-center gap-2 ${
            statusFilter === 'pendiente'
              ? 'text-amber-600 border-b-2 border-amber-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <FontAwesomeIcon icon={faClock} />
          Pendientes ({payments.filter(p => p.status === 'pendiente').length})
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
          Aprobados ({payments.filter(p => p.status === 'aprobado').length})
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
          Rechazados ({payments.filter(p => p.status === 'rechazado').length})
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
            {statusFilter === 'pendiente' ? 'No hay comprobantes pendientes de verificación' : 'No hay comprobantes en este estado'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.filter(p => p.status === statusFilter).map((payment) => (
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
                    <div className="font-bold text-lg">${(parseFloat(payment.amount) || 0).toFixed(2)}</div>
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
                      <p className="font-bold text-lg mt-1">${(parseFloat(payment.amount) || 0).toFixed(2)}</p>
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
                  {payment.receipt_url && (
                    <div className="space-y-2">
                      <p className="text-xs opacity-70 uppercase font-bold flex items-center gap-2">
                        <FontAwesomeIcon icon={faFileImage} />
                        Comprobante Subido
                      </p>
                      <div 
                        className="relative bg-gray-100 rounded-xl overflow-hidden cursor-pointer group"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewImage(payment.receipt_url);
                          resetZoom();
                        }}
                      >
                        <img
                          src={payment.receipt_url}
                          alt="Comprobante"
                          className="w-full h-64 object-cover group-hover:opacity-75 transition-opacity"
                          draggable={false}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <div className="text-center">
                            <FontAwesomeIcon icon={faEye} className="text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity mb-2" />
                            <p className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                              Ampliar
                            </p>
                          </div>
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

                  {payment.status === 'pendiente' && (
                    <div className="space-y-3 pt-4 border-t border-current/20">
                      <div className="bg-blue-50/30 p-3 rounded-xl border border-blue-200/30">
                        <p className="text-xs font-bold text-blue-700 mb-2">
                          ¿Es válido el comprobante? Verifica el número de referencia y el monto.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprovePayment(payment.id)}
                          disabled={processingId === payment.id}
                          className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          <FontAwesomeIcon icon={faCheck} />
                          {processingId === payment.id ? 'Procesando...' : 'Aprobar Pago'}
                        </button>
                        {expandedPayment === payment.id && (
                          <div className="flex gap-2 items-end">
                            <input
                              type="text"
                              placeholder="Motivo del rechazo"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              className="flex-1 px-3 py-2 bg-white/50 border border-red-200 rounded-xl text-sm"
                            />
                            <button
                              onClick={() => handleRejectPayment(payment.id)}
                              disabled={processingId === payment.id}
                              className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-xl transition-all flex items-center gap-2"
                            >
                              <FontAwesomeIcon icon={faTimes} />
                              {processingId === payment.id ? 'Procesando...' : 'Rechazar'}
                            </button>
                          </div>
                        )}
                        {expandedPayment !== payment.id && (
                          <button
                            onClick={() => handleRejectPayment(payment.id)}
                            disabled={processingId === payment.id}
                            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-bold py-2 px-4 rounded-xl transition-all flex items-center justify-center gap-2"
                          >
                            <FontAwesomeIcon icon={faTimes} />
                            {processingId === payment.id ? 'Procesando...' : 'Rechazar'}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {payment.status === 'rechazado' && payment.validation_notes && (
                    <div className="bg-red-50 p-4 rounded-xl border border-red-200">
                      <p className="text-xs opacity-70 uppercase font-bold text-red-700 mb-2">Motivo Rechazo</p>
                      <p className="text-sm italic text-red-700">{payment.validation_notes.replace('Rechazado: ', '')}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Image Preview Modal con Zoom */}
      {previewImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
          onClick={closePreview}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleImageWheel}
        >
          <div className="flex flex-col items-center gap-4 w-full h-full max-w-5xl">
            {/* Controles de Zoom */}
            <div className="flex gap-3 bg-black/50 px-4 py-3 rounded-xl items-center justify-center">
              <button
                onClick={() => handleImageZoom('out')}
                disabled={imageZoom <= 1}
                className="p-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white rounded-lg transition-all flex items-center gap-2"
                title="Zoom out (rueda del ratón hacia abajo)"
              >
                <FontAwesomeIcon icon={faMagnifyingGlassMinus} />
                <span className="text-sm font-bold">Zoom</span>
              </button>
              
              <span className="text-white font-bold px-4 py-1 bg-white/10 rounded-lg min-w-20 text-center">
                {(imageZoom * 100).toFixed(0)}%
              </span>
              
              <button
                onClick={() => handleImageZoom('in')}
                disabled={imageZoom >= 3}
                className="p-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white rounded-lg transition-all flex items-center gap-2"
                title="Zoom in (rueda del ratón hacia arriba)"
              >
                <FontAwesomeIcon icon={faMagnifyingGlassPlus} />
                <span className="text-sm font-bold">Acercar</span>
              </button>

              <div className="border-r border-white/20 h-8"></div>

              <button
                onClick={resetZoom}
                disabled={imageZoom === 1 && imagePan.x === 0 && imagePan.y === 0}
                className="p-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 text-white rounded-lg transition-all"
                title="Restablecer zoom"
              >
                <FontAwesomeIcon icon={faArrowRotateRight} />
              </button>

              <div className="border-r border-white/20 h-8"></div>

              <button
                onClick={closePreview}
                className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-all font-bold"
                title="Cerrar (Esc)"
              >
                <FontAwesomeIcon icon={faTimes} /> Cerrar
              </button>
            </div>

            {/* Imagen con Zoom y Pan */}
            <div
              className="flex-1 overflow-hidden rounded-2xl bg-black/40 flex items-center justify-center w-full relative cursor-grab active:cursor-grabbing"
              onClick={(e) => e.stopPropagation()}
              style={{
                cursor: imageZoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default'
              }}
            >
              <img
                src={previewImage}
                alt="Vista ampliada"
                className="origin-center transition-transform duration-100"
                style={{
                  transform: `scale(${imageZoom}) translate(${imagePan.x / (imageZoom * 100)}px, ${imagePan.y / (imageZoom * 100)}px)`,
                  maxWidth: '100%',
                  maxHeight: '100%',
                  userSelect: 'none'
                }}
                onMouseDown={handleMouseDown}
                onClick={(e) => e.stopPropagation()}
                draggable={false}
              />
            </div>

            {/* Instrucciones */}
            <div className="text-white text-xs text-center opacity-70 bg-black/50 px-4 py-2 rounded-xl">
              💡 Usa la rueda del ratón para hacer zoom • Arrastra para mover • Haz clic para cerrar
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default AdminPaymentVerification;
