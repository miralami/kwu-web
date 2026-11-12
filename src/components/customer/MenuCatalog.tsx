import React, { useState } from 'react'
import { MenuItem, MenuOption, ProductCategory } from '../../types'
import { Flame, Plus, Sparkles, ArrowRight } from 'lucide-react'

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
      {/* Editorial Headline Section (No Eyebrow, No Gradient Soup) */}
      <section className="bg-surface border border-paper-200 rounded-xl p-5 sm:p-6 shadow-sm">
        <div className="max-w-xl space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-ink-900 tracking-tight leading-tight">
            Jajanan Sunda ✕ Korea & Dessert Dingin
          </h1>
          <p className="text-xs sm:text-sm text-ink-600 leading-relaxed">
            Dibuat fresh setiap hari jualan di kampus Telkom University Jakarta. Gurih pedas
            Cibay dan Spicy Ramyeon Roll, serta penyejuk manis Puding Karamel buah.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={onViewCombo}
              className="min-h-[44px] px-4 rounded-lg bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-[0.98]"
            >
              <span>Paket Combo Hemat (Cibay + Roll)</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-ink-500 font-medium">
              Harga mulai Rp
              {Math.min(...items.flatMap((i) => i.options.map((o) => o.price))).toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </section>

      {/* Scannable Category Selector (No Emojis as Icon System, Min 44px Touch Targets) */}
      <nav className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar" aria-label="Kategori Menu">
        {[
          { id: 'semua', label: 'Semua Menu' },
          { id: 'gurih', label: 'Gurih & Pedas' },
          { id: 'manis', label: 'Dessert Manis' },
          { id: 'combo', label: 'Paket Combo' },
        ].map((tab) => {
          const isActive = activeCategory === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id as ProductCategory)}
              className={`min-h-[44px] px-4 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
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
                {/* Product Photo with Real Aspect Ratio */}
                <div className="relative h-44 w-full bg-paper-100 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.name}
                    width={360}
                    height={176}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />

                  {/* High-contrast accessible badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    {item.spicyLevel && item.spicyLevel > 0 ? (
                      <span className="flex items-center gap-1 text-xs bg-red-700 text-white font-bold px-2 py-0.5 rounded shadow-sm">
                        <Flame className="w-3 h-3" /> Pedas Lv {item.spicyLevel}
                      </span>
                    ) : null}
                    {item.isBestValue && (
                      <span className="text-xs bg-accent-500 text-stone-900 font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Hemat Rp1.000
                      </span>
                    )}
                  </div>

                  {/* Clean Tabular Price Badge */}
                  <div className="absolute bottom-3 right-3 bg-black/80 text-white px-2.5 py-1 rounded text-xs font-extrabold tracking-tight">
                    {item.options.length > 1 ? 'Mulai ' : ''}Rp{minPrice.toLocaleString('id-ID')}
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-4 space-y-1.5">
                  <h2 className="font-bold text-base text-ink-900 tracking-tight">
                    {item.name}
                  </h2>
                  <p className="text-xs text-ink-600 leading-relaxed line-clamp-2">
                    {item.tagline}
                  </p>
                </div>
              </div>

              {/* Action Bar with Compliant Touch Area */}
              <div className="p-4 pt-0 border-t border-paper-100 mt-2 flex items-center justify-between">
                <span className="text-xs text-ink-500 font-medium">
                  {item.options.length > 1 ? `${item.options.length} pilihan porsi` : firstOption.label}
                </span>

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
                  className="min-h-[44px] min-w-[44px] px-3.5 bg-paper-100 hover:bg-brand-600 hover:text-white text-ink-800 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 border border-paper-200"
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
