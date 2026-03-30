import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faShieldAlt, faStore } from '@fortawesome/free-solid-svg-icons';

const Hero = () => {
  return (
    <section id="inicio" className="relative pt-8 pb-8 lg:pt-12 lg:pb-12 overflow-hidden bg-white">
      {/* Decorative background gradients */}
      <div className="absolute top-0 right-0 -mr-48 -mt-48 w-96 h-96 rounded-full bg-brand-primary/20 blur-3xl opacity-50 mix-blend-multiply pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 -ml-48 -mb-48 w-96 h-96 rounded-full bg-brand-accent/20 blur-3xl opacity-50 mix-blend-multiply pointer-events-none"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">

          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-light text-brand-accent font-semibold text-sm mb-6 border border-brand-accent/10 shadow-sm">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-accent"></span>
              </span>
              El Marketplace #1 de Ambato
            </div>

            <h1 className="text-5xl md:text-6xl font-display font-black text-brand-secondary leading-tight mb-6">
              El placer de <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent">
                comprar local
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-lg">
              Apoya a los pequeños y medianos emprendimientos de Tungurahua.
              Descubre productos únicos, seguros y validados por nuestra comunidad.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <button className="btn-primary flex items-center justify-center gap-2 group text-lg">
                Explorar Productos
                <FontAwesomeIcon icon={faArrowRight} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="btn-outline flex items-center justify-center gap-2 group text-lg bg-white">
                <FontAwesomeIcon icon={faStore} />
                Vender mi producto
              </button>
            </div>

            <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                  <FontAwesomeIcon icon={faShieldAlt} />
                </div>
                <span>Compras Seguras</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <FontAwesomeIcon icon={faStore} />
                </div>
                <span>+500 Emprendedores</span>
              </div>
            </div>
          </motion.div>

          {/* Image/Visual Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] group">
              <div className="absolute inset-0 bg-brand-secondary/10 group-hover:bg-transparent transition-colors duration-500 z-10 w-full h-full"></div>
              <img
                src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1600"
                alt="Mercado de emprendedores locales"
                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-in-out"
              />

              {/* Floating Sales Card */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="absolute bottom-6 left-6 z-20 glass-card p-4 flex items-center gap-4 animate-float"
              >
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white shadow-sm">
                  <img src="../assets/man.png" alt="Usuario" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-xs text-brand-secondary font-bold">¡Compra reciente!</p>
                  <p className="text-xs text-gray-600">Artesanías locales confirmadas.</p>
                </div>
              </motion.div>
            </div>

            {/* Outline accent */}
            <div className="absolute -inset-4 border-2 border-brand-primary/30 rounded-3xl -z-10 translate-x-2 translate-y-2"></div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
