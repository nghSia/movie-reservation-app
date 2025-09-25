module.exports = {
  content: ['./src/**/*.{html,ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#FFF0EC',
          100: '#FFD9D0',
          200: '#FFB5A6',
          300: '#FF907B',
          400: '#FF6B51',
          500: '#FF4C29',
          600: '#E0431F',
          700: '#B33518',
          800: '#862711',
          900: '#5A1A0B',
        },
        secondary: {
          50: '#EEEFF7',
          100: '#C9CBDF',
          200: '#A4A7C7',
          300: '#7F83AF',
          400: '#555889',
          500: '#1B1B3A',
          600: '#161630',
          700: '#111126',
          800: '#0C0C1C',
          900: '#070712',
        },
        accent: {
          50: '#FFF9E6',
          100: '#FFF1BF',
          200: '#FFE78F',
          300: '#FFDD60',
          400: '#FFD43A',
          500: '#FFD369',
          600: '#E6B94F',
          700: '#C89E3E',
          800: '#98772E',
          900: '#6B5321',
        },
        surface: '#F5F5F5',
        ink: {
          light: '#FFFFFF',
          dark: '#1B1B3A',
        },
      },
      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        pill: '9999px',
      },
    },
  },
  plugins: [],
};
