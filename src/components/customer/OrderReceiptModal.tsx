import React, { useState, useEffect } from 'react'
import { Order } from '../../types'
import { ADMIN_CONTACT } from '../../data/menu'
import {
  X,
  Download,
  Copy,
  CheckCircle2,
  Clock,
  Send,
  ChefHat,
  PackageCheck,
} from 'lucide-react'

interface OrderReceiptModalProps {
  order: Order | null
  onClose: () => void
}

export const OrderReceiptModal: React.FC<OrderReceiptModalProps> = ({ order, onClose }) => {
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number>(15 * 60)

  useEffect(() => {
    if (!order) return

    const calculateTime = () => {
      const diff = Math.max(0, Math.floor((new Date(order.expiresAt).getTime() - Date.now()) / 1000))
      setTimeLeft(diff)
    }

    calculateTime()
    const timer = setInterval(calculateTime, 1000)
    return () => clearInterval(timer)
  }, [order])

  if (!order) return null

  const minutes = Math.floor(timeLeft / 60)
  const seconds = timeLeft % 60
  const isExpired = timeLeft <= 0

  const handleCopyAmount = () => {
    navigator.clipboard.writeText(order.total.toString())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const itemsText = order.items
    .map((i) => `• ${i.name} (${i.optionLabel}) x${i.quantity} = Rp${(i.price * i.quantity).toLocaleString('id-ID')}`)
    .join('\n')

  const waMessage = encodeURIComponent(
    `Halo Admin Laris Manis! 🙌\nSaya mau konfirmasi pesanan PO:\n\n*ID Pesanan: #${order.id}*\nNama: ${order.customerName}\nKelas/Lokasi: ${order.customerClass}\nMetode: ${order.paymentMethod.toUpperCase()}\nTotal: *Rp${order.total.toLocaleString('id-ID')}*\n\n*Detail Menu:*\n${itemsText}\n\nCatatan: ${order.customerNotes || '-'}\n\nMohon dicek ya min, terima kasih!`
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/70 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-lg bg-white rounded-xl shadow-2xl overflow-hidden my-6 border border-paper-200">
        {/* Receipt Header */}
        <div className="bg-ink-900 text-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-brand-200 uppercase tracking-wider">
                Bukti Pemesanan PO
              </span>
              <h2 id="receipt-modal-title" className="text-xl font-extrabold mt-0.5">Pesanan #{order.id}</h2>
              <p className="text-xs text-paper-200">{order.customerName} • {order.customerClass}</p>
            </div>
            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-paper-200 hover:text-white rounded-lg"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto bg-white">
          {/* Order Status Progress */}
          <div className="bg-paper-50 p-4 rounded-lg border border-paper-200">
            <div className="text-xs font-bold text-ink-600 mb-2">Status Pesanan:</div>
            <div className="flex items-center justify-between text-center gap-1">
              <div className="flex-1 flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    order.paymentStatus === 'verified' || order.paymentMethod === 'tunai'
                      ? 'bg-green-700 text-white'
                      : 'bg-accent-500 text-ink-900'
                  }`}
                >
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold mt-1 text-ink-800">Verifikasi</span>
              </div>

              <div
                className={`h-0.5 flex-1 ${
                  order.orderStatus === 'sedang_diproses' ||
                  order.orderStatus === 'siap_diambil' ||
                  order.orderStatus === 'selesai'
                    ? 'bg-green-700'
                    : 'bg-paper-300'
                }`}
              />

              <div className="flex-1 flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    order.orderStatus === 'sedang_diproses' ||
                    order.orderStatus === 'siap_diambil' ||
                    order.orderStatus === 'selesai'
                      ? 'bg-brand-600 text-white'
                      : 'bg-paper-200 text-ink-400'
                  }`}
                >
                  <ChefHat className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold mt-1 text-ink-800">Dimasak</span>
              </div>

              <div
                className={`h-0.5 flex-1 ${
                  order.orderStatus === 'siap_diambil' || order.orderStatus === 'selesai'
                    ? 'bg-green-700'
                    : 'bg-paper-300'
                }`}
              />

              <div className="flex-1 flex flex-col items-center">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    order.orderStatus === 'siap_diambil' || order.orderStatus === 'selesai'
                      ? 'bg-green-700 text-white'
                      : 'bg-paper-200 text-ink-400'
                  }`}
                >
                  <PackageCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold mt-1 text-ink-800">Siap Ambil</span>
              </div>
            </div>
          </div>

          {/* QRIS Display */}
          {order.paymentMethod === 'qris' && (
            <div className="bg-paper-50 rounded-lg border border-paper-200 p-4 text-center space-y-3">
              {/* 3-Step Manual QRIS Guide */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-left space-y-1.5 text-xs text-amber-950">
                <div className="font-extrabold text-amber-900 flex items-center gap-1.5">
                  <span>3 Langkah Pembayaran QRIS:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-amber-900/90 font-medium">
                  <li>Scan QRIS di bawah dengan m-Banking / e-Wallet apa saja.</li>
                  <li>Masukkan nominal tepat atau gunakan tombol <strong>Salin</strong>.</li>
                  <li>Klik tombol hijau <strong>Kirim Bukti Bayar ke WhatsApp</strong> di bawah.</li>
                </ol>
              </div>

              {/* Timer Notice */}
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded text-xs font-bold ${
                  isExpired
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-900'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                {isExpired ? (
                  <span>Waktu Pembayaran Berakhir</span>
                ) : (
                  <span>
                    Batas Bayar: {minutes.toString().padStart(2, '0')}:
                    {seconds.toString().padStart(2, '0')} Menit
                  </span>
                )}
              </div>

              {/* QR Container */}
              <div className="mx-auto w-full max-w-[280px] space-y-1.5">
                <img
                  src={ADMIN_CONTACT.qrisImage}
                  alt={`QRIS statis a.n. ${ADMIN_CONTACT.qrisName}, NMID ${ADMIN_CONTACT.qrisNmid}`}
                  width={904}
                  height={1280}
                  className="w-full h-auto rounded-lg border border-paper-300"
                />
                <p className="text-xs text-ink-600">
                  Pastikan nama penerima <span className="font-bold text-ink-900">{ADMIN_CONTACT.qrisName}</span>
                </p>
              </div>

              {/* Exact Amount */}
              <div className="bg-white p-3 rounded-lg border border-paper-200 flex items-center justify-between">
                <div className="text-left">
                  <div className="text-xs text-ink-500 uppercase font-bold">
                    Nominal Transfer Tepat
                  </div>
                  <div className="text-lg font-black text-brand-600">
                    Rp{order.total.toLocaleString('id-ID')}
                  </div>
                </div>
                <button
                  onClick={handleCopyAmount}
                  className="min-h-[44px] px-3 bg-paper-100 hover:bg-paper-200 rounded-lg text-xs font-bold text-ink-800 flex items-center gap-1.5"
                >
                  {copied ? <CheckCircle2 className="w-4 h-4 text-green-700" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Tersalin' : 'Salin'}</span>
                </button>
              </div>

              <button
                onClick={handleDownloadQris}
                className="w-full min-h-[44px] bg-ink-900 text-white py-2.5 px-4 rounded-lg text-xs font-bold hover:bg-ink-800 flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Simpan Gambar QRIS ke Galeri HP</span>
              </button>
            </div>
          )}

          {/* Cash Notice */}
          {order.paymentMethod === 'tunai' && (
            <div className="p-3.5 bg-green-50 rounded-lg border border-green-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-green-700 shrink-0 mt-0.5" />
              <div className="text-xs">
                <div className="font-bold text-green-950">Metode Bayar Tunai</div>
                <p className="text-green-800 mt-0.5">
                  Siapkan uang pas <span className="font-bold">Rp{order.total.toLocaleString('id-ID')}</span> saat
                  mengambil pesanan di lokasi.
                </p>
              </div>
            </div>
          )}

          {/* Menu Items Breakdown */}
          <div className="border border-paper-200 rounded-lg p-4 bg-paper-50 space-y-2">
            <div className="text-xs font-bold text-ink-700 uppercase tracking-wider">
              Rincian Menu ({order.totalItems} Item • {order.totalPieces} Pcs)
            </div>
            <div className="space-y-1.5 text-xs divide-y divide-paper-200">
              {order.items.map((item) => (
                <div key={item.id} className="pt-1.5 flex justify-between">
                  <div>
                    <span className="font-bold text-ink-900">{item.name}</span>
                    <span className="text-ink-500 ml-1">({item.optionLabel}) x{item.quantity}</span>
                  </div>
                  <span className="font-bold text-ink-900">
                    Rp{(item.price * item.quantity).toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-paper-300 flex justify-between text-xs font-extrabold text-ink-900">
              <span>Total Tagihan</span>
              <span className="text-brand-600">Rp{order.total.toLocaleString('id-ID')}</span>
            </div>
          </div>

          {/* Pickup Point Info */}
          <div className="text-xs bg-paper-100 p-3 rounded-lg border border-paper-200 text-ink-800">
            <span className="font-bold">Lokasi Pengambilan:</span>
            <p className="mt-0.5">{ADMIN_CONTACT.pickupPoint}</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-paper-200 bg-paper-50 space-y-2">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full min-h-[48px] bg-green-700 hover:bg-green-800 text-white py-3 px-4 rounded-lg text-xs sm:text-sm font-extrabold flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            <Send className="w-4 h-4" />
            <span>Kirim Bukti Bayar ke WhatsApp Admin</span>
          </a>

          <button
            onClick={onClose}
            className="w-full min-h-[44px] text-ink-600 hover:text-ink-900 text-xs font-bold"
          >
            Tutup & Kembali ke Menu
          </button>
        </div>
      </div>
    </div>
  )
}
