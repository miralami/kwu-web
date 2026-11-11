import React from 'react'
import { ShoppingBag, ShieldCheck } from 'lucide-react'

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
  return (
    <header className="sticky top-0 z-40 bg-[#fcfbf9]/95 backdrop-blur-md border-b border-paper-200">
      {/* Top Notice */}
      <div className="bg-ink-900 text-paper-50 text-xs font-semibold py-2 px-4 text-center">
        PO Batch 1 Dibuka • Kampus Tel-U Jakarta • Ambil di Lantai 3 Gedung B
      </div>

      <div className="max-w-3xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand Logo & Details */}
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="Laris Manis"
            width={40}
            height={40}
            className="w-10 h-10 object-contain rounded-lg border border-paper-200 bg-white p-0.5"
            onError={(e) => {
              ;(e.target as HTMLElement).style.display = 'none'
            }}
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-tight text-ink-900">
                Laris Manis
              </span>
              <span className="text-xs font-bold text-terracotta-700 bg-terracotta-100 px-2 py-0.5 rounded border border-terracotta-200">
                Kelompok 1
              </span>
            </div>
            <p className="text-xs text-ink-600 font-medium">S1SI-KJ-23-002 • Kewirausahaan</p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Admin Toggle */}
          <button
            onClick={onOpenAdmin}
            className={`min-h-[44px] px-3 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
              isAdmin
                ? 'bg-ink-900 text-white'
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
            className="relative min-h-[44px] min-w-[44px] bg-terracotta-600 text-white px-3.5 rounded-lg text-xs font-bold hover:bg-terracotta-700 active:scale-[0.98] transition-all flex items-center gap-2"
            aria-label="Buka Keranjang Pesanan"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden xs:inline">Pesanan</span>
            {cartCount > 0 && (
              <span className="bg-white text-terracotta-700 text-xs font-extrabold px-1.5 py-0.2 rounded-full border border-terracotta-200">
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
