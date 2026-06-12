import React, { useState } from 'react';
import NotificationPanel from './NotificationPanel';
import Wishlist from './Wishlist';
import { motion } from 'framer-motion';

const ActivityWrapper = () => {
  const [activeTab, setActiveTab] = useState('notifications');

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-gray-100 pb-4">
        <button
          onClick={() => setActiveTab('notifications')}
          className={`font-bold pb-2 transition-colors ${activeTab === 'notifications' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400 hover:text-brand-secondary'}`}
        >
          Notificaciones
        </button>
        <button
          onClick={() => setActiveTab('wishlist')}
          className={`font-bold pb-2 transition-colors ${activeTab === 'wishlist' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400 hover:text-brand-secondary'}`}
        >
          Favoritos
        </button>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'notifications' ? <NotificationPanel /> : <Wishlist />}
      </motion.div>
    </div>
  );
};

export default ActivityWrapper;
