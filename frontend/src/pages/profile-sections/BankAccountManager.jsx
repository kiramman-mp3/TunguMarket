import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBank, faPlus, faEdit, faTrash, faStar, faCheckCircle, faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import {
  getMyBankAccounts,
  createBankAccount,
  updateBankAccount,
  setDefaultBankAccount,
  deleteBankAccount
} from '../../api/sellerBankAccounts';

const BankAccountManager = () => {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    banco: '',
    numero_cuenta: '',
    tipo_cuenta: 'ahorros',
    titular_cuenta: '',
    cedula_operador: '',
    notas: ''
  });

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError('');
      let data = await getMyBankAccounts();
      
      // Manejar diferentes estructuras de respuesta
      let accountsArray = [];
      if (Array.isArray(data)) {
        accountsArray = data;
      } else if (data?.data && Array.isArray(data.data)) {
        accountsArray = data.data;
      } else if (data?.accounts && Array.isArray(data.accounts)) {
        accountsArray = data.accounts;
      }
      
      setAccounts(accountsArray);
    } catch (err) {
      console.error('Error fetchAccounts:', err);
      setError(err.message || 'Error al cargar cuentas bancarias');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      banco: '',
      numero_cuenta: '',
      tipo_cuenta: 'ahorros',
      titular_cuenta: '',
      cedula_operador: '',
      notas: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.banco.trim() || !formData.numero_cuenta.trim() || !formData.titular_cuenta.trim() || !formData.cedula_operador.trim()) {
      alert('Completa todos los campos requeridos');
      return;
    }

    // Validate Ecuadorian ID (10 digits)
    if (formData.cedula_operador.length !== 10 || !/^\d+$/.test(formData.cedula_operador)) {
      alert('La cédula debe tener exactamente 10 dígitos');
      return;
    }

    try {
      setSubmitting(true);
      if (editingId) {
        await updateBankAccount(editingId, formData);
        setAccounts(accounts.map(a => a.id === editingId ? { ...a, ...formData } : a));
      } else {
        let newAccount = await createBankAccount(formData);
        
        // Manejar diferentes estructuras de respuesta
        if (newAccount?.data && typeof newAccount.data === 'object') {
          newAccount = newAccount.data;
        }
        
        setAccounts([...accounts, newAccount]);
      }
      handleReset();
      alert(editingId ? 'Cuenta actualizada' : 'Cuenta creada');
    } catch (err) {
      setError(err.message || 'Error al guardar cuenta');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (account) => {
    setFormData({
      banco: account.banco,
      numero_cuenta: account.numero_cuenta,
      tipo_cuenta: account.tipo_cuenta,
      titular_cuenta: account.titular_cuenta,
      cedula_operador: account.cedula_operador,
      notas: account.notas || ''
    });
    setEditingId(account.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta cuenta bancaria?')) return;
    try {
      await deleteBankAccount(id);
      setAccounts(accounts.filter(a => a.id !== id));
    } catch (err) {
      setError(err.message || 'Error al eliminar cuenta');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultBankAccount(id);
      setAccounts(accounts.map(a => ({ ...a, es_predeterminada: a.id === id })));
    } catch (err) {
      setError(err.message || 'Error al establecer cuenta por defecto');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-secondary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100"
        >
          {error}
        </motion.div>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-brand-secondary">Mis Cuentas Bancarias</h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-brand-secondary text-white px-4 py-2 rounded-xl font-bold hover:opacity-90 transition-all"
          >
            <FontAwesomeIcon icon={faPlus} />
            Nueva Cuenta
          </button>
        )}
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-card p-6 space-y-4 bg-brand-primary/5 border-brand-primary/20"
          >
            <h4 className="font-bold text-brand-secondary">
              {editingId ? 'Editar Cuenta' : 'Nueva Cuenta Bancaria'}
            </h4>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Banco</label>
                  <input
                    type="text"
                    value={formData.banco}
                    onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                    placeholder="Ej: Banco del Pichincha"
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Número de Cuenta</label>
                  <input
                    type="text"
                    value={formData.numero_cuenta}
                    onChange={(e) => setFormData({ ...formData, numero_cuenta: e.target.value })}
                    placeholder="Ej: 1234567890"
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Tipo de Cuenta</label>
                  <select
                    value={formData.tipo_cuenta}
                    onChange={(e) => setFormData({ ...formData, tipo_cuenta: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="ahorros">Ahorros</option>
                    <option value="corriente">Corriente</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">Titular</label>
                  <input
                    type="text"
                    value={formData.titular_cuenta}
                    onChange={(e) => setFormData({ ...formData, titular_cuenta: e.target.value })}
                    placeholder="Tu nombre completo"
                    className="input-field w-full"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Cédula (10 dígitos)</label>
                  <input
                    type="text"
                    value={formData.cedula_operador}
                    onChange={(e) => setFormData({ ...formData, cedula_operador: e.target.value.slice(0, 10) })}
                    placeholder="Ej: 1234567890"
                    maxLength="10"
                    className="input-field w-full font-mono"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-1">Notas (Opcional)</label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    placeholder="Ej: Cuenta para retiros grandes"
                    className="input-field w-full resize-none h-20"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-brand-secondary text-white font-bold py-2 px-4 rounded-xl hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {submitting ? 'Guardando...' : editingId ? 'Actualizar' : 'Crear Cuenta'}
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="flex-1 bg-gray-200 text-gray-700 font-bold py-2 px-4 rounded-xl hover:bg-gray-300 transition-all"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Accounts List */}
      {accounts.length === 0 ? (
        <div className="text-center py-12 glass-card">
          <FontAwesomeIcon icon={faBank} className="text-4xl text-gray-300 mb-4" />
          <p className="text-gray-500 font-medium">No tienes cuentas bancarias registradas</p>
        </div>
      ) : (
        <div className="space-y-4">
          {accounts.map((account) => (
            <motion.div
              key={account.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-4 border border-gray-200 hover:border-brand-secondary/30 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-12 h-12 rounded-xl bg-brand-secondary/10 flex items-center justify-center flex-shrink-0">
                    <FontAwesomeIcon icon={faBank} className="text-brand-secondary text-xl" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-gray-900">{account.banco}</h4>
                      {account.es_predeterminada && (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-[10px] font-bold">
                          <FontAwesomeIcon icon={faStar} />
                          Predeterminada
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 font-mono mb-2">{account.numero_cuenta}</p>
                    <p className="text-xs text-gray-500">
                      <span className="font-bold">{account.titular_cuenta}</span> • 
                      <span className="capitalize ml-1">{account.tipo_cuenta}</span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 flex-shrink-0">
                  {!account.es_predeterminada && (
                    <button
                      onClick={() => handleSetDefault(account.id)}
                      className="p-2 text-gray-500 hover:text-brand-secondary hover:bg-gray-100 rounded-xl transition-all"
                      title="Establecer como predeterminada"
                    >
                      <FontAwesomeIcon icon={faStar} />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(account)}
                    className="p-2 text-brand-secondary hover:bg-brand-secondary/10 rounded-xl transition-all"
                    title="Editar"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    title="Eliminar"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>

              {account.notas && (
                <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100 italic">
                  {account.notas}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BankAccountManager;
