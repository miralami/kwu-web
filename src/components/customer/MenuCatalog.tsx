import React, { useState } from 'react'
import { MenuItem, MenuOption, ProductCategory } from '../../types'
import { Flame, Plus, Sparkles, ArrowRight } from 'lucide-react'
import { SectionDivider } from '../SectionDivider'

interface MenuCatalogProps {
  items: MenuItem[]
  onSelectItem: (item: MenuItem) => void
  onQuickAdd: (item: MenuItem, option: MenuOption) => void
  onViewCombo: () => void
}

export const MenuCatalog: React.FC<MenuCatalogProps> = ({
  items,
  onSelectItem,
  onQuickAdd,
  onViewCombo,
}) => {
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('semua')

  const filteredItems = items.filter((item) => {
    if (activeCategory === 'semua') return true
    return item.category === activeCategory
  })

  return (
    <div className="space-y-6">
      {/* Hero dengan grid garis tipis yang memudar ke tepi */}
      <section className="relative isolate pt-2 pb-1 flex flex-col-reverse sm:flex-row sm:items-center gap-4 sm:gap-8">
        <div aria-hidden="true" className="hero-grid pointer-events-none absolute -inset-x-4 -top-6 -bottom-4 -z-10" />
        <div className="flex-1 space-y-3">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight leading-tight">
            Jajanan Sunda
            {/* Tanda silang: dua goresan melengkung warna brand (merah + kuning) */}
            <svg
              viewBox="0 0 24 24"
              aria-label="x"
              role="img"
              className="inline-block w-[0.72em] h-[0.72em] mx-[0.28em] align-[-0.02em] -rotate-6"
            >
              <path d="M5 5 C 10 9, 14 14, 19 19" fill="none" strokeWidth="3.6" strokeLinecap="round" className="stroke-brand-600" />
              <path d="M19 5 C 14 8, 10 15, 5 19" fill="none" strokeWidth="3.6" strokeLinecap="round" className="stroke-accent-500" />
            </svg>
            Korea
          </h1>
          <p className="text-sm text-ink-600 leading-relaxed">
            Dibuat fresh setiap hari jualan di kampus Telkom University Jakarta. Gurih pedas Cibay dan
            Spicy Ramyeon Roll, serta penyejuk manis Puding Karamel buah.
          </p>
          <button
            onClick={onViewCombo}
            className="min-h-[44px] px-5 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 active:scale-[0.98]"
          >
            <span>Coba paket combo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <img
          src="/3-crop.png"
          alt=""
          width={226}
          height={226}
          className="w-28 sm:w-56 h-auto shrink-0 self-center"
        />
      </section>

      {/* Pembatas tipis hero -> menu */}
      <SectionDivider className="pt-2" />

      {/* Scannable Category Selector (No Emojis as Icon System, Min 44px Touch Targets) */}
      <nav className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar" aria-label="Kategori Menu">
        {[
          { id: 'semua', label: 'Semua' },
          { id: 'gurih', label: 'Gurih' },
          { id: 'manis', label: 'Manis' },
          { id: 'combo', label: 'Combo' },
        ].map((tab) => {
          const isActive = activeCategory === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as ProductCategory)}
              className={`min-h-[44px] px-4 text-xs font-bold whitespace-nowrap transition-all border ${
                isActive
                  ? 'bg-ink-900 text-surface border-ink-900'
                  : 'bg-surface text-ink-600 hover:bg-paper-100 border-paper-200'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </nav>

      {/* Product List Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredItems.map((item) => {
          const minPrice = Math.min(...item.options.map((o) => o.price))
          const firstOption = item.options[0]

          return (
            <article
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelectItem(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onSelectItem(item)
                }
              }}
              className="bg-surface border border-paper-200 rounded-xl overflow-hidden shadow-sm hover:border-paper-300 transition-all cursor-pointer flex flex-col justify-between focus:outline-none focus:ring-2 focus:ring-brand-600"
            >
              <div>
                {/* Foto produk 1:1 */}
                <div className="relative aspect-square w-full bg-paper-100 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    width={720}
                    height={720}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* High-contrast accessible badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {item.spicyLevel && item.spicyLevel > 0 ? (
                      <span className="flex items-center gap-1 text-xs bg-red-700 text-white font-bold px-2 py-0.5 rounded-full shadow-sm">
                        <Flame className="w-3 h-3" /> Pedas Lv {item.spicyLevel}
                      </span>
                    ) : null}
                    {item.isBestValue && (
                      <span className="text-xs bg-accent-500 text-stone-900 font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Hemat Rp1.000
                      </span>
                    )}
                  </div>

                </div>

                {/* Content Details */}
                <div className="p-4 space-y-1.5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-bold text-base text-ink-900 tracking-tight">
                      {item.name}
                    </h2>
                    <div className="shrink-0 text-right text-lg leading-tight font-extrabold text-brand-600 tracking-tight">
                      {item.options.length > 1 && <span className="block text-xs font-semibold text-ink-500">Mulai</span>}
                      Rp{minPrice.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <p className="text-xs text-ink-500 font-medium">
                    {item.options.length > 1 ? `${item.options.length} pilihan porsi` : firstOption.label}
                  </p>
                  <p className="text-xs text-ink-600 leading-relaxed line-clamp-2">
                    {item.tagline}
                  </p>
                </div>
              </div>

              <div className="p-4 pt-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (item.options.length === 1) {
                      onQuickAdd(item, firstOption)
                    } else {
                      onSelectItem(item)
                    }
                  }}
                  className="w-full min-h-[44px] px-4 bg-paper-100 hover:bg-brand-600 hover:text-white text-ink-800 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>{item.options.length > 1 ? 'Pilih Porsi' : 'Tambah'}</span>
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
