import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, 
  faBox, 
  faTruck, 
  faMapMarkerAlt, 
  faUser, 
  faEnvelope, 
  faCalendarAlt,
  faReceipt
} from '@fortawesome/free-solid-svg-icons';

const OrderDetailModal = ({ order, isOpen, onClose }) => {
  if (!order || !isOpen) return null;

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'pagado': return 'bg-green-100 text-green-600';
      case 'pago_rechazado': return 'bg-red-100 text-red-600';
      case 'confirmado': return 'bg-green-100 text-green-600';
      case 'aceptado': return 'bg-blue-100 text-blue-600';
      case 'envío completado': return 'bg-green-100 text-green-600';
      case 'cancelado': return 'bg-red-100 text-red-600';
      default: return 'bg-brand-primary/20 text-brand-secondary';
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'pagado': 'Pagado',
      'pago_rechazado': 'Pago Rechazado',
      'confirmado': 'Confirmado',
      'pendiente': 'Pendiente',
      'aceptado': 'Aceptado',
      'envío completado': 'Envío Completado',
      'cancelado': 'Cancelado'
    };
    return statusMap[status.toLowerCase()] || status;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-brand-secondary/40 backdrop-blur-md"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-brand-light/20">
          <div>
            <h3 className="text-2xl font-black text-brand-secondary inline-flex items-center gap-2">
              <FontAwesomeIcon icon={faReceipt} className="text-brand-primary" />
              Detalle del Pedido
            </h3>
            <p className="text-xs font-bold text-gray-400 mt-1 uppercase tracking-widest">
              ID: #{order.id.substring(0, 8)} • {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full hover:bg-white transition-colors flex items-center justify-center text-gray-400 hover:text-brand-secondary shadow-sm"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          
          {/* Status Badge */}
          <div className="flex justify-center">
            <span className={`px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest ${getStatusColor(order.status)}`}>
              {getStatusLabel(order.status)}
            </span>
            {order.payment_method === 'efectivo' && order.status !== 'Envío completado' && (
              <p className="mt-4 text-[10px] font-black text-brand-primary bg-brand-primary/5 px-4 py-2 rounded-xl">
                ⚠️ Paga a esta persona cuando recibas el producto.
              </p>
            )}
          </div>

          {/* Logistics & Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Shipping Info */}
            <div className="space-y-4">
              <h4 className="font-black text-brand-secondary flex items-center gap-2 text-sm uppercase">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-brand-primary" />
                Entrega
              </h4>
              {order.shipping_info ? (
                <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
                  <p className="font-bold text-brand-secondary text-sm">{order.shipping_info.city}</p>
                  <p className="text-xs text-gray-500 font-medium">
                    {order.shipping_info.main_street} y {order.shipping_info.secondary_street}
                  </p>
                  {order.shipping_info.neighborhood && (
                    <p className="text-[10px] text-gray-400 italic">Barrio: {order.shipping_info.neighborhood}</p>
                  )}
                  {order.shipping_info.house_number && (
                    <p className="text-[10px] font-black uppercase text-gray-400">Casa: {order.shipping_info.house_number}</p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-gray-400 font-bold italic">Información de envío no disponible</p>
              )}
            </div>

            {/* Buyer/Seller Info */}
            <div className="space-y-4">
              <h4 className="font-black text-brand-secondary flex items-center gap-2 text-sm uppercase">
                <FontAwesomeIcon icon={faUser} className="text-brand-primary" />
                Contacto
              </h4>
              <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                   <div className="w-6 h-6 rounded-full bg-brand-primary/20 flex items-center justify-center text-[10px] text-brand-secondary font-black">
                     {order.buyer_name?.[0]?.toUpperCase()}
                   </div>
                   <p className="text-xs font-bold text-brand-secondary">{order.buyer_name}</p>
                </div>
                <div className="flex items-center gap-2 text-gray-500">
                  <FontAwesomeIcon icon={faEnvelope} className="text-[10px]" />
                  <span className="text-xs font-medium">{order.buyer_email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-4">
            <h4 className="font-black text-brand-secondary flex items-center gap-2 text-sm uppercase">
              <FontAwesomeIcon icon={faBox} className="text-brand-primary" />
              Productos
            </h4>
            <div className="divide-y divide-gray-50 bg-gray-50/50 rounded-3xl p-4">
              {order.items?.map((item) => (
                <div key={item.id} className="py-4 flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 bg-white border border-gray-100">
                    <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-brand-secondary truncate">{item.product_title}</p>
                    <p className="text-xs text-gray-400 font-bold">Cant: {item.quantity} • ${item.price_at_purchase} c/u</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-brand-secondary">${(item.price_at_purchase * item.quantity).toFixed(2)}</p>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                      item.status === 'Envío completado' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                      {item.status || 'Pendiente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-brand-secondary text-white">
          <div className="flex justify-between items-center">
             <span className="font-bold uppercase tracking-widest text-xs opacity-60">Total Pagado</span>
             <span className="text-3xl font-black text-brand-primary">${parseFloat(order.total_price).toFixed(2)}</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default OrderDetailModal;
