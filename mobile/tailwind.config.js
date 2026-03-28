/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#fbbf24', // MercadoLibre-like Yellow/Amber
          secondary: '#1e3a8a', // Deep Trust Blue
          accent: '#ea580c', // Bright Orange
          dark: '#0f172a',
          light: '#f8fafc',
        }
      },
    },
  },
  plugins: [],
}
