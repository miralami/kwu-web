import React, { useRef, useState } from 'react'
import { CartItem } from '../../types'
import { X, Trash2, Plus, Minus, QrCode, ArrowRight } from 'lucide-react'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  onUpdateQuantity: (id: string, delta: number) => void
  onSetQuantity: (id: string, quantity: number) => void
  onRemoveItem: (id: string) => void
  onCheckout: (formData: {
    customerName: string
    customerPhone: string
    customerNotes: string
  }) => Promise<void> | void
}

const MAX_QTY = 99

// Isian jumlah yang bisa diketik. Selama mengetik boleh kosong; saat selesai (blur)
// nilai yang tidak valid dikembalikan ke jumlah terakhir, bukan menghapus item.
const QtyInput: React.FC<{ value: number; label: string; onCommit: (n: number) => void }> = ({
  value,
  label,
  onCommit,
}) => {
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <input
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      aria-label={label}
      value={draft ?? String(value)}
      onFocus={(e) => e.currentTarget.select()}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '').slice(0, 2)
        setDraft(digits)
        const n = parseInt(digits, 10)
        if (n >= 1 && n <= MAX_QTY) onCommit(n)
      }}
      onBlur={() => setDraft(null)}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className="w-12 min-h-[44px] text-center text-base font-extrabold text-ink-900 tabular-nums bg-transparent focus:outline-none focus:bg-paper-100"
    />
  )
}

