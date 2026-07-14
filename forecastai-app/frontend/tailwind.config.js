/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          main: '#FAFAF8',
          section: '#F3F2EF',
          card: '#F6F6F4',
          hover: '#ECECE8',
          active: '#E5E5E0',
        },
        border: {
          DEFAULT: '#D9D9D6',
          card: 'rgba(217, 217, 214, 0.5)',
          divider: '#CFCFCB',
        },
        text: {
          primary: '#111111',
          secondary: '#444444',
          tertiary: '#666666',
          muted: '#777777',
        },
        accent: {
          DEFAULT: '#C8A86B',
          light: '#D9C192',
          dark: '#B8955A',
          glow: 'rgba(200, 168, 107, 0.12)',
          soft: '#AEBBA0',
        },
        dark: {
          100: '#141414',
          200: '#2B2B2B',
          300: '#565650',
          400: '#8A8782',
          500: '#B3B0A9',
          600: '#C9C6BF',
          650: 'rgba(0, 0, 0, 0.08)',
          700: '#DDDDDD',
          800: 'rgba(0, 0, 0, 0.06)',
          900: 'rgba(0, 0, 0, 0.04)',
          950: '#EFEDE6',
        },
        success: {
          DEFAULT: '#4A6B43',
        },
        warning: {
          DEFAULT: '#B7651A',
        },
        error: {
          DEFAULT: '#B23B3B',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'slide-in': 'slideIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'fade-in': 'fadeIn 0.8s ease-out',
        'spin-slow': 'spin 8s linear infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      boxShadow: {
        'sm': '0 2px 8px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'md': '0 8px 24px rgba(0, 0, 0, 0.04), 0 2px 4px rgba(0, 0, 0, 0.02)',
        'lg': '0 16px 48px rgba(0, 0, 0, 0.06), 0 4px 8px rgba(0, 0, 0, 0.02)',
        'card': '0 4px 16px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.04)',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
