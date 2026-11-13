import React, { useState } from 'react'
import { MenuItem, MenuOption } from '../../types'
import { X, Plus, Minus, Check, Flame } from 'lucide-react'

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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-xl overflow-hidden shadow-xl max-h-[90vh] flex flex-col border border-paper-200"
        onClick={(e) => e.stopPropagation()}
      >
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
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h2 id="option-modal-title" className="text-lg font-bold leading-tight text-ink-900">
                {item.name}
              </h2>
              <p className="text-xs text-ink-600">{item.tagline}</p>
              {item.spicyLevel && item.spicyLevel > 0 ? (
                <span className="inline-flex items-center gap-1 text-xs bg-red-700 text-white font-bold px-2 py-0.5 rounded-full">
                  <Flame className="w-3 h-3" /> Pedas Lv {item.spicyLevel}
                </span>
              ) : null}
            </div>
            <button
              onClick={onClose}
              className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center bg-paper-100 text-ink-700 hover:bg-paper-200"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-xs text-ink-600 leading-relaxed bg-paper-50 p-3 rounded-lg border border-paper-200">
            {item.description}
          </p>

          <div>
            <label className="block text-xs font-bold text-ink-800 mb-2">
              Pilih Porsi
            </label>
            <div className="space-y-2">
              {item.options.map((opt) => {
                const isSelected = selectedOption.id === opt.id
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedOption(opt)}
                    className={`w-full min-h-[48px] flex items-center justify-between p-3 rounded-lg border text-left transition-colors ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50 text-brand-900 font-bold'
                        : 'border-paper-200 hover:border-paper-300 text-ink-800'
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
                        <div className="text-xs sm:text-sm">{opt.label}</div>
                        {opt.savings ? (
                          <span className="text-xs text-green-700 font-bold">
                            Hemat Rp{opt.savings.toLocaleString('id-ID')}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="text-xs sm:text-sm font-extrabold text-ink-900">
                      Rp{opt.price.toLocaleString('id-ID')}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-ink-800 mb-1">
              Catatan Khusus (Opsional)
            </label>
            <input
              type="text"
              placeholder="Contoh: Bumbu cabai dipisah, tidak terlalu pedas"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full min-h-[44px] text-xs px-3 border border-paper-200 rounded-lg focus:outline-none focus:border-brand-600 bg-paper-50"
              maxLength={80}
            />
          </div>
        </div>

        </div>

        {/* Footer Actions (Compliant Touch Targets >= 44px) */}
        <div className="p-4 border-t border-paper-200 bg-paper-50 flex items-center gap-3">
          <div className="flex items-center border border-paper-200 rounded-full bg-surface">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-600 hover:text-ink-900 disabled:opacity-30"
              disabled={quantity <= 1}
              aria-label="Kurangi porsi"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center text-xs sm:text-sm font-bold text-ink-900">
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
            className="flex-1 min-h-[48px] bg-brand-600 text-white py-3 px-4 rounded-lg text-xs sm:text-sm font-bold hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-between"
          >
            <span>Tambah ke Pesanan</span>
            <span className="font-extrabold">Rp{totalPrice.toLocaleString('id-ID')}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
