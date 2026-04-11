import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faFilter, faTimes, faChevronRight, faStar, faShoppingBag } from '@fortawesome/free-solid-svg-icons';
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

  // Effect para el Debounce de la búsqueda live
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setFilters(prev => ({ ...prev, q: searchInput }));
    }, 400); // 400ms para dar tiempo al usuario

    return () => clearTimeout(delayDebounceFn);
  }, [searchInput]);

  // Effect para ejecutar la búsqueda cada vez que cambian los filtros (incluyendo q, categoría, etc.)
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
      
      // Validación de rango de precio: solo enviar si el rango es lógico
      const validatedFilters = { ...currentFilters };
      if (
        validatedFilters.minPrice && 
        validatedFilters.maxPrice && 
        parseFloat(validatedFilters.minPrice) > parseFloat(validatedFilters.maxPrice)
      ) {
        // Si el rango es inválido, ignoramos el filtro de precio para esta búsqueda
        delete validatedFilters.minPrice;
        delete validatedFilters.maxPrice;
      }

      const response = await searchProducts(validatedFilters, 1);
      setProducts(response.data.products || []);
    } catch (err) {
      setError('Error al cargar productos. Intenta de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setFilters(prev => ({ ...prev, q: '' }));
  };

  const handleCategoryClick = (category) => {
    setFilters(prev => ({
      ...prev,
      categoryId: prev.categoryId === category.id ? null : category.id
    }));
  };

  const handlePriceChange = (type, value) => {
    // No permitir números negativos
    if (parseFloat(value) < 0) return;
    setFilters(prev => ({ ...prev, [type]: value }));
  };

  const handleRatingClick = (rating) => {
    setFilters(prev => ({
      ...prev,
      minRating: prev.minRating === rating ? '' : rating
    }));
  };

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Sidebar - Dashboard Style */}
      <aside className="w-full md:w-56 lg:w-64 bg-[#344E95] text-white flex-shrink-0 p-6 pt-24 space-y-10 min-h-screen flex flex-col">
        {/* Search Input In-Sidebar */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100/50">
            <FontAwesomeIcon icon={faSearch} className="mr-2" />
            Búsqueda
          </h3>
          <div className="relative group">
            <div className="relative flex items-center bg-white/10 border border-white/10 rounded-xl transition-all focus-within:border-brand-primary/50 focus-within:bg-white/15 focus-within:ring-0">
              <input
                type="text"
                placeholder="¿Qué buscas?"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-transparent border-none focus:ring-0 outline-none text-white placeholder-blue-100/30 text-xs py-2.5 px-4 font-bold"
              />
              {searchInput && (
                <button
                  onClick={handleClearSearch}
                  className="pr-3 text-blue-300 hover:text-white transition-colors outline-none"
                >
                  <FontAwesomeIcon icon={faTimes} className="text-[10px]" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Categories Section */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100/50">
            <FontAwesomeIcon icon={faFilter} className="mr-2" />
            Categorías
          </h3>
          <div className="space-y-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-all text-xs font-bold group outline-none ${filters.categoryId === cat.id
                  ? 'bg-brand-primary text-brand-secondary shadow-lg'
                  : 'text-blue-50 hover:bg-white/5'
                  }`}
              >
                {cat.name}
                <FontAwesomeIcon
                  icon={filters.categoryId === cat.id ? faTimes : faChevronRight}
                  className={`text-[8px] transition-transform ${filters.categoryId === cat.id ? '' : 'group-hover:translate-x-1 opacity-30'}`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Price Filter */}
        <div className="pt-8 border-t border-white/10 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100/50">Rango Precio</h3>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-blue-200/50 scale-110">$</span>
              <input
                type="number"
                min="0"
                placeholder="Min"
                className="w-full pl-7 pr-2 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:border-brand-primary/50 text-white font-bold transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:bg-white/10"
                value={filters.minPrice}
                onChange={(e) => handlePriceChange('minPrice', e.target.value)}
              />
            </div>
            <span className="text-blue-200/20 font-bold">-</span>
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-blue-200/50 scale-110">$</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                className="w-full pl-7 pr-2 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs outline-none focus:border-brand-primary/50 text-white font-bold transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none focus:bg-white/10"
                value={filters.maxPrice}
                onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
              />
            </div>
          </div>
          {filters.minPrice && filters.maxPrice && parseFloat(filters.minPrice) > parseFloat(filters.maxPrice) && (
            <p className="text-[9px] text-brand-primary font-bold animate-pulse">El mínimo debe ser menor al máximo</p>
          )}
        </div>

        {/* Rating Filter */}
        <div className="pt-8 border-t border-white/10 space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-100/50">Calificación</h3>
          <div className="space-y-1">
            {[4, 3, 2, 1].map(stars => (
              <button
                key={stars}
                onClick={() => handleRatingClick(stars)}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg transition-all text-xs ${filters.minRating === stars ? 'bg-white/20 text-white font-black' : 'text-blue-50/60 hover:text-white hover:bg-white/5'
                  }`}
              >
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map(s => (
                    <FontAwesomeIcon key={s} icon={faStar} className={`text-[10px] ${s <= stars ? "text-brand-primary" : "text-white/10"}`} />
                  ))}
                </div>
                <span className="text-[9px] ml-1 opacity-40">& más</span>
              </button>
            ))}
          </div>
        </div>

        {/* Spacer for bottom alignment */}
        <div className="flex-grow"></div>

        {/* Clear Filters (MOVED TO SIDEBAR) */}
        {(filters.q || filters.categoryId || filters.minPrice || filters.maxPrice || filters.minRating) && (
          <div className="pt-10">
            <button
              onClick={() => {
                setFilters({ q: '', categoryId: null, minPrice: '', maxPrice: '', minRating: '' });
                setSearchInput('');
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-100 text-xs font-black rounded-2xl border border-red-500/20 transition-all uppercase tracking-widest"
            >
              <FontAwesomeIcon icon={faTimes} />
              Limpiar Todo
            </button>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 pt-24 bg-gray-50/50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {/* Header de Resultados - REDISEÑADO */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
            <div className="flex items-center gap-4">
              <div className="w-2 h-10 bg-brand-primary rounded-full shadow-[0_0_15px_rgba(255,184,0,0.5)]"></div>
              <div>
                <h2 className="text-3xl font-display font-black text-brand-secondary leading-none">
                  Los mejores productos de Tungurahua
                </h2>
              </div>
            </div>
          </div>

          {error ? (
            <div className="bg-red-50 text-red-600 p-8 rounded-2xl border border-red-100 font-black text-center shadow-lg">
              {error}
            </div>
          ) : (
            <ProductGrid products={products} loading={loading} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Shop;
