/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#fbbf24', // MercadoLibre-like Yellow/Amber
          secondary: '#1e3a8a', // Deep Trust Blue
          accent: '#ea580c', // Bright Orange for specific buttons
          dark: '#0f172a', // Text Dark
          light: '#f8fafc', // Background Light
          border: '#e2e8f0', // Default Border
          muted: '#64748b',  // Muted Text
          success: '#10b981', // Green
          error: '#ef4444',   // Red
        }
      },
      boxShadow: {
        'premium': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'brand': '0 10px 15px -3px rgba(30, 58, 138, 0.1), 0 4px 6px -2px rgba(30, 58, 138, 0.05)',
        'brand-hover': '0 20px 25px -5px rgba(30, 58, 138, 0.2), 0 10px 10px -5px rgba(30, 58, 138, 0.1)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
