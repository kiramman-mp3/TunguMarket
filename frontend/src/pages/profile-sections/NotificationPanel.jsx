import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getNotifications, markAsRead, markAllAsRead, subscribeToPush } from '../../api/notifications';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faBellSlash, faCheckDouble, faCircle, faShoppingBag, faTruck, faDollarSign, faBolt } from '@fortawesome/free-solid-svg-icons';

// Utility para convertir la VAPID key
const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
};

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pushStatus, setPushStatus] = useState('default'); // 'default', 'granted', 'denied'

  useEffect(() => {
    fetchNotifications();
    checkPushStatus();
  }, []);

  const checkPushStatus = () => {
    if (!('Notification' in window)) return;
    setPushStatus(Notification.permission);
  };

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

  const handleEnablePush = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      alert('Tu navegador no soporta notificaciones Push.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setPushStatus(permission);

      if (permission === 'granted') {
        await navigator.serviceWorker.register('/sw.js');
        const activeRegistration = await navigator.serviceWorker.ready;

        const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
        const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

        const subscription = await activeRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        });

        await subscribeToPush(subscription);
        alert('Notificaciones Push activadas exitosamente!');
      }
    } catch (error) {
      console.error('Error al suscribir a Push:', error);
      alert('Hubo un error al activar las notificaciones Push.');
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'sale': return faDollarSign;
      case 'shipping': return faTruck;
      case 'payment': return faCheckDouble;
      default: return faShoppingBag;
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando notificaciones...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-brand-secondary flex items-center gap-3">
          <FontAwesomeIcon icon={faBell} className="text-brand-primary" />
          Centro de Notificaciones
        </h2>

        <div className="flex gap-4 items-center">

          {notifications.some(n => !n.is_read) && (
            <button
              onClick={handleMarkAllRead}
              className="text-xs font-bold text-brand-primary hover:text-brand-secondary px-3 py-2 bg-brand-primary/10 rounded-xl transition-colors"
            >
              Marcar todas como leídas
            </button>
          )}
        </div>
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
                className={`p-5 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer ${n.is_read ? 'bg-white border-gray-100 hover:shadow-sm' : 'bg-brand-primary/5 border-brand-primary/20 shadow-md transform hover:-translate-y-1'}`}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${n.is_read ? 'bg-gray-50 text-gray-400' : 'bg-brand-primary/20 text-brand-secondary'}`}>
                  <FontAwesomeIcon icon={getIcon(n.type)} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <h4 className={`font-bold text-sm ${n.is_read ? 'text-gray-500' : 'text-brand-secondary'}`}>{n.title}</h4>
                    {!n.is_read && <FontAwesomeIcon icon={faCircle} className="text-[6px] text-brand-primary mt-1 shadow-sm" />}
                  </div>
                  <p className={`text-sm mt-1 ${n.is_read ? 'text-gray-400' : 'text-gray-600'}`}>{n.message}</p>
                  <p className="text-[10px] text-gray-400 mt-2 font-medium">{new Date(n.created_at).toLocaleString()}</p>
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
