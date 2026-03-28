import React from 'react';
import Header from './components/Header';
import Hero from './components/Hero';
import Features from './components/Features';
import Categories from './components/Categories';
import Footer from './components/Footer';

function App() {
  return (
    <div className="min-h-screen bg-brand-light flex flex-col font-sans text-brand-dark">
      <Header />
      <main className="flex-grow">
        <Hero />
        <Features />
        <Categories />
      </main>
      <Footer />
    </div>
  );
}

export default App;
