/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          DEFAULT: '#6C151E',
          hover: '#541017',
          light: '#881F2A',
          subtle: '#FAF0F1'
        },
        teal: {
          DEFAULT: '#0F3D3A',
          dark: '#0A2927',
          light: '#18534F',
          subtle: '#EDF5F4'
        },
        cream: {
          DEFAULT: '#F5DABF',
          light: '#FBF2E8',
          dark: '#E2C19E',
          muted: '#F8E7D6'
        },
        surface: {
          bg: '#FAF7F2',
          card: '#FFFFFF',
          border: '#E8E1D8'
        },
        ink: {
          primary: '#292524',
          secondary: '#78716C',
          muted: '#A8A29E'
        }
      },
      fontFamily: {
        serif: ['Georgia', 'Cambria', '"Times New Roman"', 'Times', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      }
    },
  },
  plugins: [],
}

