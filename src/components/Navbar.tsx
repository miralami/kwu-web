import React from 'react'
import { ShoppingBag } from 'lucide-react'
import { ADMIN_CONTACT } from '../data/menu'

interface NavbarProps {
  cartCount: number
  onOpenCart: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ cartCount, onOpenCart }) => (
  // Papan header timbul: tepi bawah tebal gelap + bayangan jatuh ke halaman di bawahnya
  <header className="sticky top-0 z-40 bg-royal-600 border-b-[6px] border-royal-900 shadow-[0_10px_16px_-6px_rgb(8_16_48/0.6)]">
    <div className="max-w-xl mx-auto px-3 h-16 flex items-center justify-between">
      {/* Logo: lempeng krem timbul dengan alas tebal */}
      <a
        href="/"
        aria-label="Laris Manis"
        className="shrink-0 min-h-[44px] flex items-center rounded-xl bg-surface px-2.5 shadow-[0_4px_0_rgb(var(--c-paper-400)),0_8px_10px_-2px_rgb(8_16_48/0.45)] active:translate-y-[3px] active:shadow-[0_1px_0_rgb(var(--c-paper-400))] transition-[transform,box-shadow] duration-100"
      >
        <img src="/logo-nav.png" alt="Laris Manis" width={383} height={163} className="h-9 w-auto" />
      </a>

      {/* Kanan: tanya admin (WhatsApp) + keranjang */}
      <div className="flex items-center gap-3">
        <a
          href={`https://wa.me/${ADMIN_CONTACT.phone}?text=${encodeURIComponent('Halo Admin Laris Manis, saya mau tanya...')}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Tanya admin lewat WhatsApp"
          title="Tanya admin lewat WhatsApp"
          className="shrink-0 w-12 h-12 rounded-full bg-[#25D366] border-2 border-[#4be188] flex items-center justify-center shadow-[0_5px_0_#128C7E,0_8px_10px_-2px_rgb(8_16_48/0.45)] active:translate-y-1 active:shadow-[0_1px_0_#128C7E] transition-[transform,box-shadow] duration-100"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-white" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </a>

        {/* Keranjang: tombol merah tebal 3D, jumlahnya di lencana kuning yang melompat saat bertambah */}
        <button
          onClick={onOpenCart}
          data-cart-target
          className="btn-3d min-h-[48px] bg-brand-600 text-white pl-4 pr-2.5 border-2 border-brand-500 flex items-center gap-2.5"
          aria-label={cartCount > 0 ? `Buka keranjang, ${cartCount} item` : 'Buka keranjang'}
        >
          <ShoppingBag className="w-5 h-5" aria-hidden="true" />
          <span
            key={cartCount}
            className="bump min-w-[2rem] h-8 px-2 rounded-full bg-accent-500 text-stone-900 flex items-center justify-center font-display text-lg leading-none tabular-nums shadow-[inset_0_-2px_0_rgb(0_0_0/0.18)]"
          >
            {cartCount}
          </span>
        </button>
      </div>
    </div>
  </header>
)
