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
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
