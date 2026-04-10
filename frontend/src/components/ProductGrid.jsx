import React from 'react';
import ProductCard from './ProductCard';
import { motion, AnimatePresence } from 'framer-motion';

const ProductGrid = ({ products, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="glass-card h-[400px] animate-pulse bg-gray-50 border border-gray-100 rounded-2xl">
            <div className="aspect-[4/3] bg-gray-200 rounded-t-2xl"></div>
            <div className="p-6 space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-10 bg-gray-200 rounded mt-4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-bold text-brand-secondary">No encontramos productos</h3>
        <p className="text-gray-500 mt-2">Prueba ajustando tus filtros o busca algo diferente.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      <AnimatePresence>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </AnimatePresence>
    </div>
  );
};

export default ProductGrid;
