import { createRequire } from 'node:module'
import plugin from 'tailwindcss/plugin'

const require = createRequire(import.meta.url)
const palette = require('./theme.palette.cjs')

const hexToRgb = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`
}
const varName = (group, shade) => `--c-${group}${shade === 'DEFAULT' ? '' : `-${shade}`}`

// Warna Tailwind -> variabel CSS, agar opacity modifier (bg-surface/95) tetap berfungsi
const themeColors = Object.fromEntries(
  Object.entries(palette).map(([group, shades]) => [
    group,
    Object.fromEntries(
      Object.keys(shades).map((shade) => [shade, `rgb(var(${varName(group, shade)}) / <alpha-value>)`])
    ),
  ])
)

// Nilai variabel untuk mode terang (:root) dan gelap (.dark)
const cssVars = (mode) =>
  Object.fromEntries(
    Object.entries(palette).flatMap(([group, shades]) =>
      Object.entries(shades).map(([shade, pair]) => [varName(group, shade), hexToRgb(pair[mode])])
    )
  )

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
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
      colors: themeColors,
      fontFamily: {
        // Judul poster: Archivo ekstra-lebar, tebal. Isi teks tetap Plus Jakarta Sans.
        display: ['Archivo', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    plugin(({ addBase }) => {
      addBase({
        ':root': { ...cssVars(0), colorScheme: 'light' },
        '.dark': { ...cssVars(1), colorScheme: 'dark' },
      })
    }),
  ],
}
