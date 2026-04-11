import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getWithdrawals, requestWithdrawal } from '../../api/withdrawals';
import { getWalletSummary, getWalletTransactions } from '../../api/wallet';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet, faMoneyBillWave, faHistory, faExchangeAlt, faHandHoldingUsd, faPercentage } from '@fortawesome/free-solid-svg-icons';

const WalletView = () => {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  
  const [amount, setAmount] = useState('');
  const [bankInfo, setBankInfo] = useState({ bank: '', account: '', type: 'Ahorros' });
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wRes, sRes, tRes] = await Promise.all([
        getWithdrawals(),
        getWalletSummary(),
        getWalletTransactions(1, 10)
      ]);
      setWithdrawals(wRes.data);
      setSummary(sRes.data);
      setTransactions(tRes.data.transactions);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (parseFloat(amount) > (summary?.balance || 0)) return alert('Saldo insuficiente');
    
    setRequesting(true);
    try {
      await requestWithdrawal(parseFloat(amount), bankInfo);
      alert('Solicitud enviada con éxito');
      setAmount('');
      fetchData();
    } catch (e) { alert(e.response?.data?.error || 'Error en la solicitud'); }
    setRequesting(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Cargando billetera...</div>;

  return (
    <div className="space-y-8">
      {/* Balance Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-brand-secondary p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <FontAwesomeIcon icon={faWallet} size="6x" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <p className="text-brand-primary/80 font-bold uppercase tracking-widest text-sm mb-2">Mi Saldo Disponible</p>
            <h2 className={`text-5xl font-bold mb-6 ${(summary?.balance || 0) < 0 ? 'text-red-400' : 'text-white'}`}>
              {(summary?.balance || 0) < 0 ? '-' : ''}${(Math.abs(summary?.balance || 0)).toFixed(2)}
            </h2>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 px-4 py-3 rounded-xl backdrop-blur-sm flex items-start gap-3 w-full max-w-sm">
                <FontAwesomeIcon icon={faHandHoldingUsd} className="text-green-400 mt-1" />
                <div>
                  <p className="text-[10px] uppercase opacity-60 font-bold border-b border-white/20 pb-1 mb-1">
                    Ingresos Disponibles
                  </p>
                  <p className="font-bold text-xl mb-1">${((summary?.totalEarnings || 0) + (summary?.totalCommissionPaid || 0)).toFixed(2)}</p>
                  <p className="text-[9px] text-gray-300 leading-tight">
                    TunguMarket retiene únicamente el 5% de comisión de tus ventas globales (lo cual equivale a 
                    <strong className="text-brand-primary ml-1">${(summary?.totalCommissionPaid || 0).toFixed(2)} acumulados</strong>).
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white/10 px-6 py-4 rounded-xl backdrop-blur-sm text-right w-full md:w-auto">
            <p className="text-xs uppercase opacity-60 mb-1">Total Retirado</p>
            <h3 className="text-2xl font-bold">${(summary?.totalWithdrawals || 0).toFixed(2)}</h3>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Request Withdrawal Form */}
        <div className="glass-card p-8 h-fit">
          <h3 className="text-xl font-bold text-brand-secondary mb-6 flex items-center gap-3">
            <FontAwesomeIcon icon={faExchangeAlt} className="text-brand-primary" />
            Solicitar Retiro
          </h3>
          <form onSubmit={handleWithdraw} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Monto a retirar</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="input-field pl-8"
                  placeholder={`Max: $${(summary?.balance || 0).toFixed(2)}`}
                  max={summary?.balance || 0}
                  step="0.01"
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Banco</label>
                <input 
                  type="text" 
                  value={bankInfo.bank}
                  onChange={(e) => setBankInfo({...bankInfo, bank: e.target.value})}
                  className="input-field text-sm"
                  placeholder="Ej: Pichincha"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Tipo Cuenta</label>
                <select 
                  value={bankInfo.type}
                  onChange={(e) => setBankInfo({...bankInfo, type: e.target.value})}
                  className="input-field text-sm"
                >
                  <option>Ahorros</option>
                  <option>Corriente</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Número de Cuenta</label>
              <input 
                type="text" 
                value={bankInfo.account}
                onChange={(e) => setBankInfo({...bankInfo, account: e.target.value})}
                className="input-field text-sm"
                placeholder="Número de cuenta"
                required
              />
            </div>

            <button 
              type="submit"
              disabled={requesting}
              className="w-full py-4 bg-brand-primary text-brand-secondary font-bold rounded-2xl hover:bg-brand-secondary hover:text-white transition-all shadow-lg shadow-brand-primary/20 mt-4"
            >
              {requesting ? 'Procesando...' : 'Confirmar Retiro'}
            </button>
          </form>
        </div>

        {/* Recent Transactions History */}
        <div className="glass-card p-8 flex flex-col h-full">
          <h3 className="text-xl font-bold text-brand-secondary mb-6 flex items-center gap-3">
            <FontAwesomeIcon icon={faHistory} className="text-brand-primary" />
            Movimientos Recientes
          </h3>
          <div className="space-y-4 overflow-y-auto max-h-[400px] flex-1 pr-2">
            {transactions.length === 0 ? (
              <p className="text-center text-gray-400 py-10 italic">No hay transacciones registradas.</p>
            ) : (
              transactions.map((t) => (
                <div key={t.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:shadow-md transition duration-200">
                  <div className="flex gap-4 items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                      t.type === 'earning' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                    }`}>
                      <FontAwesomeIcon icon={t.type === 'earning' ? faMoneyBillWave : faExchangeAlt} />
                    </div>
                    <div>
                      <p className="font-bold text-brand-secondary text-sm line-clamp-1">{t.description}</p>
                      <p className="text-[10px] text-gray-400">{new Date(t.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <p className={`font-bold ${t.type === 'earning' ? 'text-green-600' : 'text-red-500'}`}>
                      {t.type === 'earning' ? '+' : '-'}${t.amount}
                    </p>
                    {t.commission > 0 && (
                      <p className="text-[10px] text-gray-400 mt-1">Fee: ${t.commission}</p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletView;
