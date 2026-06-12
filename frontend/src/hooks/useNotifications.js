import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useNotifications = () => {
  const [newNotification, setNewNotification] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('tungu_token');
    if (!token) return;

    const eventSource = new EventSource(`${API_URL}/notifications/stream?token=${token}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'NOTIFICATION') {
        setNewNotification(data);
        // Desvanecer la notificación después de 5 segundos
        setTimeout(() => setNewNotification(null), 5000);
      }
    };

    eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return { newNotification };
};
