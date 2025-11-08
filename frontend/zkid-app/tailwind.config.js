/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6d6cff',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#5457d9',
          700: '#4f46e5',
          800: '#4338ca',
          900: '#3730a3',
        },
        neon: {
          cyan: '#00E5FF',
          pink: '#FF4FD8',
          lime: '#D7FF3C',
          purple: '#A78BFA',
        },
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        glow: '0 0 20px rgba(99, 102, 241, 0.5)',
        "inner-glow": 'inset 0 0 20px rgba(99, 102, 241, 0.35)',
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        shine: 'shine 8s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        shine: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'ui-sans-serif', 'system-ui'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      container: {
        center: true,
        padding: {
          DEFAULT: '1rem',
          sm: '1.5rem',
          lg: '2rem',
          xl: '2.5rem',
        },
        screens: {
          '2xl': '1200px',
        },
      },
    },
  },
  plugins: [
    require('tailwindcss-animate'),
  ],
}
