import React from 'react'
import { MenuItem } from '../../types'
import { Plus, Minus } from 'lucide-react'

interface MenuCatalogProps {
  items: MenuItem[]
  quantities: Record<string, number> // jumlah di keranjang per id menu
  onSelectItem: (item: MenuItem) => void
  onAdd: (item: MenuItem) => void
  onRemove: (item: MenuItem) => void
  header?: React.ReactNode // mis. "Pesanan Saya", tampil di dalam nota
}

const today = new Date().toLocaleDateString('id-ID', {
  day: 'numeric',
  month: 'short',
  timeZone: 'Asia/Jakarta',
})

// Foto menu "terbang" ke karcis keranjang di navbar saat ditambah.
// Dilewati bila pengguna memilih kurangi animasi atau karcis tidak terlihat.
function flyToCart(src: string, from: DOMRect) {
  const target = document.querySelector('[data-cart-target]')
  if (!target || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const to = target.getBoundingClientRect()
  if (to.width === 0) return

  const el = document.createElement('img')
  el.src = src
  el.alt = ''
  Object.assign(el.style, {
    position: 'fixed',
    left: `${from.left}px`,
    top: `${from.top}px`,
    width: `${from.width}px`,
    height: `${from.height}px`,
    zIndex: '60',
    pointerEvents: 'none',
    objectFit: 'cover',
    border: '4px solid #fff',
    boxShadow: '0 12px 22px rgba(8,16,48,0.45)',
    willChange: 'transform',
  })
  document.body.appendChild(el)

  const dx = to.left + to.width / 2 - (from.left + from.width / 2)
  const dy = to.top + to.height / 2 - (from.top + from.height / 2)
  const anim = el.animate(
    [
      { transform: 'translate(0,0) scale(1) rotate(-3deg)', opacity: 1 },
      { transform: `translate(${dx * 0.45}px,${dy * 0.45 - 70}px) scale(0.62) rotate(10deg)`, opacity: 1, offset: 0.45 },
      { transform: `translate(${dx}px,${dy}px) scale(0.1) rotate(24deg)`, opacity: 0.9 },
    ],
    { duration: 720, easing: 'cubic-bezier(0.45, 0, 0.55, 1)' }
  )
  anim.onfinish = anim.oncancel = () => el.remove()
}

// Halaman menu sebagai satu lembar nota warung: baris = menu, kolom "Jml" diisi
// tulisan tangan saat menu ditambah, jumlah dan cap PESAN ada di bar bawah layar.
export const MenuCatalog: React.FC<MenuCatalogProps> = ({
  items,
  quantities,
  onSelectItem,
  onAdd,
  onRemove,
  header,
}) => (
  <div className="nota-stack relative">
    {/* Maskot mengintip dari balik nota */}
    <img
      src="/3-crop.png"
      alt=""
      width={226}
      height={226}
      className="mascot-peek pointer-events-none absolute -top-[2.2rem] left-[42%] z-10 w-14 h-auto"
    />

    <section className="nota relative bg-surface text-ink-900" aria-labelledby="nota-title">
      <div className="nota-holes" aria-hidden="true" />

      <div className="px-4 pt-6 pb-2 flex items-end justify-between gap-3 border-b-[3px] border-double border-royal-600">
        <h1
          id="nota-title"
          className="extrude font-display uppercase text-brand-600 leading-[0.9] text-[clamp(3.2rem,17vw,4.6rem)]"
        >
          Nota
        </h1>
        <div className="text-right pb-1">
          <div className="text-[0.7rem] font-bold text-royal-700 leading-tight">Menu nagih · pre-order</div>
          <div className="font-display text-brand-600 text-lg leading-tight whitespace-nowrap">{today}</div>
        </div>
      </div>

      <div
        className="mt-4 grid grid-cols-[3.25rem_1fr_5.75rem] bg-royal-600 text-white text-[0.7rem] font-extrabold uppercase tracking-wide"
        aria-hidden="true"
      >
        <span className="px-1 py-2 border-r border-white/70 text-center">Jml</span>
        <span className="px-2 py-2 border-r border-white/70">Nama barang</span>
        <span className="px-2 py-2 text-right">Harga (Rp)</span>
      </div>

      <ul className="divide-y-2 divide-royal-600/20">
        {items.map((item, index) => {
          const option = item.options[0]
          const qty = quantities[item.id] ?? 0
          return (
            <li
              key={item.id}
              style={{ ['--i' as string]: index }}
              className="nota-row grid grid-cols-[3.25rem_1fr_5.75rem] items-center min-h-[8.5rem]"
            >
              {/* Jml: tulisan tangan bolpoin biru, muncul seperti sedang ditulis */}
              <div className="text-center" aria-live="polite">
                {qty > 0 && (
                  <span key={qty} className="ink-in handwriting inline-block text-4xl leading-none text-royal-600">
                    {qty}
                    <span className="sr-only"> {qty} di keranjang</span>
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => onSelectItem(item)}
                className="nota-photo-btn flex items-center gap-3 py-3 pr-2 text-left min-w-0"
                aria-label={`${item.name}, buka rincian`}
              >
                <span className="photo-tape relative shrink-0 w-[5.25rem] h-[5.25rem] border-4 border-white bg-paper-100">
                  <img
                    src={item.image}
                    alt=""
                    width={720}
                    height={720}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </span>
                <span className="min-w-0">
                  <span className="block font-extrabold text-[1.05rem] leading-[1.1] text-royal-700">{item.name}</span>
                  <span className="mt-1 block text-xs text-ink-700 leading-snug">{option.label}</span>
                </span>
              </button>

              <div className="pr-3 flex flex-col items-end gap-2">
                <span className="price-ink font-display text-[1.15rem] leading-none text-royal-700 tabular-nums">
                  {option.price.toLocaleString('id-ID')}
                </span>
                <div className="flex items-center">
                  {qty > 0 && (
                    <button
                      type="button"
                      onClick={() => onRemove(item)}
                      className="nota-btn min-h-[44px] min-w-[44px] flex items-center justify-center text-brand-600"
                      aria-label={`Kurangi ${item.name}`}
                    >
                      <Minus className="w-5 h-5" strokeWidth={3} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      const photo = e.currentTarget.closest('li')?.querySelector('.photo-tape')
                      if (photo) flyToCart(item.image, photo.getBoundingClientRect())
                      onAdd(item)
                    }}
                    className="btn-3d min-h-[44px] min-w-[44px] rounded-full flex items-center justify-center bg-brand-600 text-white"
                    aria-label={`Tambah ${item.name}`}
                  >
                    <Plus className="w-5 h-5" strokeWidth={3} />
                  </button>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Riwayat pesanan di bawah daftar menu, setelah garis sobek */}
      {header && <div className="border-t-[3px] border-dashed border-royal-600 px-4 pt-4">{header}</div>}

      <div className="border-t-[3px] border-dashed border-royal-600 px-4 py-4 text-xs text-ink-700">
        Bayar, tunggu sebentar, lalu siap disantap. Terima kasih sudah jajan!
      </div>
    </section>
  </div>
)
