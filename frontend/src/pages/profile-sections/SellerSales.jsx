import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getMySales, updateSaleStatus } from '../../api/orders';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStore, faTruck, faCheckCircle, faUser } from '@fortawesome/free-solid-svg-icons';

const SellerSales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const res = await getMySales();
      setSales(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleMarkAsShipped = async (itemId) => {
    try {
      await updateSaleStatus(itemId, 'Enviado');
      fetchSales(); // Recargar
    } catch (e) { alert('Error al actualizar estado'); }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando tus ventas...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-brand-secondary mb-6 flex items-center gap-3">
        <FontAwesomeIcon icon={faStore} className="text-brand-primary" />
        Mis Ventas (Dashboard)
      </h2>

      {sales.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <p className="text-gray-400">Aún no has tenido ventas. ¡Ánimo!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {sales.map((sale) => (
            <motion.div 
              key={sale.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="glass-card p-6 border-l-4 border-l-brand-primary"
            >
              <div className="flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-brand-secondary mb-2">{sale.title}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1.5 font-medium">
                      <FontAwesomeIcon icon={faUser} className="text-brand-primary" />
                      {sale.buyer_name}
                    </span>
                    <span>• Cantidad: {sale.quantity}</span>
                    <span className="font-bold text-brand-secondary">Subtotal: ${sale.price_at_purchase * sale.quantity}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${sale.status === 'Enviado' ? 'bg-indigo-100 text-indigo-700' : 'bg-amber-100 text-amber-700'}`}>
                      {sale.status || 'Pendiente de envío'}
                    </span>
                    <span className="text-xs text-gray-400 italic">Orden #{sale.order_id.slice(0,8)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {sale.status !== 'Enviado' && (
                    <button 
                      onClick={() => handleMarkAsShipped(sale.id)}
                      className="px-6 py-2 bg-brand-secondary text-white rounded-xl text-sm font-bold hover:bg-brand-primary transition-all flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faTruck} />
                      Marcar como Enviado
                    </button>
                  )}
                  {sale.status === 'Enviado' && (
                    <div className="text-green-600 flex items-center gap-2 font-bold text-sm">
                      <FontAwesomeIcon icon={faCheckCircle} />
                      Ya enviado
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerSales;
