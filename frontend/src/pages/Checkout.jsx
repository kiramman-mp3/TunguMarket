import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faUniversity, 
  faCreditCard, 
  faMoneyBillWave, 
  faUpload, 
  faMapMarkerAlt,
  faCheckCircle,
  faSpinner,
  faShoppingBag,
  faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../context/CartContext';
import CreditCardForm from '../components/CreditCardForm';
import { useAuth } from '../context/AuthContext';

const Checkout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { cartItems, totalPrice, clearCart } = useCart();
  const [paymentMethod, setPaymentMethod] = useState(null); // 'transferencia', 'tarjeta', 'efectivo'
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);

  if (cartItems.length === 0 && !success) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex flex-col items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-brand-secondary">Tu carrito está vacío</h2>
          <Link to="/shop" className="btn-primary inline-block px-8 py-3">Volver a la tienda</Link>
        </div>
      </div>
    );
  }

  const handleCheckout = async (method, extraData = {}) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('tungu_token');
      const formData = new FormData();
      formData.append('payment_method', method);
      
      if (method === 'transferencia' && receipt) {
        formData.append('receipt', receipt);
      }

      const response = await fetch (`http://${window.location.hostname}:5000/api/orders/checkout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la orden');
      }

      setOrderId(data.order_id);
      setSuccess(true);
      clearCart();

    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const methods = [
    { 
      id: 'transferencia', 
      title: 'Transferencia Bancaria', 
      icon: faUniversity, 
      color: 'blue' 
    },
    { 
      id: 'tarjeta', 
      title: 'Tarjeta de Crédito', 
      icon: faCreditCard, 
      color: 'purple' 
    },
    { 
      id: 'efectivo', 
      title: 'Pago en Efectivo', 
      icon: faMoneyBillWave, 
      color: 'green' 
    }
  ];

  if (success) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex items-center justify-center px-4 bg-brand-light/20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card max-w-lg w-full p-12 text-center space-y-8"
        >
          <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto text-4xl">
            <FontAwesomeIcon icon={faCheckCircle} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-display font-black text-brand-secondary">¡Pedido Realizado!</h1>
            <p className="text-gray-500 font-medium italic">Tu orden #{orderId?.substring(0,8)} ha sido generada con éxito.</p>
          </div>

          <div className="bg-brand-light/30 rounded-2xl p-6 text-left space-y-4">
            <h4 className="font-bold text-brand-secondary flex items-center gap-2">
              <FontAwesomeIcon icon={faInfoCircle} className="text-brand-primary" />
              Próximos Pasos:
            </h4>
            {paymentMethod === 'tarjeta' && (
              <p className="text-sm text-gray-600 font-medium">Tu pago ha sido aceptado automáticamente. Estamos preparando tu envío.</p>
            )}
            {paymentMethod === 'transferencia' && (
              <p className="text-sm text-gray-600 font-medium">Hemos recibido tu comprobante. El estado de tu pedido cambiará a "Aceptado" una vez que verifiquemos la transferencia.</p>
            )}
            {paymentMethod === 'efectivo' && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600 font-medium">Se ha generado una **Orden de Pago**. Por favor acércate a nuestra oficina física para completar el pago:</p>
                <div className="flex items-start gap-2 text-brand-secondary font-bold text-sm bg-white p-3 rounded-xl">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="mt-1 text-red-500" />
                  <span>Quero, Tungurahua, Ecuador</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4">
            <Link to="/shop" className="btn-primary py-4 rounded-2xl font-black">
              Seguir Comprando
            </Link>
            <Link to="/profile" className="text-gray-400 font-bold hover:text-brand-secondary transition-colors">
              Ver mis pedidos
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light/20 pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-12 gap-12">
        
        {/* Left Side: Order Summary & Selection */}
        <div className="lg:col-span-12">
           <button 
              onClick={() => navigate('/cart')}
              className="flex items-center gap-2 text-gray-500 hover:text-brand-primary font-bold transition-colors mb-8"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Volver al carrito
            </button>
        </div>

        <div className="lg:col-span-7 space-y-8">
          <section className="space-y-6">
            <h2 className="text-3xl font-display font-black text-brand-secondary">Método de Pago</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {methods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 group ${
                    paymentMethod === method.id 
                      ? 'border-brand-primary bg-white shadow-xl scale-105' 
                      : 'border-transparent bg-white/50 hover:bg-white'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-colors ${
                     paymentMethod === method.id ? 'bg-brand-primary text-brand-secondary' : 'bg-gray-100 text-gray-400'
                  }`}>
                    <FontAwesomeIcon icon={method.icon} />
                  </div>
                  <span className={`font-bold text-sm ${paymentMethod === method.id ? 'text-brand-secondary' : 'text-gray-400'}`}>
                    {method.title}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <AnimatePresence mode="wait">
            {paymentMethod === 'transferencia' && (
              <motion.div 
                key="transfer" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card p-8 space-y-8"
              >
                <div className="space-y-6">
                  <h3 className="text-xl font-black text-brand-secondary">Información Bancaria</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/60 p-6 rounded-3xl border border-blue-100 space-y-2">
                       <p className="text-blue-600 font-black text-xs uppercase tracking-widest">Banco Pichincha</p>
                       <p className="text-sm font-bold text-brand-secondary">TunguMarket (Johan Rodriguez)</p>
                       <p className="text-lg font-black text-brand-secondary">2209093374</p>
                       <p className="text-xs font-bold text-gray-400">Cuenta Corriente | CI: 1850410612</p>
                    </div>
                    <div className="bg-white/60 p-6 rounded-3xl border border-green-100 space-y-2">
                       <p className="text-green-600 font-black text-xs uppercase tracking-widest">Produbanco</p>
                       <p className="text-sm font-bold text-brand-secondary">TunguMarket (Johan Rodriguez)</p>
                       <p className="text-lg font-black text-brand-secondary">20002648766</p>
                       <p className="text-xs font-bold text-gray-400">Cuenta Corriente | CI: 1850410612</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <h3 className="text-xl font-black text-brand-secondary">Subir Comprobante</h3>
                   <p className="text-sm text-gray-500 font-medium">Es obligatorio subir una foto clara de tu transferencia para procesar el pedido.</p>
                   <div className="relative group">
                      <input 
                        type="file" 
                        accept="image/*,application/pdf"
                        onChange={(e) => setReceipt(e.target.files[0])}
                        className="hidden" 
                        id="receipt-upload"
                      />
                      <label 
                        htmlFor="receipt-upload"
                        className={`w-full h-40 border-4 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-3 cursor-pointer transition-all ${
                          receipt ? 'border-green-400 bg-green-50' : 'border-gray-200 hover:border-brand-primary hover:bg-brand-light/10'
                        }`}
                      >
                         <FontAwesomeIcon icon={receipt ? faCheckCircle : faUpload} className={`text-3xl ${receipt ? 'text-green-500' : 'text-gray-300'}`} />
                         <span className="font-bold text-gray-500">
                           {receipt ? receipt.name : 'Seleccionar Archivo'}
                         </span>
                      </label>
                   </div>
                </div>

                <button 
                  onClick={() => handleCheckout('transferencia')}
                  disabled={!receipt || loading}
                  className="btn-primary w-full py-5 rounded-2xl font-black text-lg disabled:opacity-50 disabled:grayscale transition-all"
                >
                  {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'Finalizar y Enviar Comprobante'}
                </button>
              </motion.div>
            )}

            {paymentMethod === 'tarjeta' && (
              <motion.div 
                key="card" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card p-8"
              >
                <div className="mb-8">
                  <h3 className="text-xl font-black text-brand-secondary">Pago con Tarjeta</h3>
                  <p className="text-sm text-gray-500 font-medium">Simulación de pasarela segura. Aceptamos todas las marcas.</p>
                </div>
                <CreditCardForm 
                  total={totalPrice.toFixed(2)} 
                  onSubmit={() => handleCheckout('tarjeta')} 
                />
              </motion.div>
            )}

            {paymentMethod === 'efectivo' && (
              <motion.div 
                key="cash" 
                initial={{ opacity: 0, y: 20 }} 
                animate={{ opacity: 1, y: 0 }} 
                exit={{ opacity: 0, scale: 0.95 }}
                className="glass-card p-8 space-y-8"
              >
                 <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center text-3xl">
                      <FontAwesomeIcon icon={faMoneyBillWave} />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-brand-secondary">Pago en Efectivo</h3>
                      <p className="text-sm text-gray-500 font-medium italic">Se generará una orden de pago física.</p>
                    </div>
                 </div>

                 <div className="bg-brand-light/30 p-6 rounded-3xl space-y-4">
                    <p className="text-sm text-gray-600 font-medium leading-relaxed">
                      Deberás acercarte a nuestro punto de atención en **Quero, Tungurahua** para realizar el pago.
                    </p>
                    <div className="flex items-center gap-3 text-brand-secondary font-bold">
                       <FontAwesomeIcon icon={faMapMarkerAlt} className="text-red-500" />
                       Oficinas Centrales TunguMarket
                    </div>
                 </div>

                 <button 
                  onClick={() => handleCheckout('efectivo')}
                  disabled={loading}
                  className="btn-primary w-full py-5 rounded-2xl font-black text-lg shadow-xl hover:shadow-2xl transition-all"
                >
                  {loading ? <FontAwesomeIcon icon={faSpinner} className="animate-spin" /> : 'Generar Orden de Pago'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Resumen */}
        <div className="lg:col-span-5">
           <div className="glass-card p-8 sticky top-28 space-y-6">
              <h3 className="text-xl font-black text-brand-secondary">Tu Carrito</h3>
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                {cartItems.map((item) => (
                  <div key={item.product_id} className="flex justify-between items-center bg-white/50 p-3 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100">
                        <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="text-xs">
                        <p className="font-bold text-brand-secondary truncate w-32">{item.title}</p>
                        <p className="text-gray-400">Cant: {item.quantity}</p>
                      </div>
                    </div>
                    <span className="font-black text-brand-secondary text-sm">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-gray-100 space-y-2">
                 <div className="flex justify-between text-gray-500 font-medium">
                   <span>Subtotal</span>
                   <span>${totalPrice.toFixed(2)}</span>
                 </div>
                 <div className="flex justify-between text-gray-500 font-medium">
                   <span>Envío</span>
                   <span className="text-green-500 font-bold">Gratis</span>
                 </div>
                 <div className="flex justify-between items-end pt-4">
                   <span className="font-bold text-brand-secondary">Total a Pagar</span>
                   <span className="text-3xl font-black text-brand-accent">${totalPrice.toFixed(2)}</span>
                 </div>
              </div>

              <div className="bg-amber-50 rounded-2xl p-4 flex gap-3 text-amber-700">
                <FontAwesomeIcon icon={faInfoCircle} className="mt-1 flex-shrink-0" />
                <p className="text-[10px] font-bold leading-tight uppercase tracking-wider">
                  Tu pedido estará bajo protección de TunguMarket hasta que recibas tu producto.
                </p>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Checkout;
