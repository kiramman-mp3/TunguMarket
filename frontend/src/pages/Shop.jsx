import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faTimes, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import ProductGrid from '../components/ProductGrid';
import { getAllProducts, searchProducts, getProductsByCategory } from '../api/product';
import { getCategories } from '../api/category';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [productsRes, categoriesRes] = await Promise.all([
        getAllProducts(1, 20),
        getCategories()
      ]);
      setProducts(productsRes.data.products || []);
      setCategories(categoriesRes.data || []);
    } catch (err) {
      setError('No se pudo cargar el catálogo. Intenta de nuevo más tarde.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return fetchInitialData();
    
    try {
      setLoading(true);
      setActiveCategory(null);
      const response = await searchProducts(searchQuery);
      setProducts(response.data.products || []);
    } catch (err) {
      setError('Error en la búsqueda.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = async (category) => {
    try {
      setLoading(true);
      setSearchQuery('');
      if (activeCategory?.id === category.id) {
        setActiveCategory(null);
        await fetchInitialData();
      } else {
        setActiveCategory(category);
        const response = await getProductsByCategory(category.id);
        setProducts(response.data.products || []);
      }
    } catch (err) {
      setError('Error al filtrar por categoría.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light/20 pt-16">
      {/* Header / Search Hero */}
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h1 className="text-4xl font-display font-bold text-brand-secondary mb-2">Marketplace</h1>
              <p className="text-gray-500 font-medium">Encuentra los mejores productos locales de Tungurahua.</p>
            </div>
            
            <form onSubmit={handleSearch} className="relative max-w-md w-full">
              <input 
                type="text"
                placeholder="Buscar pan de pinllo, artesanías..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-100 focus:border-brand-primary focus:outline-none transition-all shadow-sm"
              />
              <FontAwesomeIcon 
                icon={faSearch} 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <button type="submit" className="hidden">Buscar</button>
            </form>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex flex-col lg:flex-row gap-12">
          
          {/* Sidebar / Filters */}
          <aside className="lg:w-64 space-y-8 flex-shrink-0">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-6 flex items-center gap-2">
                <FontAwesomeIcon icon={faFilter} />
                Categorías
              </h3>
              <div className="space-y-2">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all font-medium text-sm group ${
                      activeCategory?.id === cat.id 
                      ? 'bg-brand-primary text-brand-secondary shadow-md font-bold' 
                      : 'bg-white text-gray-600 hover:bg-brand-light hover:text-brand-secondary'
                    }`}
                  >
                    {cat.name}
                    <FontAwesomeIcon 
                      icon={activeCategory?.id === cat.id ? faTimes : faChevronRight} 
                      className={`text-[10px] transition-transform ${activeCategory?.id === cat.id ? '' : 'group-hover:translate-x-1'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter Placeholder */}
            <div className="pt-8 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-6">Rango de Precio</h3>
              <div className="px-2">
                <input type="range" className="w-full accent-brand-primary" min="0" max="1000" />
                <div className="flex justify-between mt-2 text-xs font-bold text-gray-500">
                  <span>$0</span>
                  <span>$1000+</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <main className="flex-grow">
            <div className="flex justify-between items-center mb-8">
              <p className="text-sm font-bold text-gray-500">
                {products.length} {products.length === 1 ? 'producto encontrado' : 'productos encontrados'}
                {activeCategory && <span className="text-brand-primary ml-1">en {activeCategory.name}</span>}
              </p>
            </div>

            {error ? (
              <div className="bg-red-50 text-red-600 p-6 rounded-2xl border border-red-100 font-bold text-center">
                {error}
              </div>
            ) : (
              <ProductGrid products={products} loading={loading} />
            )}
          </main>

        </div>
      </div>
    </div>
  );
};

export default Shop;
