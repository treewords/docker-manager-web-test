/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode using a class
  theme: {
    extend: {
      colors: {
        'primary': '#4F46E5',
        'secondary': '#10B981',
        'background': '#F9FAFB',
        'text-primary': '#1F2937',
        'text-secondary': '#6B7280',
        'dark-primary': '#6366F1',
        'dark-secondary': '#34D399',
        'dark-background': '#111827',
        'dark-surface': '#1F2937',
        'dark-text-primary': '#F9FAFB',
        'dark-text-secondary': '#9CA3AF',
      },
    },
  },
  plugins: [],
}