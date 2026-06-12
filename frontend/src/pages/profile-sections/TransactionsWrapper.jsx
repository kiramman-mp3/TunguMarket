import React, { useState } from 'react';
import BuyerOrders from './BuyerOrders';
import SellerSales from './SellerSales';
import { motion } from 'framer-motion';

const TransactionsWrapper = () => {
  const [activeTab, setActiveTab] = useState('purchases');

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-gray-100 pb-4">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`font-bold pb-2 transition-colors ${activeTab === 'purchases' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400 hover:text-brand-secondary'}`}
        >
          Mis Compras
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`font-bold pb-2 transition-colors ${activeTab === 'sales' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400 hover:text-brand-secondary'}`}
        >
          Mis Ventas
        </button>
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'purchases' ? <BuyerOrders /> : <SellerSales />}
      </motion.div>
    </div>
  );
};

export default TransactionsWrapper;
