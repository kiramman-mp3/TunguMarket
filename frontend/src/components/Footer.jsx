import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebookF, faTwitter, faInstagram, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { faShoppingBag } from '@fortawesome/free-solid-svg-icons';

const Footer = () => {
  return (
    <footer className="bg-brand-secondary text-brand-light pt-12 pb-8 border-t border-brand-secondary">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Info */}
          <div className="col-span-1 lg:col-span-1 flex flex-col items-start text-left">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-brand-primary rounded-md flex items-center justify-center shadow-lg shadow-brand-primary/20">
                <FontAwesomeIcon icon={faShoppingBag} className="text-brand-secondary text-sm" />
              </div>
              <span className="font-display font-bold text-2xl text-white tracking-tight">
                TunguMarket
              </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-6">
              El Marketplace #1 de la provincia de Tungurahua. Conectando a los mejores emprendedores de Ambato con una comunidad que apoya lo local.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-brand-primary hover:text-brand-secondary flex items-center justify-center transition-all duration-300">
                <FontAwesomeIcon icon={faFacebookF} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-brand-primary hover:text-brand-secondary flex items-center justify-center transition-all duration-300">
                <FontAwesomeIcon icon={faTwitter} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-brand-primary hover:text-brand-secondary flex items-center justify-center transition-all duration-300">
                <FontAwesomeIcon icon={faInstagram} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/10 hover:bg-brand-primary hover:text-brand-secondary flex items-center justify-center transition-all duration-300">
                <FontAwesomeIcon icon={faWhatsapp} />
              </a>
            </div>
          </div>

          {/* Links 1 */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6 uppercase tracking-wider text-xs">Descubrir</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="#" className="hover:text-brand-primary transition-colors">Productos Destacados</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">Nuevos Emprendedores</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">Ofertas Especiales</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">Categorías</a></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6 uppercase tracking-wider text-xs">Para Emprendedores</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="#" className="hover:text-brand-primary transition-colors">Vender en TunguMarket</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">Políticas de Venta</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">Gestión de Cuentas</a></li>
              <li><a href="#" className="hover:text-brand-primary transition-colors">Soporte Técnico</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-bold text-white mb-6 uppercase tracking-wider text-xs">Contacto y Soporte</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><span className="block text-white font-medium mb-1">Centro de Ayuda</span> soporte@tungumarket.com</li>
              <li><span className="block text-white font-medium mb-1">Ubicación Central</span> Ambato, Tungurahua, Ecuador</li>
            </ul>
            <div className="mt-6 flex flex-col gap-2">
              <button className="bg-white/10 border border-white/20 hover:bg-white/20 text-white font-medium py-2 px-4 rounded-lg w-full text-sm transition-all text-left flex justify-between items-center group">
                Contáctanos 
                <span className="bg-brand-primary text-brand-secondary w-6 h-6 rounded flex items-center justify-center group-hover:scale-110 transition-transform">→</span>
              </button>
            </div>
          </div>

        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>&copy; {new Date().getFullYear()} TunguMarket. Todos los derechos reservados.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Términos de Servicio</a>
            <a href="#" className="hover:text-white transition-colors">Privacidad</a>
            <a href="#" className="hover:text-white transition-colors">Seguridad</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
