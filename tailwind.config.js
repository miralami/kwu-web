/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        bob: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '25%': { transform: 'translateY(-2px) rotate(-8deg)' },
          '75%': { transform: 'translateY(-2px) rotate(8deg)' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.4)', opacity: '0' },
          '60%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        'status-in': {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        stripes: {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '16px 0' },
        },
        steam: {
          '0%': { transform: 'translateY(3px) scaleY(0.6)', opacity: '0' },
          '25%': { opacity: '1' },
          '100%': { transform: 'translateY(-3.5px) scaleY(1.1)', opacity: '0' },
        },
        lid: {
          '0%, 100%': { transform: 'translateY(0) rotate(0deg)' },
          '15%': { transform: 'translateY(-1.8px) rotate(-9deg)' },
          '30%': { transform: 'translateY(0) rotate(0deg)' },
          '50%': { transform: 'translateY(-1.8px) rotate(9deg)' },
          '65%': { transform: 'translateY(0) rotate(0deg)' },
        },
        boil: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-0.5px)' },
          '75%': { transform: 'translateX(0.5px)' },
        },
      },
      animation: {
        bob: 'bob 1.2s ease-in-out infinite',
        'spin-slow': 'spin 3s linear infinite',
        'pop-in': 'pop-in 0.45s ease-out both',
        'status-in': 'status-in 0.4s ease-out both',
        stripes: 'stripes 0.6s linear infinite',
        steam: 'steam 1.35s ease-out infinite both',
        lid: 'lid 1s ease-in-out infinite',
        boil: 'boil 0.25s linear infinite',
        'spin-tick': 'spin 2.4s steps(12) infinite',
      },
      colors: {
        paper: {
          50: '#ffffff',
          100: '#f7f5f0',
          200: '#ede8df',
          300: '#ded7c9',
          400: '#c5bbae',
        },
        ink: {
          900: '#1c1917',
          800: '#292524',
          700: '#44403c',
          600: '#57534e',
          500: '#78716c',
        },
        // Warna utama: merah #d81616 (teks putih di atasnya: kontras 5.2:1)
        brand: {
          50: '#fff1f1',
          100: '#ffdfdf',
          200: '#ffc4c4',
          500: '#ee3434',
          600: '#d81616',
          700: '#b31111',
          800: '#941212',
          900: '#7a1515',
        },
        // Aksen: kuning #fdb41d. Selalu pakai teks gelap (ink-900) di atasnya,
        // jangan dipakai sebagai warna teks di latar putih (kontras hanya 1.8:1)
        accent: {
          50: '#fff9eb',
          100: '#ffefc6',
          200: '#fedd88',
          500: '#fdb41d',
          600: '#e1940a',
          700: '#b96f0a',
          900: '#6e3f10',
        },
      },
    },
  },
  plugins: [],
}
