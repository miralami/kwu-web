import React, { useState } from 'react'
import { CartItem, PaymentMethod } from '../../types'
import { X, Trash2, Plus, Minus, CreditCard, Banknote, ArrowRight } from 'lucide-react'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  onUpdateQuantity: (id: string, delta: number) => void
  onRemoveItem: (id: string) => void
  onCheckout: (formData: {
    customerName: string
    customerPhone: string
    customerNotes: string
    paymentMethod: PaymentMethod
  }) => Promise<void> | void
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}) => {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerNotes, setCustomerNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qris')
  const [showConfirm, setShowConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string }>({})

  if (!isOpen) return null

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalPieces = items.reduce((sum, item) => sum + item.pieces * item.quantity, 0)
  const total = subtotal

  // Tombol "Konfirmasi Pre-Order": validasi form lalu minta konfirmasi dulu sebelum pesanan dikirim
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return

    const errors: { name?: string; phone?: string } = {}
    if (!customerName.trim()) {
      errors.name = 'Nama lengkap wajib diisi'
    }
    const cleanPhone = customerPhone.replace(/\D/g, '')
    if (!cleanPhone || cleanPhone.length < 9 || cleanPhone.length > 15) {
      errors.phone = 'Nomor WhatsApp tidak valid (contoh: 08123456789)'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
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
        paymentMethod,
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
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-0 sm:inset-y-0 sm:left-auto sm:right-0 flex w-full sm:max-w-md">
        <div className="w-full h-[100dvh] min-w-0 bg-surface shadow-2xl flex flex-col sm:border-l border-paper-200">
          {/* Header */}
          <div className="p-4 border-b border-paper-200 flex items-center justify-between bg-paper-50">
            <div>
              <h2 id="cart-drawer-title" className="font-extrabold text-base text-ink-900">Keranjang Pesanan</h2>
              <p className="text-xs text-ink-500">{items.length} menu • {totalPieces} pcs</p>
            </div>
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-600 hover:text-ink-900 rounded-lg"
              aria-label="Tutup Keranjang"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <h3 className="font-bold text-base text-ink-900">Keranjang Masih Kosong</h3>
              <p className="text-xs text-ink-500 max-w-xs">
                Pilih menu Cibay gurih, Spicy Ramyeon Roll, atau Puding Segar terlebih dahulu.
              </p>
              <button
                onClick={onClose}
                className="min-h-[44px] px-4 bg-ink-900 text-surface text-xs font-bold rounded-lg"
              >
                Kembali ke Menu
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-4 space-y-5">
              {/* Items List */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-ink-600">
                  Daftar Pilihan Menu
                </label>
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-paper-50 rounded-lg border border-paper-200 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs sm:text-sm text-ink-900 truncate">
                        {item.name}
                      </div>
                      <div className="text-xs text-ink-500">{item.optionLabel}</div>
                      {item.notes && (
                        <div className="text-xs text-brand-700 italic truncate">
                          "{item.notes}"
                        </div>
                      )}
                      <div className="text-xs font-extrabold text-ink-900 mt-1">
                        Rp{(item.price * item.quantity).toLocaleString('id-ID')}
                      </div>
                    </div>

                    {/* Stepper with >= 44px hit targets */}
                    <div className="shrink-0 flex items-center border border-paper-200 rounded-full bg-surface">
                      <button
                        onClick={() => onUpdateQuantity(item.id, -1)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-600 hover:text-ink-900"
                        aria-label="Kurangi jumlah"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-7 text-center text-xs font-bold text-ink-900">{item.quantity}</span>
                      <button
                        onClick={() => onUpdateQuantity(item.id, 1)}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-600 hover:text-ink-900"
                        aria-label="Tambah jumlah"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(item.id)}
                      className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-400 hover:text-red-700"
                      aria-label="Hapus item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Form Input */}
              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-3">
                <label className="text-xs font-bold text-ink-600">
                  Data Pemesan
                </label>

                <div>
                  <label className="block text-xs font-bold text-ink-800 mb-1">
                    Nama Lengkap <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama pemesan"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value)
                      if (formErrors.name) setFormErrors((p) => ({ ...p, name: undefined }))
                    }}
                    className={`w-full min-h-[44px] text-xs px-3 border rounded-lg focus:outline-none bg-paper-50 ${
                      formErrors.name ? 'border-red-500 focus:border-red-600' : 'border-paper-200 focus:border-brand-600'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="text-xs text-red-600 font-medium mt-1">{formErrors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-800 mb-1">
                    No. WhatsApp Aktif <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0812xxxxxxx (untuk konfirmasi)"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value)
                      if (formErrors.phone) setFormErrors((p) => ({ ...p, phone: undefined }))
                    }}
                    className={`w-full min-h-[44px] text-xs px-3 border rounded-lg focus:outline-none bg-paper-50 ${
                      formErrors.phone ? 'border-red-500 focus:border-red-600' : 'border-paper-200 focus:border-brand-600'
                    }`}
                  />
                  {formErrors.phone && (
                    <p className="text-xs text-red-600 font-medium mt-1">{formErrors.phone}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-800 mb-1">
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('qris')}
                      className={`min-h-[48px] p-2.5 rounded-lg border flex items-center gap-2 text-xs font-bold transition-all ${
                        paymentMethod === 'qris'
                          ? 'border-brand-600 bg-brand-50 text-brand-900'
                          : 'border-paper-200 bg-surface text-ink-700 hover:bg-paper-50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-brand-600" />
                      <span>Qris</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('tunai')}
                      className={`min-h-[48px] p-2.5 rounded-lg border flex items-center gap-2 text-xs font-bold transition-all ${
                        paymentMethod === 'tunai'
                          ? 'border-brand-600 bg-brand-50 text-brand-900'
                          : 'border-paper-200 bg-surface text-ink-700 hover:bg-paper-50'
                      }`}
                    >
                      <Banknote className="w-4 h-4 text-green-700" />
                      <span>Tunai di Tempat</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-ink-800 mb-1">
                    Catatan Pesanan (Opsional)
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Ambil pas istirahat jam 12.00"
                    value={customerNotes}
                    onChange={(e) => setCustomerNotes(e.target.value)}
                    className="w-full min-h-[44px] text-xs px-3 border border-paper-200 rounded-lg focus:outline-none focus:border-brand-600 bg-paper-50"
                  />
                </div>
              </form>
            </div>
          )}

          {/* Footer Summary & Checkout */}
          {items.length > 0 && (
            <div className="p-4 border-t border-paper-200 bg-paper-50 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-ink-500">
                  <span>Subtotal</span>
                  <span>Rp{subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-ink-900 pt-1 border-t border-paper-200">
                  <span>Total Tagihan</span>
                  <span className="text-brand-600">Rp{total.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {submitError && (
                <p role="alert" className="text-xs font-bold text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                className="w-full min-h-[50px] bg-brand-600 text-white py-3.5 px-4 rounded-lg text-sm font-extrabold hover:bg-brand-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{isSubmitting ? 'Memproses Pesanan...' : 'Konfirmasi Pre-Order'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Konfirmasi sebelum pesanan dikirim */}
      {showConfirm && (
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-checkout-title"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => !isSubmitting && setShowConfirm(false)}
        >
          <div
            className="w-full max-w-sm bg-surface rounded-2xl shadow-2xl border border-paper-200 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-1">
              <h3 id="confirm-checkout-title" className="text-base font-extrabold text-ink-900">
                Kirim pesanan sekarang?
              </h3>
              <p className="text-xs text-ink-600">
                Pastikan data di bawah sudah benar. Pesanan yang sudah dikirim tidak bisa diubah dari sini.
              </p>
            </div>

            <dl className="bg-paper-50 border border-paper-200 rounded-lg p-3 space-y-1.5 text-xs">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Nama</dt>
                <dd className="font-bold text-ink-900 text-right break-words min-w-0">{customerName.trim()}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">WhatsApp</dt>
                <dd className="font-bold text-ink-900">{customerPhone.trim()}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Pesanan</dt>
                <dd className="font-bold text-ink-900">{items.length} menu • {totalPieces} pcs</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-500">Pembayaran</dt>
                <dd className="font-bold text-ink-900">{paymentMethod === 'qris' ? 'QRIS' : 'Tunai di tempat'}</dd>
              </div>
              <div className="flex justify-between gap-3 pt-1.5 border-t border-paper-200 text-sm">
                <dt className="font-extrabold text-ink-900">Total</dt>
                <dd className="font-extrabold text-brand-600">Rp{total.toLocaleString('id-ID')}</dd>
              </div>
            </dl>

            {paymentMethod === 'qris' && (
              <p className="text-xs text-ink-600">
                Setelah dikirim, QRIS akan muncul dan harus dibayar dalam 15 menit.
              </p>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isSubmitting}
                className="min-h-[48px] rounded-lg border border-paper-200 bg-surface text-ink-800 text-xs font-bold hover:bg-paper-100 disabled:opacity-50"
              >
                Periksa Lagi
              </button>
              <button
                type="button"
                onClick={handleConfirmedCheckout}
                disabled={isSubmitting}
                className="min-h-[48px] rounded-lg bg-brand-600 text-white text-xs font-extrabold hover:bg-brand-700 active:scale-[0.98] transition-all disabled:opacity-50"
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
