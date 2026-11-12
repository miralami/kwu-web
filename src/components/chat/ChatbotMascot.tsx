import React, { useEffect, useState } from 'react'

const STATIC_SRC = '/chatbot/mascot-static.png' // 3 KB, tampil seketika
const ANIMATED_SRC = '/chatbot/mascot.webp' // awan berkedip (±110 KB), dimuat setelah halaman selesai terbuka

// Status bersama untuk semua maskot di halaman: animasi cukup diunduh sekali
let animatedReady = false
const waiters = new Set<() => void>()

function loadAnimatedOnce() {
  if (animatedReady) return
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion) return // pengguna memilih kurangi animasi: tetap gambar diam

  const start = () => {
    const img = new Image()
    img.onload = () => {
      animatedReady = true
      waiters.forEach((notify) => notify())
      waiters.clear()
    }
    img.src = ANIMATED_SRC
  }
  // Jangan berebut bandwidth dengan pemuatan awal website
  const idle = () =>
    'requestIdleCallback' in window
      ? (window as Window & { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(start)
      : setTimeout(start, 300)
  if (document.readyState === 'complete') idle()
  else window.addEventListener('load', idle, { once: true })
}

// Maskot chatbot di dalam lingkaran putih: karakternya hitam, jadi butuh latar terang
// agar tetap terlihat di mode gelap maupun di header chatbot yang gelap.
export const ChatbotMascot: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => {
  const [animated, setAnimated] = useState(animatedReady)

  useEffect(() => {
    if (animatedReady) return
    const notify = () => setAnimated(true)
    waiters.add(notify)
    loadAnimatedOnce()
    return () => {
      waiters.delete(notify)
    }
  }, [])

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-white ring-1 ring-black/5 overflow-hidden shrink-0 ${className}`}
      aria-hidden="true"
    >
      <img
        src={animated ? ANIMATED_SRC : STATIC_SRC}
        alt=""
        width={96}
        height={96}
        className="w-[115%] h-[115%] max-w-none object-contain"
        draggable={false}
      />
    </span>
  )
}
