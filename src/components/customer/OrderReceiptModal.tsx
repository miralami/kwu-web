import React, { useState } from 'react'
import { Order } from '../../types'
import { ADMIN_CONTACT } from '../../data/menu'
import { canCustomerCancel, getCustomerStatus, isOrderActive } from '../../data/orderStatus'
import { OrderStatusStepper } from './OrderStatusStepper'

const STAMP_TONE: Record<string, string> = {
  waiting: 'text-royal-700 border-royal-700',
  cooking: 'text-brand-600 border-brand-600',
  ready: 'text-green-700 border-green-700',
  done: 'text-ink-700 border-ink-700',
  problem: 'text-red-700 border-red-700',
}
import { X, Download, Copy, CheckCircle2, Send } from 'lucide-react'

interface OrderReceiptModalProps {
  order: Order | null
  onClose: () => void
  onCancel: (orderId: string) => Promise<void>
}

const rupiah = (n: number) => `Rp${n.toLocaleString('id-ID')}`

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({ order, onClose, onCancel }) => {
  const [copied, setCopied] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)
  const [cancelError, setCancelError] = useState('')

  if (!order) return null

  const status = getCustomerStatus(order)
  // QRIS disembunyikan setelah pembayaran diverifikasi admin atau pesanan berakhir
  const showPayment =
    order.paymentMethod === 'qris' && order.paymentStatus !== 'verified' && isOrderActive(order)

  const handleCopyAmount = async () => {
    try {
      await navigator.clipboard.writeText(order.total.toString())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard diblokir browser: nominal tetap terbaca di layar
    }
  }

  const handleCancel = async () => {
    if (isCancelling) return
    try {
      setIsCancelling(true)
      setCancelError('')
      await onCancel(order.id)
      setConfirmCancel(false)
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Pesanan gagal dibatalkan. Coba lagi.')
    } finally {
      setIsCancelling(false)
    }
  }

  const itemsText = order.items
    .map((i) => `• ${i.name} (${i.optionLabel}) x${i.quantity} = ${rupiah(i.price * i.quantity)}`)
    .join('\n')

  const waMessage = encodeURIComponent(
    `Halo Admin Laris Manis! 🙌\nSaya mau konfirmasi pesanan PO:\n\n*ID Pesanan: #${order.id}*\nNama: ${order.customerName}\n${order.customerClass ? `Kelas/Lokasi: ${order.customerClass}\n` : ''}Metode: ${order.paymentMethod.toUpperCase()}\nTotal: *${rupiah(order.total)}*\n\n*Detail Menu:*\n${itemsText}\n\nCatatan: ${order.customerNotes || '-'}\n\nMohon dicek ya min, terima kasih!`
  )

  const waLink = `https://wa.me/${ADMIN_CONTACT.phone}?text=${waMessage}`

  const handleDownloadQris = () => {
    const link = document.createElement('a')
    link.download = `QRIS-LarisManis-${order.id}.png`
    link.href = ADMIN_CONTACT.qrisImage
    link.click()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="receipt-modal-title"
      className="fixed inset-0 z-50 bg-black/70 sm:backdrop-blur-sm sm:flex sm:items-center sm:justify-center sm:p-4 sm:overflow-y-auto"
    >
      {/* HP: layar penuh. Layar lebar (sm+): kartu di tengah */}
      <div className="relative w-full h-full sm:h-auto sm:max-w-lg flex flex-col bg-surface sm:rounded-xl shadow-2xl overflow-hidden sm:my-6 sm:border border-paper-200">
        {/* Receipt Header */}
        <div className="shrink-0 bg-inverse text-white pl-4 pr-2 pb-3 pt-[max(0.75rem,env(safe-area-inset-top))] flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 id="receipt-modal-title" className="text-lg font-extrabold leading-tight tabular-nums">
              Pesanan #{order.id}
            </h2>
            <p className="text-sm text-stone-300 truncate">
              {order.customerName}
              {order.customerClass ? ` • ${order.customerClass}` : ''}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 min-h-[48px] min-w-[48px] flex items-center justify-center text-stone-300 hover:text-white"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-4 sm:p-5 space-y-5 flex-1 min-h-0 sm:flex-none sm:max-h-[75vh] overflow-y-auto overscroll-contain bg-surface">
          {/* Status pesanan */}
          <section aria-label="Status pesanan">
            <OrderStatusStepper order={order} />

            <div key={status.label} role="status" className="mt-5">
              {/* Cap status: dihentak turun setiap status berganti (key memutar ulang animasi) */}
              <span
                className={`stamp stamp-in inline-block border-4 border-double px-4 py-1.5 font-display uppercase text-xl leading-tight ${STAMP_TONE[status.tone]}`}
              >
                {status.label}
              </span>
              <p className="mt-3 text-sm text-ink-800">{status.message}</p>
            </div>
            {isOrderActive(order) && (
              <p className="mt-2 text-xs text-ink-600">
                Status berubah otomatis. Buka lagi kapan saja lewat <strong>Pesanan Saya</strong> di
                halaman menu.
              </p>
            )}
          </section>

          {/* Pembayaran QRIS. Urutan mengikuti cara bayar di satu HP: nominal, simpan gambar, baru gambar QR */}
          {showPayment && (
            <section aria-labelledby="pay-title" className="border-t border-paper-200 pt-5 space-y-4">
              <div className="flex items-end justify-between gap-3">
                <div className="min-w-0">
                  <h3 id="pay-title" className="text-sm font-bold text-ink-700">
                    Bayar tepat sejumlah
                  </h3>
                  <div className="text-3xl leading-tight font-extrabold text-brand-600 tabular-nums">
                    {rupiah(order.total)}
                  </div>
                </div>
                <button
                  onClick={handleCopyAmount}
                  className="shrink-0 min-h-[44px] px-4 bg-paper-100 hover:bg-paper-200 text-sm font-bold text-ink-800 flex items-center gap-1.5"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 text-green-700" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  <span>{copied ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              <ol className="list-decimal list-outside pl-5 space-y-1.5 text-sm text-ink-800 marker:font-extrabold marker:text-brand-700">
                <li>
                  <strong>Simpan gambar QRIS</strong> di bawah ke galeri (atau scan langsung dari HP
                  lain).
                </li>
                <li>
                  Buka m-Banking / e-Wallet, pilih bayar QRIS, ambil gambarnya dari galeri, lalu isi
                  nominal di atas.
                </li>
                <li>
                  <strong>Kirim bukti bayar</strong> lewat tombol hijau di bawah layar.
                </li>
              </ol>

              <button
                onClick={handleDownloadQris}
                className="w-full min-h-[48px] bg-ink-900 text-surface px-4 text-sm font-bold hover:bg-ink-800 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Simpan gambar QRIS</span>
              </button>

              <div className="mx-auto w-full max-w-[300px] space-y-2 text-center">
                <img
                  src={ADMIN_CONTACT.qrisImage}
                  alt={`QRIS statis a.n. ${ADMIN_CONTACT.qrisName}, NMID ${ADMIN_CONTACT.qrisNmid}`}
                  width={904}
                  height={1280}
                  className="w-full h-auto rounded-lg border border-paper-300"
                />
                <p className="text-xs text-ink-600">
                  Pastikan nama penerima{' '}
                  <span className="font-bold text-ink-900">{ADMIN_CONTACT.qrisName}</span>
                </p>
              </div>

              {/* Pembeli bisa membatalkan sendiri selama belum bayar, supaya pesanan tidak menggantung */}
              {canCustomerCancel(order) &&
                (confirmCancel ? (
                  <div
                    role="alertdialog"
                    aria-labelledby="cancel-order-title"
                    className="rounded-lg border border-red-200 bg-red-50 p-3 space-y-3"
                  >
                    <p id="cancel-order-title" className="text-sm text-red-800">
                      <strong>Batalkan pesanan ini?</strong> Kalau sudah transfer, jangan dibatalkan.
                      Kirim buktinya ke admin.
                    </p>
                    {cancelError && (
                      <p role="alert" className="text-sm font-bold text-red-800">
                        {cancelError}
                      </p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setConfirmCancel(false)}
                        disabled={isCancelling}
                        className="min-h-[44px] border border-paper-300 bg-surface text-ink-800 text-sm font-bold disabled:opacity-50"
                      >
                        Tidak jadi
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={isCancelling}
                        className="min-h-[44px] bg-red-700 text-white text-sm font-extrabold disabled:opacity-50"
                      >
                        {isCancelling ? 'Membatalkan...' : 'Ya, batalkan'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmCancel(true)}
                    className="w-full min-h-[44px] text-sm font-bold text-ink-600 hover:text-red-700 underline underline-offset-4"
                  >
                    Batalkan pesanan
                  </button>
                ))}
            </section>
          )}

          {/* Pesanan lama yang dibuat dengan bayar tunai */}
          {order.paymentMethod === 'tunai' && order.paymentStatus !== 'verified' && isOrderActive(order) && (
            <p className="p-3 bg-green-50 rounded-lg border border-green-200 text-sm text-green-900">
              Siapkan uang pas <strong className="tabular-nums">{rupiah(order.total)}</strong> saat
              mengambil pesanan.
            </p>
          )}

          {/* Rincian menu */}
          <section aria-labelledby="receipt-items-title" className="border-t border-paper-200 pt-5">
            <h3 id="receipt-items-title" className="text-sm font-extrabold text-ink-900">
              Rincian pesanan
            </h3>
            <ul className="mt-2 divide-y divide-paper-200 text-sm">
              {order.items.map((item) => (
                <li key={item.id} className="py-2 flex justify-between gap-3">
                  <div className="min-w-0">
                    <span className="font-bold text-ink-900">
                      {item.quantity}× {item.name}
                    </span>
                    <span className="block text-xs text-ink-600">{item.optionLabel}</span>
                  </div>
                  <span className="shrink-0 font-bold text-ink-900 tabular-nums">
                    {rupiah(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="pt-2 border-t border-paper-300 flex justify-between text-sm font-extrabold text-ink-900">
              <span>Total ({order.totalPieces} pcs)</span>
              <span className="text-brand-600 tabular-nums">{rupiah(order.total)}</span>
            </div>
          </section>
        </div>

        {/* Footer Actions */}
        <div className="shrink-0 px-4 pt-3 pb-[max(0.5rem,env(safe-area-inset-bottom))] border-t border-paper-200 bg-paper-50">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className={`btn-pill w-full min-h-[52px] px-4 text-sm font-extrabold flex items-center justify-center gap-2 active:scale-[0.98] transition-all ${
              showPayment
                ? 'bg-green-700 hover:bg-green-800 text-white'
                : 'border border-paper-300 bg-surface text-ink-900 hover:bg-paper-100'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>{showPayment ? 'Kirim Bukti Bayar via WhatsApp' : 'Chat Admin via WhatsApp'}</span>
          </a>

          <button
            onClick={onClose}
            className="w-full min-h-[44px] text-ink-700 hover:text-ink-900 text-sm font-bold"
          >
            Kembali ke Menu
          </button>
        </div>
      </div>
    </div>
  )
}
