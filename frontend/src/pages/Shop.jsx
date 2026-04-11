import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faTimes, faChevronRight, faStar } from '@fortawesome/free-solid-svg-icons';
import ProductGrid from '../components/ProductGrid';
import { getCategories } from '../api/category';
import { searchProducts } from '../api/product';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filtros de busqueda facetada
  const [filters, setFilters] = useState({
    q: '',
    categoryId: null,
    minPrice: '',
    maxPrice: '',
    minRating: ''
  });

  // Para el input que no se ha "sometido" aun
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Effect para ejecutar la busqueda cada vez que cambian los filtros
  useEffect(() => {
    executeSearch(filters);
  }, [filters]);

  const fetchInitialData = async () => {
    try {
      const categoriesRes = await getCategories();
      setCategories(categoriesRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const executeSearch = async (currentFilters) => {
    try {
      setLoading(true);
      setError(null);
      const response = await searchProducts(currentFilters, 1);
      setProducts(response.data.products || []);
    } catch (err) {
      setError('Error al cargar productos. Intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, q: searchInput }));
  };

  const handleCategoryClick = (category) => {
    setFilters(prev => ({ 
      ...prev, 
      categoryId: prev.categoryId === category.id ? null : category.id 
    }));
  };

  const handlePriceChange = (type, value) => {
    setFilters(prev => ({ ...prev, [type]: value }));
  };

  const handleRatingClick = (rating) => {
    setFilters(prev => ({ 
      ...prev, 
      minRating: prev.minRating === rating ? '' : rating 
    }));
  };

  return (
    <div className="min-h-screen bg-brand-light/20 pt-16">
      {/* Header / Search Hero */}
      <section className="bg-white border-b border-gray-100 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <div>
              <h1 className="text-4xl font-display font-bold text-brand-secondary mb-2">Marketplace</h1>
              <p className="text-gray-500 font-medium">Búsqueda Avanzada</p>
            </div>
            
            <form onSubmit={handleSearchSubmit} className="relative max-w-md w-full">
              <input 
                type="text"
                placeholder="Buscar pan de pinllo, artesanías..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
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
                      filters.categoryId === cat.id 
                      ? 'bg-brand-primary text-brand-secondary shadow-md font-bold' 
                      : 'bg-white text-gray-600 hover:bg-brand-light hover:text-brand-secondary'
                    }`}
                  >
                    {cat.name}
                    <FontAwesomeIcon 
                      icon={filters.categoryId === cat.id ? faTimes : faChevronRight} 
                      className={`text-[10px] transition-transform ${filters.categoryId === cat.id ? '' : 'group-hover:translate-x-1'}`}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Price Filter */}
            <div className="pt-8 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-6">Rango de Precio ($)</h3>
              <div className="flex items-center gap-4">
                <input 
                  type="number" 
                  placeholder="Min" 
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-primary"
                  value={filters.minPrice}
                  onChange={(e) => handlePriceChange('minPrice', e.target.value)}
                />
                <span className="text-gray-400 font-bold">-</span>
                <input 
                  type="number" 
                  placeholder="Max" 
                  className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm outline-none focus:border-brand-primary"
                  value={filters.maxPrice}
                  onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
                />
              </div>
            </div>

            {/* Rating Filter */}
            <div className="pt-8 border-t border-gray-100">
              <h3 className="text-xs font-bold uppercase tracking-widest text-brand-primary mb-6">Calificación (Estrellas)</h3>
              <div className="space-y-3">
                {[4, 3, 2, 1].map(stars => (
                  <button 
                    key={stars}
                    onClick={() => handleRatingClick(stars)}
                    className={`flex items-center gap-2 w-full px-4 py-2 rounded-xl transition-all ${
                      filters.minRating === stars ? 'bg-brand-secondary text-brand-primary font-bold shadow-md' : 'hover:bg-white text-gray-500'
                    }`}
                  >
                    <div className="flex gap-1 text-sm">
                      {[1, 2, 3, 4, 5].map(s => (
                        <FontAwesomeIcon key={s} icon={faStar} className={s <= stars ? "text-brand-primary" : "text-gray-300"} />
                      ))}
                    </div>
                    <span className="text-xs">& Más</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Product Grid Area */}
          <main className="flex-grow">
            <div className="flex justify-between items-center mb-8">
              <p className="text-sm font-bold text-gray-500">
                {products.length} {products.length === 1 ? 'producto encontrado' : 'productos encontrados'}
                {filters.categoryId && <span className="text-brand-primary ml-1">filtrados</span>}
              </p>
              
              {/* Clear filters trigger */}
              {(filters.q || filters.categoryId || filters.minPrice || filters.maxPrice || filters.minRating) && (
                <button 
                  onClick={() => {
                    setFilters({ q: '', categoryId: null, minPrice: '', maxPrice: '', minRating: '' });
                    setSearchInput('');
                  }}
                  className="text-xs font-bold text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-lg"
                >
                  Limpiar Filtros
                </button>
              )}
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
