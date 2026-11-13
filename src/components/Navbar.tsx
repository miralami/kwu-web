import React from 'react'
import { ShoppingBag, Moon, Sun } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'

interface NavbarProps {
  cartCount: number
  onOpenCart: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ cartCount, onOpenCart }) => {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <header className="sticky top-0 z-40 bg-surface/95 backdrop-blur-md border-b border-paper-200">
      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo sudah memuat tulisan "laris manis"; versi gelap memakai teks terang */}
        <a href="/" aria-label="Laris Manis" className="shrink-0">
          <img src="/logo-nav.png" alt="Laris Manis" width={383} height={163} className="h-10 w-auto dark:hidden" />
          <img src="/logo-nav-dark.png" alt="Laris Manis" width={383} height={163} className="h-10 w-auto hidden dark:block" />
        </a>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleTheme}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-700 hover:bg-paper-100 transition-colors"
            aria-label={isDark ? 'Ganti ke mode terang' : 'Ganti ke mode gelap'}
            title={isDark ? 'Mode terang' : 'Mode gelap'}
          >
            <span key={theme} className="motion-safe:animate-pop-in">
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </span>
          </button>

          <button
            onClick={onOpenCart}
            className="relative min-h-[44px] min-w-[44px] bg-brand-600 text-white px-4 text-xs font-bold hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center gap-2"
            aria-label="Buka keranjang"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Keranjang</span>
            {cartCount > 0 && (
              <span className="bg-accent-500 text-stone-900 text-xs font-extrabold min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
