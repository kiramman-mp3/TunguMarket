import React, { useState } from 'react';
import EditProfile from './EditProfile';
import AddressManager from './AddressManager';
import { motion } from 'framer-motion';

const AccountWrapper = () => {
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-gray-100 pb-4">
        <button
          onClick={() => setActiveTab('profile')}
          className={`font-bold pb-2 transition-colors ${activeTab === 'profile' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400 hover:text-brand-secondary'}`}
        >
          Editar Perfil
        </button>
        <button
          onClick={() => setActiveTab('addresses')}
          className={`font-bold pb-2 transition-colors ${activeTab === 'addresses' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400 hover:text-brand-secondary'}`}
        >
          Direcciones
        </button>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'profile' ? <EditProfile /> : <AddressManager />}
      </motion.div>
    </div>
  );
};

export default AccountWrapper;
