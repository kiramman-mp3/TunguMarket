import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getWithdrawals, requestWithdrawal } from '../../api/withdrawals';
import { useAuth } from '../../context/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWallet, faMoneyBillWave, faHistory, faExchangeAlt, faUniversity } from '@fortawesome/free-solid-svg-icons';

const WalletView = () => {
  const { user } = useAuth();
  const [withdrawals, setWithdrawals] = useState([]);
  const [amount, setAmount] = useState('');
  const [bankInfo, setBankInfo] = useState({ bank: '', account: '', type: 'Ahorros' });
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const res = await getWithdrawals();
      setWithdrawals(res.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (parseFloat(amount) > user.balance) return alert('Saldo insuficiente');
    
    setRequesting(true);
    try {
      await requestWithdrawal(parseFloat(amount), bankInfo);
      alert('Solicitud enviada con éxito');
      setAmount('');
      fetchWithdrawals();
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
        <div className="relative z-10">
          <p className="text-brand-primary/80 font-bold uppercase tracking-widest text-sm mb-2">Mi Saldo Disponible</p>
          <h2 className="text-5xl font-bold mb-6">${user?.balance || '0.00'}</h2>
          <div className="flex gap-4">
            <div className="bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm">
              <p className="text-[10px] uppercase opacity-60">Total Ganado</p>
              <p className="font-bold">$0.00</p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Request Withdrawal Form */}
        <div className="glass-card p-8">
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
                  placeholder="0.00"
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
              className="w-full py-4 bg-brand-primary text-brand-secondary font-bold rounded-2xl hover:bg-brand-secondary hover:text-white transition-all shadow-lg shadow-brand-primary/20"
            >
              {requesting ? 'Procesando...' : 'Confirmar Retiro'}
            </button>
          </form>
        </div>

        {/* Recent History */}
        <div className="glass-card p-8">
          <h3 className="text-xl font-bold text-brand-secondary mb-6 flex items-center gap-3">
            <FontAwesomeIcon icon={faHistory} className="text-brand-primary" />
            Historial de Retiros
          </h3>
          <div className="space-y-4">
            {withdrawals.length === 0 ? (
              <p className="text-center text-gray-400 py-10 italic">No hay retiros registrados.</p>
            ) : (
              withdrawals.map((w) => (
                <div key={w.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div>
                    <p className="font-bold text-brand-secondary">${w.amount}</p>
                    <p className="text-[10px] text-gray-400">{new Date(w.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${w.status === 'pendiente' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                    {w.status}
                  </span>
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
