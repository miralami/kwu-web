import React from 'react'
import { ShoppingBag, ShieldCheck, Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

interface NavbarProps {
  cartCount: number
  onOpenCart: () => void
  onOpenAdmin: () => void
  isAdmin: boolean
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  onOpenAdmin,
  isAdmin,
}) => {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-paper-200">
      {/* Top Notice */}
      <div className="bg-brand-600 text-white text-xs font-semibold py-2 px-4 text-center">
        PO Batch 1 Dibuka • Kampus Tel-U Jakarta • Ambil di Lantai 3 Gedung B
      </div>

      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo & Details */}
        <div className="flex items-center gap-3 min-w-0">
          <img
            src="/logo.png"
            alt="Laris Manis"
            width={40}
            height={40}
            className="w-10 h-10 shrink-0 object-contain rounded-lg border border-paper-200 bg-white p-0.5"
            onError={(e) => {
              ;(e.target as HTMLElement).style.display = 'none'
            }}
          />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-ink-900 whitespace-nowrap">
                Laris Manis
              </span>
              {/* Disembunyikan di HP agar navbar tidak sesak; info kelompok tetap ada di baris bawah */}
              <span className="hidden sm:inline text-xs font-bold text-brand-700 bg-brand-100 px-2 py-0.5 rounded border border-brand-200 whitespace-nowrap">
                Kelompok 1
              </span>
            </div>
            <p className="text-xs text-ink-600 font-medium truncate">S1SI-KJ-23-002 • Kewirausahaan</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg bg-paper-100 text-ink-700 hover:bg-paper-200 border border-paper-200 transition-colors"
            aria-label={isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
            title={isDark ? 'Mode terang' : 'Mode gelap'}
          >
            {/* key: ikon diputar masuk setiap kali tema berganti */}
            <span key={theme} className="motion-safe:animate-pop-in">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </span>
          </button>

          {/* Admin Toggle */}
          <button
            onClick={onOpenAdmin}
            className={`min-h-[44px] px-3 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              isAdmin
                ? 'bg-ink-900 text-surface'
                : 'bg-paper-100 text-ink-700 hover:bg-paper-200 border border-paper-200'
            }`}
            aria-label="Panel Admin Tim"
          >
            <ShieldCheck className="w-4 h-4" />
            <span className="hidden sm:inline">{isAdmin ? 'Mode Tim' : 'Kasir Tim'}</span>
          </button>

          {/* Cart Trigger */}
          <button
            onClick={onOpenCart}
            className="relative min-h-[44px] min-w-[44px] bg-brand-600 text-white px-3.5 rounded-lg text-xs font-bold hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center gap-2"
            aria-label="Buka Keranjang Pesanan"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Keranjang</span>
            {cartCount > 0 && (
              <span className="bg-white text-brand-700 text-xs font-extrabold px-1.5 py-0.2 rounded-full border border-brand-200">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
