// @type {import('tailwindcss').Config} 
//module.exports = {
//  content: [
//    "./src/**/*.{html,scss,ts}",
//  ],
//  theme: {
//    extend: {},
//  },
//  plugins: [],
//}

// tailwind.config.js
// Coloca este archivo en la raíz del proyecto Angular

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{html,ts}',
  ],
  // ── Safelist ───────────────────────────────────────────────────────────────
  // Las clases usadas dentro de [ngClass] con strings dinámicos (module.status)
  // no son detectadas por el purger de Tailwind en build de producción.
  // Se deben declarar aquí para que no sean eliminadas.
  safelist: [
    // Módulos — fondos y bordes
    'bg-teal-50',  'border-teal-200',
    'bg-blue-50',  'border-blue-200',
    'bg-gray-100', 'border-gray-200',
    // Módulos — textos
    'text-teal-900', 'text-teal-700',
    'text-blue-900', 'text-blue-700',
    // Badges de número
    'bg-teal-700', 'text-teal-50',
    'bg-blue-700', 'text-blue-50',
    'bg-gray-300', 'text-gray-500',
    // Progress bars
    'bg-teal-200', 'bg-blue-200',
    // Subtopic dots
    'bg-gray-200',
    // Opacidad y ring
    'opacity-60', 'opacity-100',
    'ring-2', 'ring-blue-600',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};