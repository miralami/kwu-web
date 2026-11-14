import React, { useState } from 'react'
import { MenuItem, MenuOption } from '../../types'
import { X, Plus, Minus, Check } from 'lucide-react'

interface OptionModalProps {
  item: MenuItem
  onClose: () => void
  onAddToCart: (item: MenuItem, option: MenuOption, quantity: number, notes: string) => void
}

export const OptionModal: React.FC<OptionModalProps> = ({ item, onClose, onAddToCart }) => {
  const [selectedOption, setSelectedOption] = useState<MenuOption>(item.options[0])
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')

  const handleAdd = () => {
    onAddToCart(item, selectedOption, quantity, notes.trim())
    onClose()
  }

  const totalPrice = selectedOption.price * quantity

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="option-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 sm:backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-xl overflow-hidden shadow-xl max-h-[92dvh] flex flex-col border border-paper-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol tutup di pojok kanan atas foto; tetap terlihat saat isi digulir */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full bg-black/55 text-white hover:bg-black/70 backdrop-blur-sm"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Foto 1:1 bersih (tanpa teks/overlay), ikut bergulir bersama isi; tombol bawah tetap terlihat */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="aspect-square w-full bg-paper-100 overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            width={720}
            height={720}
            className="w-full h-full object-cover"
            loading="eager"
          />
        </div>

        <div className="p-4 space-y-4 bg-surface">
          <div className="min-w-0 space-y-1">
            <h2 id="option-modal-title" className="text-lg font-bold leading-tight text-ink-900">
              {item.name}
            </h2>
            <p className="text-sm text-ink-600">{item.tagline}</p>
          </div>

          <p className="text-sm text-ink-700 leading-relaxed">{item.description}</p>

          <div>
            <div id="option-group-label" className="text-sm font-bold text-ink-800 mb-2">
              Pilih Porsi
            </div>
            <div className="space-y-2" role="radiogroup" aria-labelledby="option-group-label">
              {item.options.map((opt) => {
                const isSelected = selectedOption.id === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedOption(opt)}
                    className={`w-full min-h-[48px] flex items-center justify-between px-4 py-3 border text-left transition-colors ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold'
                        : 'border-paper-300 hover:border-ink-500 text-ink-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          isSelected
                            ? 'border-brand-600 bg-brand-600 text-white'
                            : 'border-paper-300'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div>
                        <div className="text-sm">{opt.label}</div>
                        {opt.savings ? (
                          <span className="text-xs text-green-700 font-bold">
                            Hemat Rp{opt.savings.toLocaleString('id-ID')}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-sm font-extrabold text-ink-900 tabular-nums">
                      Rp{opt.price.toLocaleString('id-ID')}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label htmlFor="option-notes" className="block text-sm font-bold text-ink-800 mb-1.5">
              Catatan <span className="font-medium text-ink-600">(opsional)</span>
            </label>
            <input
              id="option-notes"
              type="text"
              enterKeyHint="done"
              placeholder="Contoh: bumbu cabai dipisah"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[48px] px-3.5 border border-paper-300 rounded-lg focus:outline-none focus:border-brand-600 bg-paper-50 text-ink-900 placeholder:text-ink-500"
              maxLength={80}
            />
          </div>
        </div>

        </div>

        {/* Footer Actions (Compliant Touch Targets >= 44px) */}
        <div className="shrink-0 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-paper-200 bg-paper-50 flex items-center gap-3">
          <div className="flex items-center border border-paper-300 rounded-full bg-surface">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-600 hover:text-ink-900 disabled:opacity-30"
              disabled={quantity <= 1}
              aria-label="Kurangi porsi"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-sm font-bold text-ink-900 tabular-nums" aria-live="polite">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-600 hover:text-ink-900"
              aria-label="Tambah porsi"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handleAdd}
            className="flex-1 min-w-0 min-h-[48px] bg-brand-600 text-white py-3 px-4 text-sm font-bold hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-between gap-2"
          >
            <span>Tambah</span>
            <span className="font-extrabold tabular-nums">Rp{totalPrice.toLocaleString('id-ID')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
