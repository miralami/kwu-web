import React from 'react'
import { ShoppingBag } from 'lucide-react'

interface NavbarProps {
  cartCount: number
  onOpenCart: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ cartCount, onOpenCart }) => (
  <header className="sticky top-0 z-40 bg-royal-600">
    <div className="max-w-xl mx-auto px-3 h-16 flex items-center justify-between">
      <a href="/" aria-label="Laris Manis" className="shrink-0 min-h-[44px] flex items-center rounded-xl bg-surface px-2.5">
        <img src="/logo-nav.png" alt="Laris Manis" width={383} height={163} className="h-9 w-auto" />
      </a>

      {/* Karcis keranjang: kotak putus-putus miring, angkanya melompat saat bertambah */}
      <button
        onClick={onOpenCart}
        data-cart-target
        className="btn-card stamp-btn rotate-3 min-h-[48px] min-w-[48px] bg-surface text-brand-600 px-3.5 border-2 border-dashed border-royal-600 outline outline-2 outline-surface flex items-center gap-2"
        aria-label={cartCount > 0 ? `Buka keranjang, ${cartCount} item` : 'Buka keranjang'}
      >
        <ShoppingBag className="w-5 h-5" />
        <span key={cartCount} className="bump font-display text-xl leading-none tabular-nums">
          {cartCount}
        </span>
      </button>
    </div>
  </header>
)
