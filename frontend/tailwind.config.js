/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#EEF4FF',
          100: '#D9E8FF',
          200: '#BCCFFD',
          300: '#91ADFA',
          400: '#6385F5',
          500: '#3D5FED',
          600: '#2643E0',
          700: '#1C33CC',
          800: '#1B2EA5',
          900: '#1B2C83',
          950: '#141C52',
        },
        lab: {
          50:  '#F0FAFB',
          100: '#D9F2F5',
          200: '#B7E6EB',
          300: '#84D2DC',
          400: '#49B5C6',
          500: '#2D97AA',
          600: '#27798F',
          700: '#266475',
          800: '#265461',
          900: '#234553',
        },
      },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['Syne', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
