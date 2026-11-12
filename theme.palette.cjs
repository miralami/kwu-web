// Palet warna mode terang & gelap: satu sumber untuk tailwind.config.js dan variabel CSS.
// Format: shade: [warna mode terang, warna mode gelap]
// Komponen cukup memakai class biasa (bg-surface, text-ink-900, ...); warnanya berganti otomatis
// saat <html> diberi kelas "dark".
module.exports = {
  // Latar halaman & kartu (gantikan bg-white). Teks putih di atas tombol tetap pakai text-white.
  surface: { DEFAULT: ['#ffffff', '#171514'] },
  // Header gelap (bukti pesanan, chatbot, dashboard admin): tetap gelap di kedua mode
  inverse: { DEFAULT: ['#1c1917', '#26221f'] },
  paper: {
    50: ['#ffffff', '#1f1c1a'],
    100: ['#f7f5f0', '#282422'],
    200: ['#ede8df', '#36312e'],
    300: ['#ded7c9', '#4a4440'],
    400: ['#c5bbae', '#635c56'],
  },
  ink: {
    900: ['#1c1917', '#f5f2ee'],
    800: ['#292524', '#e6e1db'],
    700: ['#44403c', '#d1cac2'],
    600: ['#57534e', '#b5ada4'],
    500: ['#78716c', '#968e86'],
    400: ['#a8a29e', '#7a726b'],
  },
  // Merah utama #d81616. Di mode gelap sedikit diterangkan agar teks merah tetap terbaca.
  brand: {
    50: ['#fff1f1', '#2b1414'],
    100: ['#ffdfdf', '#3d1919'],
    200: ['#ffc4c4', '#5e2222'],
    500: ['#ee3434', '#f05252'],
    600: ['#d81616', '#e83a3a'],
    700: ['#b31111', '#ef4444'],
    800: ['#941212', '#fca5a5'],
    900: ['#7a1515', '#fecaca'],
  },
  // Kuning aksen #fdb41d: selalu pakai teks gelap tetap (text-stone-900) di atas accent-500
  accent: {
    50: ['#fff9eb', '#2a2110'],
    100: ['#ffefc6', '#3b2d12'],
    200: ['#fedd88', '#5e4717'],
    500: ['#fdb41d', '#fdb41d'],
    600: ['#e1940a', '#e1940a'],
    700: ['#b96f0a', '#fbbf24'],
    900: ['#6e3f10', '#fde68a'],
  },
  // Warna grafik kategori ke-2 (pasangan merah brand). Pasangan merah+biru lolos validator
  // dataviz (buta warna & kontras) di kedua mode; kuning brand terlalu terang untuk isi grafik.
  chart: {
    blue: ['#2a78d6', '#3987e5'],
  },
  // Warna status bawaan Tailwind yang dipakai aplikasi; nilai terang = bawaan Tailwind
  green: {
    50: ['#f0fdf4', '#0f2418'],
    100: ['#dcfce7', '#143020'],
    200: ['#bbf7d0', '#1d4a30'],
    300: ['#86efac', '#2d6a45'],
    600: ['#16a34a', '#16a34a'],
    700: ['#15803d', '#1f9d55'],
    800: ['#166534', '#22a85a'],
    900: ['#14532d', '#86efac'],
    950: ['#052e16', '#bbf7d0'],
  },
  red: {
    50: ['#fef2f2', '#2b1414'],
    100: ['#fee2e2', '#3d1919'],
    200: ['#fecaca', '#5e2222'],
    500: ['#ef4444', '#ef4444'],
    600: ['#dc2626', '#ef4444'],
    700: ['#b91c1c', '#dc2626'],
    800: ['#991b1b', '#fca5a5'],
  },
  amber: {
    50: ['#fffbeb', '#2a2110'],
    100: ['#fef3c7', '#3b2d12'],
    200: ['#fde68a', '#5e4717'],
    900: ['#78350f', '#fcd34d'],
    950: ['#451a03', '#fde68a'],
  },
  blue: {
    100: ['#dbeafe', '#172a46'],
    700: ['#1d4ed8', '#3b82f6'],
    800: ['#1e40af', '#93c5fd'],
  },
}
