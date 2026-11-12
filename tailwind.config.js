/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
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
