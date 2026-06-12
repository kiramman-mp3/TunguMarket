import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getMyOrders, getOrderDetails } from '../../api/orders';
import OrderDetailModal from '../../components/OrderDetailModal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBox, faClock, faCheckCircle, faTimesCircle } from '@fortawesome/free-solid-svg-icons';

const BuyerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    getMyOrders().then(res => {
      setOrders(res.data.orders);
      setLoading(false);
    });
  }, []);

  const getStatusColor = (status) => {
    switch(status.toLowerCase()) {
      case 'pagado': return 'bg-green-100 text-green-700';
      case 'pago_rechazado': return 'bg-red-100 text-red-700';
      case 'confirmado': return 'bg-green-100 text-green-700';
      case 'pendiente': return 'bg-amber-100 text-amber-700';
      case 'aceptado': return 'bg-blue-100 text-blue-700';
      case 'envío completado': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status) => {
    const statusMap = {
      'pagado': 'Pagado',
      'pago_rechazado': 'Pago Rechazado',
      'confirmado': 'Confirmado',
      'pendiente': 'Pendiente',
      'aceptado': 'Aceptado',
      'envío completado': 'Envío Completado'
    };
    return statusMap[status.toLowerCase()] || status;
  };

  const handleViewDetails = async (id) => {
    try {
      const data = await getOrderDetails(id);
      setSelectedOrder(data.order);
      setShowModal(true);
    } catch (err) {
      alert('Error cargando detalles');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Cargando tus compras...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-brand-secondary mb-6 flex items-center gap-3">
        <FontAwesomeIcon icon={faBox} className="text-brand-primary" />
        Mis Compras
      </h2>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400">Aún no has realizado ninguna compra.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orders.map((order) => (
            <motion.div 
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 flex items-center justify-between"
            >
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Orden #{order.id.slice(0,8)}</p>
                <p className="font-bold text-brand-secondary text-lg">${order.total_price}</p>
                <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleDateString()}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase ${getStatusColor(order.status)}`}>
                  {getStatusLabel(order.status)}
                </span>
                <button 
                  onClick={() => handleViewDetails(order.id)}
                  className="text-xs font-bold text-brand-primary hover:underline"
                >
                  Ver detalles
                </button>
                {order.status === 'Envío completado' && (
                  <Link 
                    to={`/product/${order.items?.[0]?.product_id || ''}`} 
                    className="mt-1 bg-amber-500 text-white px-3 py-1 rounded-lg text-[10px] font-black uppercase hover:bg-amber-600 transition-colors"
                  >
                    Dejar Reseña
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <OrderDetailModal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)} 
        order={selectedOrder} 
      />
    </div>
  );
};

export default BuyerOrders;
