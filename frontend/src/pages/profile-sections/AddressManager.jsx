import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, 
  faTrash, 
  faMapMarkerAlt, 
  faCheckCircle, 
  faHome,
  faBuilding,
  faTimes,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { getAddresses, createAddress, deleteAddress, setDefaultAddress } from '../../api/address';

const CANTONES = [
  'Ambato', 'Baños de Agua Santa', 'Cevallos', 'Mocha', 
  'Patate', 'Quero', 'Pelileo', 'Píllaro', 'Tisaleo'
];

const AddressManager = () => {
  const [addresses, setAddresses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    city: 'Ambato',
    main_street: '',
    secondary_street: '',
    neighborhood: '',
    house_number: '',
    postal_code: '',
    is_default: false
  });

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      const data = await getAddresses();
      setAddresses(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await createAddress(formData);
      setShowModal(false);
      setFormData({
        city: 'Ambato',
        main_street: '',
        secondary_street: '',
        neighborhood: '',
        house_number: '',
        postal_code: '',
        is_default: false
      });
      fetchAddresses();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar esta dirección?')) return;
    try {
      await deleteAddress(id);
      fetchAddresses();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await setDefaultAddress(id);
      fetchAddresses();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Cargando direcciones...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black text-brand-secondary">Mis Direcciones</h2>
          <p className="text-sm text-gray-400 font-medium">Gestiona tus lugares de entrega (Máx. 4)</p>
        </div>
        {addresses.length < 4 && (
          <button 
            onClick={() => setShowModal(true)}
            className="btn-primary px-6 py-3 rounded-2xl flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            Nueva Dirección
          </button>
        )}
      </div>

      {addresses.length === 0 ? (
        <div className="glass-card p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center mx-auto text-2xl">
            <FontAwesomeIcon icon={faMapMarkerAlt} />
          </div>
          <p className="text-gray-400 font-bold">No tienes direcciones guardadas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((addr) => (
            <motion.div 
              key={addr.id}
              layout
              className={`glass-card p-6 border-2 transition-all group ${
                addr.is_default ? 'border-brand-primary' : 'border-transparent'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  addr.is_default ? 'bg-brand-primary text-brand-secondary' : 'bg-gray-100 text-gray-400'
                }`}>
                  <FontAwesomeIcon icon={addr.is_default ? faCheckCircle : faMapMarkerAlt} />
                </div>
                <div className="flex gap-2">
                  {!addr.is_default && (
                    <button 
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-[10px] font-black uppercase tracking-widest text-brand-primary hover:underline"
                    >
                      Predeterminada
                    </button>
                  )}
                  <button 
                    onClick={() => handleDelete(addr.id)}
                    className="text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTrash} size="sm" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <p className="font-black text-brand-secondary">{addr.city}</p>
                <p className="text-sm font-bold text-gray-600">{addr.main_street} y {addr.secondary_street}</p>
                {addr.neighborhood && <p className="text-xs text-gray-400 italic">Barrio: {addr.neighborhood}</p>}
                {(addr.house_number || addr.postal_code) && (
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">
                    {addr.house_number && `Casa: ${addr.house_number}`} 
                    {addr.postal_code && ` | CP: ${addr.postal_code}`}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* MODAL NUEVA DIRECCION */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-brand-secondary/40 backdrop-blur-md"
              onClick={() => setShowModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                   <h3 className="text-2xl font-black text-brand-secondary">Nueva Dirección</h3>
                   <button onClick={() => setShowModal(false)} className="text-gray-300 hover:text-brand-secondary transition-colors">
                     <FontAwesomeIcon icon={faTimes} size="lg" />
                   </button>
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-400">Cantón (Tungurahua)</label>
                    <select 
                      className="w-full bg-gray-50 border-0 rounded-2xl p-4 font-bold text-brand-secondary focus:ring-2 ring-brand-primary"
                      value={formData.city}
                      onChange={e => setFormData({...formData, city: e.target.value})}
                    >
                      {CANTONES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400">Calle Principal</label>
                      <input 
                        type="text" required
                        className="w-full bg-gray-50 border-0 rounded-2xl p-4 font-bold text-brand-secondary"
                        value={formData.main_street}
                        onChange={e => setFormData({...formData, main_street: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400">Calle Secundaria</label>
                      <input 
                        type="text" required
                        className="w-full bg-gray-50 border-0 rounded-2xl p-4 font-bold text-brand-secondary"
                        value={formData.secondary_street}
                        onChange={e => setFormData({...formData, secondary_street: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400">Barrio (Opcional)</label>
                      <input 
                        type="text"
                        className="w-full bg-gray-50 border-0 rounded-2xl p-4 font-bold text-brand-secondary"
                        value={formData.neighborhood}
                        onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400">Nº Casa (Opcional)</label>
                      <input 
                        type="text"
                        className="w-full bg-gray-50 border-0 rounded-2xl p-4 font-bold text-brand-secondary"
                        value={formData.house_number}
                        onChange={e => setFormData({...formData, house_number: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase text-gray-400">Código Postal</label>
                    <input 
                      type="text" required
                      className="w-full bg-gray-50 border-0 rounded-2xl p-4 font-bold text-brand-secondary"
                      value={formData.postal_code}
                      onChange={e => setFormData({...formData, postal_code: e.target.value})}
                    />
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer group p-2">
                    <input 
                      type="checkbox"
                      className="w-5 h-5 rounded text-brand-primary focus:ring-brand-primary border-gray-200"
                      checked={formData.is_default}
                      onChange={e => setFormData({...formData, is_default: e.target.checked})}
                    />
                    <span className="text-sm font-bold text-gray-500 group-hover:text-brand-secondary transition-colors">Establecer como predeterminada</span>
                  </label>

                  <button className="btn-primary w-full py-5 rounded-2xl font-black text-lg mt-4">
                    Guardar Dirección
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AddressManager;
