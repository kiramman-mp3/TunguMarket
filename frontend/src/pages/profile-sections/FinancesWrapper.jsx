import React, { useState } from 'react';
import WalletView from './WalletView';
import BankAccountManager from './BankAccountManager';
import SellerWithdrawals from './SellerWithdrawals';
import { motion } from 'framer-motion';

const FinancesWrapper = ({ user }) => {
  const [activeTab, setActiveTab] = useState('wallet');

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b border-gray-100 pb-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('wallet')}
          className={`font-bold pb-2 transition-colors whitespace-nowrap ${activeTab === 'wallet' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400 hover:text-brand-secondary'}`}
        >
          Billetera
        </button>
        {user?.role !== 'admin' && (
          <>
            <button
              onClick={() => setActiveTab('bank-accounts')}
              className={`font-bold pb-2 transition-colors whitespace-nowrap ${activeTab === 'bank-accounts' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400 hover:text-brand-secondary'}`}
            >
              Cuentas Bancarias
            </button>
            <button
              onClick={() => setActiveTab('withdrawals')}
              className={`font-bold pb-2 transition-colors whitespace-nowrap ${activeTab === 'withdrawals' ? 'text-brand-primary border-b-2 border-brand-primary' : 'text-gray-400 hover:text-brand-secondary'}`}
            >
              Mis Retiros
            </button>
          </>
        )}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'wallet' && <WalletView />}
        {activeTab === 'bank-accounts' && <BankAccountManager />}
        {activeTab === 'withdrawals' && <SellerWithdrawals onNavigateTo={setActiveTab} />}
      </motion.div>
    </div>
  );
};

export default FinancesWrapper;
