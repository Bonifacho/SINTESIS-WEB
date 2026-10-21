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
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          DEFAULT: '#4f46e5', // Indigo-600 (Teacher Brand)
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        secondary: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          DEFAULT: '#d97706', // Amber-600 (Admin Brand & Highlights)
          600: '#d97706',
          700: '#b45309',
        },
        accent: {
          50: '#ecfdf5',
          100: '#d1fae5',
          500: '#10b981',
          DEFAULT: '#10b981', // Emerald-500 (OVAs & Success)
          600: '#059669',
        },
        dark: "#0f172a",
        surface: "#ffffff",
        canvas: "#f8fafc",
      }
    },
  },
  plugins: [],
}
