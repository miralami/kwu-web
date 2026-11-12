import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

// Sembunyikan splash screen (lihat index.html) setelah aplikasi tampil.
// Splash ditahan minimal 700 ms sejak halaman dibuka supaya animasinya tidak sekadar berkedip,
// dan menunggu font siap (maks. 1,5 detik) agar teks tidak "loncat" saat splash hilang.
function hideSplash() {
  const splash = document.getElementById('splash')
  if (!splash) return

  const MIN_VISIBLE_MS = 900
  const FONT_TIMEOUT_MS = 1500

  const fontsReady = Promise.race([
    document.fonts?.ready ?? Promise.resolve(),
    new Promise((resolve) => setTimeout(resolve, FONT_TIMEOUT_MS)),
  ])

  fontsReady.then(() => {
    const wait = Math.max(0, MIN_VISIBLE_MS - performance.now())
    setTimeout(() => {
      requestAnimationFrame(() => {
        splash.classList.add('is-hidden')
        // Hapus dari DOM setelah transisi; fallback jika transitionend tidak terpicu
        const remove = () => splash.remove()
        splash.addEventListener('transitionend', remove, { once: true })
        setTimeout(remove, 800)
      })
    }, wait)
  })
}

hideSplash()
