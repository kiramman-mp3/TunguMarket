import React from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheckCircle, faLock, faBoxOpen, faUsers } from '@fortawesome/free-solid-svg-icons';

const features = [
  {
    title: 'Transacciones Seguras',
    description: 'Tus datos están protegidos. Sistema robusto de autenticación y sesiones controladas.',
    icon: faLock,
    color: 'text-blue-500',
    bg: 'bg-blue-100',
  },
  {
    title: 'Productos Validados',
    description: 'Cada producto es revisado para asegurar calidad. Bloqueo automático de artículos peligrosos.',
    icon: faCheckCircle,
    color: 'text-brand-primary',
    bg: 'bg-brand-primary/20',
  },
  {
    title: 'Impulso Local',
    description: 'Promovemos el desarrollo económico de Ambato conectando emprendedores con la comunidad.',
    icon: faUsers,
    color: 'text-purple-500',
    bg: 'bg-purple-100',
  },
  {
    title: 'Experiencia Fluida',
    description: 'Gestión de carrito de compras, cálculo automático y métodos de pago flexibles.',
    icon: faBoxOpen,
    color: 'text-brand-accent',
    bg: 'bg-brand-accent/20',
  },
];

const Features = () => {
  return (
    <section id="beneficios" className="py-16 bg-gray-50 border-t border-gray-100 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-brand-accent font-semibold tracking-wide uppercase text-sm mb-3">Compromiso TunguMarket</h2>
          <h3 className="mt-2 text-3xl leading-8 font-black tracking-tight text-brand-secondary sm:text-4xl">
            Comercio Transparente y Confiable
          </h3>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">
            Nuestra plataforma está diseñada con lo último en tecnología y seguridad para que tu única preocupación sea disfrutar de la experiencia.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-shadow duration-300 border border-gray-100 relative group overflow-hidden"
            >
              {/* Highlight effect on hover */}
              <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-brand-primary to-brand-accent scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"></div>
              
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 \${feature.bg} \${feature.color}` }>
                <FontAwesomeIcon icon={feature.icon} className="text-2xl" />
              </div>
              <h4 className="text-xl font-bold text-brand-secondary mb-3">{feature.title}</h4>
              <p className="text-gray-600 leading-relaxed text-sm">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
