import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTrashAlt, 
  faShoppingBag, 
  faMinus, 
  faPlus, 
  faArrowLeft, 
  faCreditCard,
  faShoppingBasket
} from '@fortawesome/free-solid-svg-icons';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, totalItems, totalPrice, updateQuantity, removeFromCart, clearCart, loading } = useCart();

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen pt-24 pb-20 flex flex-col items-center justify-center px-4 bg-brand-light/20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-8"
        >
          <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mx-auto shadow-premium text-brand-primary">
            <FontAwesomeIcon icon={faShoppingBasket} size="3xl" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-display font-black text-brand-secondary">Tu bolsa está vacía</h1>
            <p className="text-gray-500 font-medium max-w-sm mx-auto">Parece que aún no has añadido nada delicioso o asombroso a tu carrito.</p>
          </div>
          <Link to="/shop" className="btn-primary inline-flex items-center gap-3 px-10 py-5 rounded-[1.5rem] font-bold text-lg shadow-xl hover:shadow-2xl transition-all">
            <FontAwesomeIcon icon={faShoppingBag} />
            Empezar a comprar
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-light/20 pt-24 pb-20">
      <div className="max-w-6xl mx-auto px-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
          <div className="space-y-2">
            <button 
              onClick={() => navigate('/shop')}
              className="flex items-center gap-2 text-gray-500 hover:text-brand-primary font-bold transition-colors mb-2"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              Seguir comprando
            </button>
            <h1 className="text-4xl font-display font-black text-brand-secondary">Bolsa de Compras</h1>
            <p className="text-brand-primary font-black uppercase tracking-widest text-[10px]">Tienes {totalItems} items seleccionados</p>
          </div>
          <button 
            onClick={clearCart}
            className="text-red-500 hover:text-red-700 font-bold transition-colors flex items-center gap-2 text-sm"
          >
            <FontAwesomeIcon icon={faTrashAlt} />
            Vaciar Carrito
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Items List */}
          <div className="lg:col-span-8 space-y-4">
            <AnimatePresence>
              {cartItems.map((item) => (
                <motion.div 
                  key={item.id || item.product_id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="glass-card p-4 md:p-6 flex flex-col sm:flex-row items-center gap-6 group hover:border-brand-primary/30 transition-all"
                >
                  <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100 shadow-sm relative">
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                  
                  <div className="flex-grow text-center sm:text-left space-y-1">
                    <Link to={`/product/${item.product_id}`} className="text-lg font-bold text-brand-secondary hover:text-brand-primary transition-colors">
                      {item.title}
                    </Link>
                    <p className="text-sm font-bold text-brand-accent">${parseFloat(item.price).toFixed(2)} c/u</p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
                    {/* Quantity Selector */}
                    <div className="flex items-center bg-gray-50 rounded-xl p-1 border border-gray-100">
                      <button 
                        onClick={async () => {
                          try {
                            await updateQuantity(item.id, item.quantity - 1);
                          } catch (err) {
                            alert(err.message || 'Error al actualizar cantidad');
                          }
                        }}
                        className="w-8 h-8 rounded-lg hover:bg-white transition-colors text-brand-secondary disabled:opacity-30"
                        disabled={item.quantity <= 1}
                      >
                        <FontAwesomeIcon icon={faMinus} size="xs" />
                      </button>
                      <span className="w-8 text-center font-bold text-brand-secondary">{item.quantity}</span>
                      <button 
                        onClick={async () => {
                          try {
                            await updateQuantity(item.id, item.quantity + 1);
                          } catch (err) {
                            alert(err.message || 'Error al actualizar cantidad');
                          }
                        }}
                        className="w-8 h-8 rounded-lg hover:bg-white transition-colors text-brand-secondary"
                      >
                        <FontAwesomeIcon icon={faPlus} size="xs" />
                      </button>
                    </div>

                    <div className="text-right sm:w-24">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-tighter">Subtotal</p>
                      <p className="text-xl font-black text-brand-secondary">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>

                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-2"
                    >
                      <FontAwesomeIcon icon={faTrashAlt} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4">
            <div className="glass-card p-8 space-y-8 sticky top-28">
              <h3 className="text-xl font-black text-brand-secondary">Resumen de Pedido</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Productos ({totalItems})</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Envío (Local)</span>
                  <span className="text-green-500 font-bold">Gratis</span>
                </div>
                <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                  <span className="text-brand-secondary font-bold">Total a pagar</span>
                  <div className="text-right">
                    <p className="text-3xl font-black text-brand-accent">${totalPrice.toFixed(2)}</p>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">IVA Incluido</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button 
                  className="btn-primary w-full py-5 rounded-[1.5rem] font-bold text-lg flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transition-all active:scale-95"
                  onClick={() => alert('¡Implementaremos el flujo de pago pronto!')}
                >
                  <FontAwesomeIcon icon={faCreditCard} />
                  Proceder al Pago
                </button>
                <Link to="/shop" className="block text-center text-sm font-bold text-gray-400 hover:text-brand-primary transition-colors italic">
                  Continuar explorando el mercado
                </Link>
              </div>

              <div className="bg-brand-light/30 rounded-2xl p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-brand-primary flex-shrink-0 shadow-sm border border-brand-primary/10">
                  <FontAwesomeIcon icon={faShoppingBag} />
                </div>
                <p className="text-[10px] font-bold text-brand-secondary/70 uppercase leading-snug">
                  Estás comprando en el marketplace más confiable de la región.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
