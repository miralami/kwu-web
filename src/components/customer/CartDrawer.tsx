import React, { useState } from 'react'
import { CartItem, PaymentMethod } from '../../types'
import { REFERRAL_CODES } from '../../data/menu'
import { X, Trash2, Plus, Minus, Tag, Check, CreditCard, Banknote, ArrowRight } from 'lucide-react'

interface CartDrawerProps {
  isOpen: boolean
  onClose: () => void
  items: CartItem[]
  onUpdateQuantity: (id: string, delta: number) => void
  onRemoveItem: (id: string) => void
  onCheckout: (formData: {
    customerName: string
    customerPhone: string
    customerClass: string
    customerNotes: string
    paymentMethod: PaymentMethod
    referralCode?: string
    discountAmount: number
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
  const [customerClass, setCustomerClass] = useState('S1SI-02')
  const [customerNotes, setCustomerNotes] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qris')
  const [referralInput, setReferralInput] = useState('')
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; discount: number; label: string } | null>(null)
  const [promoError, setPromoError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [formErrors, setFormErrors] = useState<{ name?: string; phone?: string }>({})

  if (!isOpen) return null

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalPieces = items.reduce((sum, item) => sum + item.pieces * item.quantity, 0)
  const discountAmount = appliedPromo ? Math.min(appliedPromo.discount, subtotal) : 0
  const total = Math.max(0, subtotal - discountAmount)

  const handleApplyPromo = () => {
    setPromoError('')
    const cleanCode = referralInput.trim().toUpperCase()
    if (!cleanCode) return

    const promo = REFERRAL_CODES[cleanCode]
    if (promo) {
      setAppliedPromo({
        code: cleanCode,
        discount: promo.discount,
        label: promo.label,
      })
      setReferralInput('')
    } else {
      setPromoError('Kode voucher tidak ditemukan')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
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

    try {
      setIsSubmitting(true)
      setSubmitError('')
      await onCheckout({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerClass: customerClass.trim(),
        customerNotes: customerNotes.trim(),
        paymentMethod,
        referralCode: appliedPromo?.code,
        discountAmount,
      })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Pesanan gagal dikirim. Coba lagi.')
    } finally {
      setIsSubmitting(false)
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

      <div className="fixed inset-y-0 right-0 flex w-full max-w-md pl-3 sm:pl-0">
        <div className="w-full min-w-0 bg-surface shadow-2xl flex flex-col border-l border-paper-200">
          {/* Header */}
          <div className="p-4 border-b border-paper-200 flex items-center justify-between bg-paper-50">
            <div>
              <h2 id="cart-drawer-title" className="font-extrabold text-base text-ink-900">Keranjang Pesanan</h2>
              <p className="text-xs text-ink-500">{items.length} Menu • {totalPieces} Pcs Camilan</p>
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
            <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-5">
              {/* Items List */}
              <div className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
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
                    <div className="shrink-0 flex items-center border border-paper-200 rounded-lg bg-surface">
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

              {/* Promo Section */}
              <div className="bg-paper-50 p-3.5 rounded-lg border border-paper-200 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-ink-800">
                  <Tag className="w-3.5 h-3.5 text-brand-600" />
                  <span>Kode Voucher / Promo</span>
                </div>
                {appliedPromo ? (
                  <div className="flex items-center justify-between bg-surface px-3 py-2 rounded-lg border border-green-300 text-xs">
                    <span className="font-bold text-green-800 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> {appliedPromo.code} - {appliedPromo.label}
                    </span>
                    <button
                      onClick={() => setAppliedPromo(null)}
                      className="text-ink-500 hover:text-ink-900 font-bold ml-2 text-xs min-h-[44px] min-w-[44px] px-2 flex items-center justify-center"
                    >
                      Batal
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="RAWONSETO / LARISMANIS"
                      value={referralInput}
                      onChange={(e) => setReferralInput(e.target.value)}
                      className="flex-1 min-w-0 min-h-[44px] text-xs px-3 bg-surface border border-paper-200 rounded-lg uppercase font-bold tracking-wider"
                    />
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      className="shrink-0 min-h-[44px] bg-ink-900 text-surface text-xs font-bold px-4 rounded-lg hover:bg-ink-800"
                    >
                      Terapkan
                    </button>
                  </div>
                )}
                {promoError && <p className="text-xs text-red-600 font-medium">{promoError}</p>}
              </div>

              {/* Form Input */}
              <form id="checkout-form" onSubmit={handleSubmit} className="space-y-3">
                <label className="text-xs font-bold uppercase tracking-wider text-ink-600">
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
                    Kelas / Lokasi Kampus Tel-U <span className="text-red-600">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: S1SI-02 / Lantai 3 Gedung B"
                    value={customerClass}
                    onChange={(e) => setCustomerClass(e.target.value)}
                    className="w-full min-h-[44px] text-xs px-3 border border-paper-200 rounded-lg focus:outline-none focus:border-brand-600 bg-paper-50"
                  />
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {['S1SI-02', 'Lantai 3 Gedung B', 'Selasar Kelas', 'Gazebo'].map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setCustomerClass(loc)}
                        className={`text-xs px-2 py-1 rounded border font-medium transition-colors ${
                          customerClass === loc
                            ? 'bg-ink-900 text-surface border-ink-900'
                            : 'bg-surface text-ink-600 border-paper-200 hover:bg-paper-100'
                        }`}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
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
                      <span>QRIS Statis</span>
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
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-700 font-semibold">
                    <span>Diskon Promo</span>
                    <span>-Rp{discountAmount.toLocaleString('id-ID')}</span>
                  </div>
                )}
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
    </div>
  )
}
