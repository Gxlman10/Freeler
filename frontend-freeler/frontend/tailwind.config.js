/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#0077cc',
          600: '#0066b3',
          700: '#005299',
        }
      }
    },
  },
  plugins: [],
}