const inputClass = (hasError: boolean) =>
  `w-full min-h-[48px] px-3.5 border rounded-lg focus:outline-none bg-paper-50 text-ink-900 placeholder:text-ink-500 ${
    hasError ? 'border-red-600 focus:border-red-700' : 'border-paper-300 focus:border-brand-600'
  }`

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onSetQuantity,
  onRemoveItem,
  onCheckout,
}) => {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string }>({})
  const nameRef = useRef<HTMLInputElement>(null)
  const phoneRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalPieces = items.reduce((sum, item) => sum + item.pieces * item.quantity, 0)

  // Tombol "Pesan Sekarang": validasi form lalu minta konfirmasi dulu sebelum pesanan dikirim
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    const errors: { name?: string; phone?: string } = {}
    if (!customerName.trim()) {
      errors.name = 'Nama wajib diisi'
    }
    const cleanPhone = customerPhone.replace(/\D/g, '')
    if (!cleanPhone || cleanPhone.length < 9 || cleanPhone.length > 15) {
      errors.phone = 'Nomor WhatsApp belum benar. Contoh: 08123456789'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      // Fokus ke isian pertama yang salah: di HP form bisa sedang tergulir di luar layar
      ;(errors.name ? nameRef : phoneRef).current?.focus()
      return
    }
    setFormErrors({})
    setSubmitError('')
    setShowConfirm(true)
  }

  const handleConfirmedCheckout = async () => {
    if (isSubmitting) return
    try {
      setIsSubmitting(true)
      setSubmitError('')
      await onCheckout({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerNotes: customerNotes.trim(),
      })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Pesanan gagal dikirim. Coba lagi.')
    } finally {
      setIsSubmitting(false)
      setShowConfirm(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-drawer-title"
      className="fixed inset-0 z-50 overflow-hidden"
    >
      {/* Backdrop: hanya terlihat di layar lebar (di HP drawer menutup seluruh layar) */}
      <div className="absolute inset-0 bg-black/60 sm:backdrop-blur-sm" onClick={onClose} />

      <div className="fixed inset-0 sm:inset-y-0 sm:left-auto sm:right-0 flex w-full sm:max-w-md">
        <div className="w-full h-[100dvh] min-w-0 bg-surface shadow-2xl flex flex-col sm:border-l border-paper-200">
          {/* Header */}
          <div className="shrink-0 pl-4 pr-2 py-2 border-b border-paper-200 flex items-center justify-between">
            <div>
              <h2 id="cart-drawer-title" className="font-extrabold text-lg leading-tight text-ink-900">
                Pesananmu
              </h2>
              {items.length > 0 && (
                <p className="text-xs text-ink-600">
                  {items.length} menu • {totalPieces} pcs
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="min-h-[48px] min-w-[48px] flex items-center justify-center text-ink-700 hover:text-ink-900"
              aria-label="Tutup keranjang"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <h3 className="font-bold text-base text-ink-900">Keranjang masih kosong</h3>
              <p className="text-sm text-ink-600 max-w-xs">
                Pilih Mozzarella Sunda, Spicy Ramyeon Roll, atau Puding dulu, nanti muncul di sini.
              </p>
              <button
                onClick={onClose}
                className="min-h-[48px] px-5 bg-ink-900 text-surface text-sm font-bold"
              >
                Lihat Menu
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-4 pt-1 pb-4 space-y-6">
              {/* Items List */}
              <ul className="divide-y divide-paper-200 border-b border-paper-200">
                {items.map((item) => (
                  <li key={item.id} className="py-3 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-sm leading-snug text-ink-900">{item.name}</div>
                        <div className="text-xs text-ink-600">{item.optionLabel}</div>
                        {item.notes && (
                          <div className="text-xs text-brand-700 italic break-words">"{item.notes}"</div>
                        )}
                      </div>
                      <div className="shrink-0 text-sm font-extrabold text-ink-900 tabular-nums">
                        Rp{(item.price * item.quantity).toLocaleString('id-ID')}
                      </div>
                    </div>

                    {/* Hapus terpisah di kiri; jumlah di kanan bisa diketik atau diubah +/- */}
                    <div className="flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="min-h-[44px] pr-3 flex items-center gap-1.5 text-sm font-bold text-ink-600 hover:text-red-700"
                        aria-label={`Hapus ${item.name} dari keranjang`}
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Hapus</span>
                      </button>

                      <div className="flex items-center border border-paper-300 rounded-full bg-surface">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          disabled={item.quantity <= 1}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-700 hover:text-ink-900 disabled:opacity-30"
                          aria-label={`Kurangi ${item.name}`}
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <QtyInput
                          value={item.quantity}
                          label={`Jumlah ${item.name}`}
                          onCommit={(n) => onSetQuantity(item.id, n)}
                        />
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          disabled={item.quantity >= MAX_QTY}
                          className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-700 hover:text-ink-900 disabled:opacity-30"
                          aria-label={`Tambah ${item.name}`}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Form Input */}
              <form id="checkout-form" onSubmit={handleSubmit} noValidate className="space-y-4">
                <h3 className="text-base font-extrabold text-ink-900">Data pemesan</h3>

                <div>
                  <label htmlFor="checkout-name" className="block text-sm font-bold text-ink-800 mb-1.5">
                    Nama
                  </label>
                  <input
                    id="checkout-name"
                    ref={nameRef}
                    type="text"
                    required
                    autoComplete="name"
                    autoCapitalize="words"
                    enterKeyHint="next"
                    placeholder="Nama kamu"
                    value={customerName}
                    aria-invalid={!!formErrors.name}
                    aria-describedby={formErrors.name ? 'checkout-name-error' : undefined}
                    onChange={(e) => {
                      setCustomerName(e.target.value)
                      if (formErrors.name) setFormErrors((p) => ({ ...p, name: undefined }))
                    }}
                    className={inputClass(!!formErrors.name)}
                  />
                  {formErrors.name && (
                    <p id="checkout-name-error" className="text-sm text-red-700 font-semibold mt-1.5">
                      {formErrors.name}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="checkout-phone" className="block text-sm font-bold text-ink-800 mb-1.5">
                    No. WhatsApp
                  </label>
                  <input
                    id="checkout-phone"
                    ref={phoneRef}
                    type="tel"
                    required
                    inputMode="tel"
                    autoComplete="tel"
                    enterKeyHint="next"
                    placeholder="0812xxxxxxxx"
                    value={customerPhone}
                    aria-invalid={!!formErrors.phone}
                    aria-describedby={formErrors.phone ? 'checkout-phone-error' : 'checkout-phone-hint'}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value)
                      if (formErrors.phone) setFormErrors((p) => ({ ...p, phone: undefined }))
                    }}
                    className={inputClass(!!formErrors.phone)}
                  />
                  {formErrors.phone ? (
                    <p id="checkout-phone-error" className="text-sm text-red-700 font-semibold mt-1.5">
                      {formErrors.phone}
                    </p>
                  ) : (
                    <p id="checkout-phone-hint" className="text-xs text-ink-600 mt-1.5">
                      Dipakai admin untuk mengabari pesananmu.
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="checkout-notes" className="block text-sm font-bold text-ink-800 mb-1.5">
                    Catatan <span className="font-medium text-ink-600">(opsional)</span>
                  </label>
                  <input
                    id="checkout-notes"
                    type="text"
                    enterKeyHint="done"
                    maxLength={120}
                    placeholder="Contoh: ambil pas istirahat jam 12.00"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className={inputClass(false)}
                  />
                </div>

                <p className="flex items-start gap-2.5 text-sm text-ink-700">
                  <QrCode className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    <strong className="text-ink-900">Bayar pakai QRIS.</strong> Kodenya muncul setelah
                    pesanan dikirim, bisa dibayar dari m-Banking atau e-Wallet apa saja.
                  </span>
                </p>
              </form>
            </div>
          )}

          {/* Footer Summary & Checkout */}
          {items.length > 0 && (
            <div className="shrink-0 px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-paper-200 bg-paper-50 space-y-3">
              <div className="flex items-baseline justify-between font-extrabold text-ink-900">
                <span className="text-sm">Total</span>
                <span className="text-xl text-brand-600 tabular-nums">
                  Rp{total.toLocaleString('id-ID')}
                </span>
              </div>

              {submitError && (
                <p role="alert" className="text-sm font-bold text-red-800 bg-red-50 border border-red-200 rounded-lg p-3">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                className="w-full min-h-[52px] bg-brand-600 text-white px-4 text-base font-extrabold hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Mengirim pesanan...' : 'Pesan Sekarang'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Konfirmasi sebelum pesanan dikirim: lembar bawah di HP, kartu tengah di layar lebar */}
      {showConfirm && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-checkout-title"
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 sm:p-4"
          onClick={() => !isSubmitting && setShowConfirm(false)}
        >
          <div
            className="w-full sm:max-w-sm bg-surface rounded-t-2xl sm:rounded-2xl shadow-2xl border border-paper-200 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <h3 id="confirm-checkout-title" className="text-lg font-extrabold text-ink-900">
                Kirim pesanan sekarang?
              </h3>
              <p className="text-sm text-ink-600">
                Pesanan yang sudah dikirim tidak bisa diubah dari sini.
              </p>
            </div>

            <dl className="border-y border-paper-200 py-3 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-600">Nama</dt>
                <dd className="font-bold text-ink-900 text-right break-words min-w-0">{customerName.trim()}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-600">WhatsApp</dt>
                <dd className="font-bold text-ink-900 tabular-nums">{customerPhone.trim()}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-600">Pesanan</dt>
                <dd className="font-bold text-ink-900">{items.length} menu • {totalPieces} pcs</dd>
              </div>
              <div className="flex justify-between gap-3 text-base">
                <dt className="font-extrabold text-ink-900">Total bayar (QRIS)</dt>
                <dd className="font-extrabold text-brand-600 tabular-nums">Rp{total.toLocaleString('id-ID')}</dd>
              </div>
            </dl>

            <p className="text-sm text-ink-600">
              QRIS langsung muncul setelah ini. Pesanan mulai dimasak setelah pembayaranmu dikonfirmasi
              admin.
            </p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
                className="min-h-[52px] border border-paper-300 bg-surface text-ink-800 text-sm font-bold hover:bg-paper-100 disabled:opacity-50"
              >
                Periksa Lagi
              </button>
              <button
                type="button"
                onClick={handleConfirmedCheckout}
                disabled={isSubmitting}
                className="min-h-[52px] bg-brand-600 text-white text-sm font-extrabold hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Mengirim...' : 'Ya, Pesan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
