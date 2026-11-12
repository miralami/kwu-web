import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

declare global {
  interface Window {
    __splashReady?: () => void // disediakan oleh script loading screen di index.html
  }
}

// Beri tahu loading screen (index.html) bahwa aplikasi sudah tampil. Loading screen yang mengatur
// sisanya: menuntaskan progress ke 100%, durasi minimal tampil, lalu memudar.
// Tunggu font aplikasi siap (maks. 1,5 detik) agar teks tidak "loncat" saat loading screen hilang.
const FONT_TIMEOUT_MS = 1500
Promise.race([
  document.fonts?.ready ?? Promise.resolve(),
  new Promise((resolve) => setTimeout(resolve, FONT_TIMEOUT_MS)),
]).then(() => requestAnimationFrame(() => window.__splashReady?.()))
