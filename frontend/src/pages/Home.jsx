import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStar, faShoppingBag, faMapMarkerAlt, faTag, faStore } from '@fortawesome/free-solid-svg-icons';
import Hero from '../components/Hero';
import Features from '../components/Features';
import Categories from '../components/Categories';

import { getFeaturedProducts } from '../api/product';
import ProductGrid from '../components/ProductGrid';

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const response = await getFeaturedProducts();
        setFeaturedProducts(response.data || []);
      } catch (err) {
        console.error('Error fetching featured products:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <>
      <Hero />
      
      <section className="py-24 bg-white" id="productos">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 text-center md:text-left">
            <div className="space-y-4">
              <span className="text-brand-primary font-bold uppercase tracking-widest text-xs">Lo mejor de Ambato</span>
              <h2 className="text-4xl font-display font-bold text-brand-secondary">Productos Destacados</h2>
              <p className="text-gray-500 font-medium max-w-lg">
                Descubre la calidad y el sabor de nuestra tierra. Productos directos de emprendedores locales para ti.
              </p>
            </div>
            <Link to="/shop" className="btn-outline flex items-center gap-2 group">
              Ver todo el catálogo
              <FontAwesomeIcon icon={faTag} className="group-hover:scale-110 transition-transform" />
            </Link>
          </div>

          <ProductGrid products={featuredProducts} loading={loading} />
        </div>
      </section>

      <Features />
      <Categories />
    </>
  );
};

export default Home;
