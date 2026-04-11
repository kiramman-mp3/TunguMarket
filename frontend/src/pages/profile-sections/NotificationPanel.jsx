import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNotifications, markAsRead, markAllAsRead } from '../../api/notifications';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faBellSlash, faCheckDouble, faCircle, faShoppingBag, faTruck, faDollarSign } from '@fortawesome/free-solid-svg-icons';

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await getNotifications();
      setNotifications(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleMarkRead = async (id) => {
    try {
      await markAsRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) { console.error(e); }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (e) { console.error(e); }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'sale': return faDollarSign;
      case 'shipping': return faTruck;
      case 'payment': return faCheckDouble;
      default: return faShoppingBag;
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando notificaciones...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-brand-secondary flex items-center gap-3">
          <FontAwesomeIcon icon={faBell} className="text-brand-primary" />
          Centro de Notificaciones
        </h2>
        {notifications.some(n => !n.is_read) && (
          <button 
            onClick={handleMarkAllRead}
            className="text-sm font-bold text-brand-primary hover:text-brand-secondary transition-colors"
          >
            Marcar todas como leídas
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
          <FontAwesomeIcon icon={faBellSlash} className="text-gray-300 text-4xl mb-4" />
          <p className="text-gray-400">No tienes notificaciones por ahora.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {notifications.map((n) => (
              <motion.div 
                key={n.id}
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={`p-5 rounded-2xl border transition-all flex items-start gap-4 ${n.is_read ? 'bg-white border-gray-100' : 'bg-brand-primary/5 border-brand-primary/20 shadow-sm'}`}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${n.is_read ? 'bg-gray-50 text-gray-400' : 'bg-brand-primary/20 text-brand-secondary'}`}>
                  <FontAwesomeIcon icon={getIcon(n.type)} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className={`font-bold text-sm ${n.is_read ? 'text-gray-500' : 'text-brand-secondary'}`}>{n.title}</h4>
                    {!n.is_read && <FontAwesomeIcon icon={faCircle} className="text-[6px] text-brand-primary" />}
                  </div>
                  <p className={`text-sm mt-1 ${n.is_read ? 'text-gray-400' : 'text-gray-600'}`}>{n.message}</p>
                  <p className="text-[10px] text-gray-400 mt-2">{new Date(n.created_at).toLocaleString()}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
