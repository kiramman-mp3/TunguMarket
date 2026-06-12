import React from 'react';
import Header from './Header';
import Footer from './Footer';
import { useNotifications } from '../hooks/useNotifications';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell } from '@fortawesome/free-solid-svg-icons';

const Layout = ({ children }) => {
  const { newNotification } = useNotifications();

  return (
    <div className="min-h-screen bg-brand-light flex flex-col font-sans text-brand-dark overflow-x-hidden">
      <Header />
      
      {/* Global Real-time Toast */}
      <AnimatePresence>
        {newNotification && (
          <motion.div 
            initial={{ opacity: 0, y: -100, x: '-50%' }}
            animate={{ opacity: 1, y: 20, x: '-50%' }}
            exit={{ opacity: 0, y: -100, x: '-50%' }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-4 flex items-center gap-4 border border-brand-primary/30 backdrop-blur-md bg-white/90">
              <div className="w-12 h-12 bg-brand-primary/20 rounded-xl flex items-center justify-center text-brand-secondary text-xl">
                <FontAwesomeIcon icon={faBell} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-brand-secondary text-sm">{newNotification.title}</h4>
                <p className="text-xs text-gray-500 line-clamp-2">{newNotification.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-grow pt-16">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout;
