import { useCallback, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'lm_theme'

function readStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : null
  } catch {
    return null
  }
}

function applyTheme(theme: Theme) {
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

// Tema awal sudah dipasang oleh script di index.html; hook ini membaca & mengubahnya.
// Tanpa pilihan tersimpan, tema mengikuti pengaturan HP dan ikut berubah bila pengaturan itu berubah.
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.classList.contains('dark') ? 'dark' : 'light'
  )

  useEffect(() => {
    const media = window.matchMedia?.('(prefers-color-scheme: dark)')
    if (!media) return
    const onChange = (e: MediaQueryListEvent) => {
      if (readStoredTheme()) return // pengguna sudah memilih sendiri
      const next: Theme = e.matches ? 'dark' : 'light'
      applyTheme(next)
      setTheme(next)
    }
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark'
      applyTheme(next)
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        // Penyimpanan diblokir: tema tetap berlaku sampai halaman ditutup
      }
      return next
    })
  }, [])

  return { theme, toggleTheme }
}
