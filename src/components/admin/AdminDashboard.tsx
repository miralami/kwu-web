import React, { useState } from 'react'
import { Order, OrderStatus, PaymentStatus } from '../../types'
import { MENU_ITEMS } from '../../data/menu'
import { saveOrder, generateOrderCode } from '../../services/storage'
import { calculateSalesReport, buildDailySeries, isAwaitingCash } from '../../services/analytics'
import { TargetMeters, DailyRevenueChart, MenuRevenueBars, PaymentSplitBar } from './FinanceCharts'
import {
  ShieldAlert,
  CheckCircle,
  ChefHat,
  PackageCheck,
  Copy,
  Download,
  Search,
  MessageCircle,
  Trash2,
  DollarSign,
  TrendingUp,
  Package,
} from 'lucide-react'

interface AdminDashboardProps {
  orders: Order[]
  onUpdateStatus: (orderId: string, orderStatus: OrderStatus, paymentStatus?: PaymentStatus) => void
  onDeleteOrder: (orderId: string) => void
  onClose: () => void
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  orders,
  onUpdateStatus,
  onDeleteOrder,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'pos' | 'report' | 'team'>('orders')
  const [orderFilter, setOrderFilter] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedReport, setCopiedReport] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // POS Offline state
  const [posCustomerName, setPosCustomerName] = useState('Pembeli Kampus / Walk-in')
  const [posMethod, setPosMethod] = useState<'qris' | 'tunai'>('tunai')
  const [posCart, setPosCart] = useState<{ [key: string]: number }>({})
  const [posItemSearch, setPosItemSearch] = useState('')
  const [posFeedback, setPosFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const report = calculateSalesReport(orders)
  const dailySeries = buildDailySeries(orders)

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (orderFilter === 'pending') {
      return (
        order.paymentStatus === 'pending' &&
        order.paymentMethod === 'qris' &&
        order.orderStatus !== 'dibatalkan'
      )
    }
    if (orderFilter === 'cash') {
      return isAwaitingCash(order)
    }
    if (orderFilter === 'processing') {
      return order.orderStatus === 'sedang_diproses'
    }
    if (orderFilter === 'ready') {
      return order.orderStatus === 'siap_diambil'
    }
    if (orderFilter === 'completed') {
      return order.orderStatus === 'selesai'
    }
    return true
  })

  const handlePosChange = (key: string, delta: number) => {
    setPosCart((prev) => {
      const next = { ...prev, [key]: (prev[key] || 0) + delta }
      if (next[key] <= 0) delete next[key]
      return next
    })
  }

  const handlePosSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setPosFeedback(null)
    const selectedEntries = Object.entries(posCart)
    if (selectedEntries.length === 0) {
      setPosFeedback({ type: 'error', text: 'Pilih minimal satu menu untuk dicatat' })
      return
    }

    const items = selectedEntries.map(([key, qty]) => {
      const [menuId, optId] = key.split('__')
      const menu = MENU_ITEMS.find((m) => m.id === menuId)!
      const opt = menu.options.find((o) => o.id === optId)!
      return {
        id: `${menuId}-${optId}`,
        menuItemId: menuId,
        name: menu.name,
        optionId: optId,
        optionLabel: opt.label,
        pieces: opt.pieces,
        price: opt.price,
        quantity: qty,
      }
    })

    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0)
    const totalPieces = items.reduce((s, i) => s + i.pieces * i.quantity, 0)

    const newOrder: Order = {
      id: await generateOrderCode(),
      customerName: posCustomerName.trim() || 'Offline Customer',
      customerPhone: '080000000000',
      customerClass: 'Kampus Tel-U (Kasir)',
      items,
      totalItems: items.length,
      totalPieces,
      subtotal,
      discountAmount: 0,
      total: subtotal,
      paymentMethod: posMethod,
      paymentStatus: 'verified',
      orderStatus: 'selesai',
      customerNotes: 'Transaksi Kasir Langsung',
      createdAt: new Date().toISOString(),
      expiresAt: new Date().toISOString(), // kolom wajib di database; batas bayar sudah tidak dipakai
    }

    try {
      await saveOrder(newOrder)
    } catch (err) {
      setPosFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Transaksi gagal dicatat. Coba lagi.',
      })
      return
    }
    setPosCart({})
    setPosCustomerName('Pembeli Kampus / Walk-in')
    setPosFeedback({ type: 'success', text: `Transaksi #${newOrder.id} berhasil dicatat & masuk rekap!` })
  }

  const handleCopyWhatsAppReport = () => {
    const text = `LAPORAN PENJUALAN KWU: LARIS MANIS
Kelompok 1 - S1SI-KJ-23-002 (Tel-U Jakarta)
Tanggal: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}

Ringkasan Finansial (semua waktu, hanya pesanan lunas):
• Total Omzet Masuk: Rp${report.totalRevenue.toLocaleString('id-ID')}
• Total Transaksi: ${report.totalOrders} pesanan
• Total Pcs Terjual: ${report.totalPiecesSold} / ${report.targetPieces} pcs target (${Math.round((report.totalPiecesSold / report.targetPieces) * 100)}%)
• Diskon Referral Diberikan: Rp${report.totalDiscount.toLocaleString('id-ID')}
• Estimasi Laba Kotor (40.5%): Rp${report.estimatedProfit.toLocaleString('id-ID')}
${report.awaitingCashCount > 0 ? `• Catatan: ${report.awaitingCashCount} pesanan tunai belum ditandai lunas, belum dihitung di atas.\n` : ''}
Rincian Penjualan per Menu (nilai setelah diskon):
${Object.values(report.itemsBreakdown)
  .map((i) => `• ${i.name}: ${i.pieces} pcs (Rp${i.revenue.toLocaleString('id-ID')})`)
  .join('\n')}

Laporan digenerate otomatis via kwu-web Laris Manis.`

    navigator.clipboard.writeText(text)
    setCopiedReport(true)
    setTimeout(() => setCopiedReport(false), 2000)
  }

  const handleDownloadCsv = () => {
    const headers =
      'ID,Tanggal,Nama,Kelas/Lokasi,No WA,Metode,Status Bayar,Status Pesanan,Total Pcs,Subtotal,Diskon,Total Tagihan\n'
    const rows = orders
      .map(
        (o) =>
          `"${o.id}","${new Date(o.createdAt).toLocaleString('id-ID')}","${o.customerName}","${o.customerClass}","${o.customerPhone}","${o.paymentMethod}","${o.paymentStatus}","${o.orderStatus}",${o.totalPieces},${o.subtotal},${o.discountAmount},${o.total}`
      )
      .join('\n')

    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `Rekap-Penjualan-LarisManis-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Dashboard Admin Tim & Kasir"
      className="fixed inset-0 z-50 bg-paper-100 flex flex-col overflow-hidden"
    >
      {/* Header + tab: satu blok biru; tab aktif menyatu dengan halaman krem di bawahnya (seperti map folder) */}
      <div className="shrink-0 bg-royal-600 relative overflow-hidden shadow-[0_6px_14px_-4px_rgb(8_16_48/0.55)] z-10">
        <div aria-hidden="true" className="ground-rays-soft pointer-events-none absolute -right-24 -top-40 w-[26rem] h-[26rem]" />
        <div className="relative pl-4 pr-2 flex items-center justify-between gap-2 h-14 text-white">
          <h1 className="font-display uppercase text-lg leading-none flex items-center gap-2 min-w-0">
            <span className="shrink-0 w-8 h-8 rounded-full bg-accent-500 text-stone-900 flex items-center justify-center shadow-[0_3px_0_rgb(var(--c-accent-700))]">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <span className="truncate">Dashboard Tim</span>
          </h1>
          <button
            onClick={onClose}
            className="shrink-0 min-h-[44px] px-4 bg-white/15 hover:bg-white/25 text-white text-sm font-bold"
          >
            Keluar
          </button>
        </div>

        <div className="relative px-2 pt-1 grid grid-cols-4 gap-1" role="tablist">
          {[
            { id: 'orders', label: 'Pesanan', count: orders.length },
            { id: 'pos', label: 'Kasir' },
            { id: 'report', label: 'Rekap' },
            { id: 'team', label: 'Tim' },
          ].map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id as any)}
                className={`tab-folder min-h-[48px] px-1 text-sm font-extrabold whitespace-nowrap transition-colors flex items-center justify-center gap-1.5 ${
                  isActive
                    ? 'bg-paper-100 text-brand-600 shadow-[0_-3px_6px_-2px_rgb(8_16_48/0.35)]'
                    : 'bg-royal-700/60 text-white/90 hover:bg-royal-700'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="bg-brand-600 text-white text-xs min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center font-extrabold tabular-nums">
                    {tab.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 pb-10 max-w-4xl w-full mx-auto">
        {/* TAB 1: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3.5 justify-between items-stretch sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-5 h-5 text-royal-600 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Cari ID atau nama pemesan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-[48px] pl-11 pr-3 py-2 bg-surface border-2 border-royal-600 rounded-xl shadow-[0_3px_0_rgb(var(--c-royal-600))] placeholder:text-ink-500 focus:outline-none focus:border-brand-600"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'pending', label: 'Cek Qris' },
                  // Checkout online kini selalu QRIS: chip ini hanya untuk pesanan tunai lama
                  ...(report.awaitingCashCount > 0 || orderFilter === 'cash'
                    ? [{ id: 'cash', label: 'Tunai Belum Lunas' }]
                    : []),
                  { id: 'processing', label: 'Dimasak' },
                  { id: 'ready', label: 'Siap Ambil' },
                  { id: 'completed', label: 'Selesai' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setOrderFilter(f.id)}
                    aria-pressed={orderFilter === f.id}
                    className={`min-h-[44px] px-4 text-sm font-extrabold whitespace-nowrap border-2 transition-[transform,box-shadow] duration-100 ${
                      orderFilter === f.id
                        ? 'bg-royal-600 text-white border-royal-600 shadow-[0_3px_0_rgb(var(--c-royal-900))] -translate-y-0.5'
                        : 'bg-surface text-royal-700 border-royal-600/40 hover:border-royal-600 active:translate-y-0.5'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {report.awaitingCashCount > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-2 bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-3 text-xs">
                <span className="font-bold">
                  {report.awaitingCashCount} pesanan tunai belum ditandai lunas — belum masuk omzet.
                </span>
                <button
                  onClick={() => setOrderFilter('cash')}
                  className="min-h-[44px] px-3 rounded-lg bg-amber-900 text-white font-bold"
                >
                  Lihat daftarnya
                </button>
              </div>
            )}

            {/* Orders Feed */}
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center bg-surface rounded-lg border border-paper-200 text-ink-500 text-xs">
                Tidak ada pesanan pada filter ini.
              </div>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const cancelled = order.orderStatus === 'dibatalkan'
                  const needsQrisCheck =
                    order.paymentMethod === 'qris' && order.paymentStatus === 'pending' && !cancelled
                  const needsCash = order.paymentMethod === 'tunai' && order.paymentStatus !== 'verified'
                  const stepBtn = (active: boolean, activeClass: string) =>
                    `min-h-[52px] px-1 text-xs font-extrabold flex flex-col items-center justify-center gap-0.5 border-2 transition-colors ${
                      active ? activeClass : 'bg-surface text-ink-700 border-paper-300 hover:border-royal-600'
                    }`
                  return (
                    <article
                      key={order.id}
                      className={`relative bg-surface shadow-[0_8px_16px_-8px_rgb(8_16_48/0.45)] ${cancelled ? 'opacity-70' : ''}`}
                    >
                      {/* Kepala nota: nomor pesanan, jam, dan status bayar */}
                      <div className="bg-royal-600 text-white px-3 py-2 flex items-center justify-between gap-2">
                        <span className="font-display text-lg leading-none tabular-nums">#{order.id}</span>
                        <span className="text-xs font-bold tabular-nums">
                          {new Date(order.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div className="p-3 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="font-extrabold text-base text-ink-900 leading-tight break-words">
                              {order.customerName}
                            </div>
                            {order.customerClass && <div className="text-xs text-ink-600">{order.customerClass}</div>}
                            <a
                              href={`https://wa.me/${order.customerPhone.replace(/^0/, '62')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="min-h-[44px] text-sm text-green-700 font-bold hover:underline inline-flex items-center gap-1.5"
                            >
                              <MessageCircle className="w-4 h-4" /> {order.customerPhone}
                            </a>
                          </div>
                          <span
                            className={`shrink-0 text-xs font-extrabold px-2.5 py-1 border-2 border-double -rotate-3 ${
                              cancelled
                                ? 'text-red-700 border-red-700'
                                : order.paymentStatus === 'verified'
                                ? 'text-green-700 border-green-700'
                                : 'text-brand-600 border-brand-600'
                            }`}
                          >
                            {cancelled
                              ? 'DIBATALKAN'
                              : order.paymentStatus === 'verified'
                              ? order.paymentMethod === 'tunai'
                                ? 'TUNAI LUNAS'
                                : 'LUNAS'
                              : order.paymentMethod === 'tunai'
                              ? 'TUNAI BELUM'
                              : 'BELUM BAYAR'}
                          </span>
                        </div>

                        {order.customerNotes && (
                          <p className="text-sm bg-paper-100 text-ink-800 px-3 py-2">
                            <span className="font-bold">Catatan:</span> {order.customerNotes}
                          </p>
                        )}

                        {/* Rincian: baris bergaris seperti nota */}
                        <ul className="divide-y divide-dashed divide-royal-600/30 border-y border-dashed border-royal-600/30 text-sm">
                          {order.items.map((i) => (
                            <li key={i.id} className="py-1.5 flex justify-between gap-3">
                              <span className="min-w-0">
                                <span className="font-bold text-ink-900">
                                  {i.quantity}× {i.name}
                                </span>
                                <span className="block text-xs text-ink-600">{i.optionLabel}</span>
                              </span>
                              <span className="shrink-0 font-bold text-ink-900 tabular-nums">
                                Rp{(i.price * i.quantity).toLocaleString('id-ID')}
                              </span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex items-baseline justify-between">
                          <span className="text-xs font-extrabold uppercase text-royal-700">
                            Total · {order.totalPieces} pcs
                          </span>
                          <span className="font-display text-lg text-brand-600 tabular-nums">
                            Rp{order.total.toLocaleString('id-ID')}
                          </span>
                        </div>

                        {/* Aksi: verifikasi dulu (bila perlu), lalu tiga langkah sejajar */}
                        {needsQrisCheck && (
                          <button
                            onClick={() => onUpdateStatus(order.id, 'sedang_diproses', 'verified')}
                            className="btn-card w-full min-h-[52px] bg-green-700 hover:bg-green-800 text-white text-sm font-extrabold flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Verifikasi Mutasi Masuk</span>
                          </button>
                        )}
                        {needsCash && (
                          <button
                            onClick={() => onUpdateStatus(order.id, order.orderStatus, 'verified')}
                            className="btn-card w-full min-h-[52px] bg-green-700 hover:bg-green-800 text-white text-sm font-extrabold flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Uang Tunai Diterima</span>
                          </button>
                        )}

                        {!cancelled && (
                          <div className="grid grid-cols-3 gap-2">
                            <button
                              onClick={() => onUpdateStatus(order.id, 'sedang_diproses')}
                              className={`btn-card ${stepBtn(order.orderStatus === 'sedang_diproses', 'bg-brand-600 text-white border-brand-600')}`}
                            >
                              <ChefHat className="w-4 h-4" />
                              <span>Dimasak</span>
                            </button>
                            <button
                              onClick={() => onUpdateStatus(order.id, 'siap_diambil')}
                              className={`btn-card ${stepBtn(order.orderStatus === 'siap_diambil', 'bg-royal-600 text-white border-royal-600')}`}
                            >
                              <PackageCheck className="w-4 h-4" />
                              <span>Siap</span>
                            </button>
                            <button
                              onClick={() => onUpdateStatus(order.id, 'selesai')}
                              className={`btn-card ${stepBtn(order.orderStatus === 'selesai', 'bg-green-700 text-white border-green-700')}`}
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>Selesai</span>
                            </button>
                          </div>
                        )}

                        {confirmDeleteId === order.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-sm text-red-700 font-bold mr-auto">Hapus pesanan ini?</span>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="min-h-[44px] px-4 bg-paper-100 text-ink-800 text-sm font-bold hover:bg-paper-200"
                            >
                              Batal
                            </button>
                            <button
                              onClick={() => {
                                onDeleteOrder(order.id)
                                setConfirmDeleteId(null)
                              }}
                              className="min-h-[44px] px-4 bg-red-700 text-white text-sm font-bold hover:bg-red-800"
                            >
                              Ya, hapus
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(order.id)}
                            className="min-h-[44px] flex items-center gap-1.5 text-sm font-bold text-ink-600 hover:text-red-700"
                            aria-label={`Hapus pesanan #${order.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Hapus pesanan</span>
                          </button>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: KASIR OFFLINE */}
        {activeTab === 'pos' && (
          <div className="bg-surface border-t-4 border-royal-600 shadow-[0_6px_12px_-6px_rgb(8_16_48/0.4)] p-4 space-y-5">
            <div>
              <h2 className="font-extrabold text-base text-ink-900">Kasir Jualan Kampus (Walk-in)</h2>
              <p className="text-xs text-ink-500">
                Pencatatan langsung bagi mahasiswa/dosen yang membeli di booth tanpa order online.
              </p>
            </div>

            <form onSubmit={handlePosSubmit} className="space-y-4">
              {posFeedback && (
                <div
                  className={`p-3 rounded-lg border text-xs font-bold ${
                    posFeedback.type === 'success'
                      ? 'bg-green-50 text-green-800 border-green-200'
                      : 'bg-red-50 text-red-800 border-red-200'
                  }`}
                >
                  {posFeedback.text}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-ink-800 mb-1">Nama Pembeli</label>
                  <input
                    type="text"
                    value={posCustomerName}
                    onChange={(e) => setPosCustomerName(e.target.value)}
                    className="w-full min-h-[44px] text-xs px-3 border border-paper-200 rounded-lg bg-paper-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink-800 mb-1">
                    Metode Pembayaran
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPosMethod('tunai')}
                      className={`min-h-[44px] p-2 rounded-lg text-xs font-bold border ${
                        posMethod === 'tunai'
                          ? 'bg-green-50 border-green-600 text-green-900'
                          : 'bg-surface border-paper-200 text-ink-700'
                      }`}
                    >
                      Tunai (Cash)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosMethod('qris')}
                      className={`min-h-[44px] p-2 rounded-lg text-xs font-bold border ${
                        posMethod === 'qris'
                          ? 'bg-brand-50 border-brand-600 text-brand-900'
                          : 'bg-surface border-paper-200 text-ink-700'
                      }`}
                    >
                      Qris
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-ink-800">Pilih Item:</label>
                  <input
                    type="text"
                    placeholder="Filter menu..."
                    value={posItemSearch}
                    onChange={(e) => setPosItemSearch(e.target.value)}
                    className="min-h-[44px] px-3 border border-paper-300 rounded-md bg-paper-50 max-w-[160px]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {MENU_ITEMS.filter((item) =>
                    posItemSearch
                      ? item.name.toLowerCase().includes(posItemSearch.toLowerCase())
                      : true
                  ).map((item) =>
                    item.options.map((opt) => {
                      const key = `${item.id}__${opt.id}`
                      const qty = posCart[key] || 0
                      return (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 rounded-lg border border-paper-200 bg-paper-50"
                        >
                          <div>
                            <div className="font-bold text-xs text-ink-900">{item.name}</div>
                            <div className="text-xs text-ink-500">
                              {opt.label} • Rp{opt.price.toLocaleString('id-ID')}
                            </div>
                          </div>
                          <div className="flex items-center border border-paper-200 rounded-lg bg-surface">
                            <button
                              type="button"
                              onClick={() => handlePosChange(key, -1)}
                              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs font-bold text-ink-600 hover:bg-paper-100"
                              aria-label={`Kurangi ${item.name} ${opt.label}`}
                            >
                              -
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-ink-900">{qty}</span>
                            <button
                              type="button"
                              onClick={() => handlePosChange(key, 1)}
                              className="min-h-[44px] min-w-[44px] flex items-center justify-center text-xs font-bold text-ink-600 hover:bg-paper-100"
                              aria-label={`Tambah ${item.name} ${opt.label}`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full min-h-[52px] bg-brand-600 text-white text-sm font-extrabold hover:bg-brand-700"
              >
                Catat Transaksi Penjualan Masuk
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: REPORT */}
        {activeTab === 'report' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-surface p-4 border-t-4 border-royal-600 shadow-[0_6px_12px_-6px_rgb(8_16_48/0.4)]">
                <div className="flex items-center gap-1.5 text-xs text-ink-500 font-bold">
                  <DollarSign className="w-3.5 h-3.5 text-green-700" />
                  <span>Total Omzet Masuk</span>
                </div>
                <div className="font-display text-lg text-green-700 mt-1">
                  Rp{report.totalRevenue.toLocaleString('id-ID')}
                </div>
                <div className="text-xs text-ink-600 mt-0.5">
                  {report.totalOrders} transaksi lunas · semua waktu
                </div>
              </div>

              <div className="bg-surface p-4 border-t-4 border-royal-600 shadow-[0_6px_12px_-6px_rgb(8_16_48/0.4)]">
                <div className="flex items-center gap-1.5 text-xs text-ink-500 font-bold">
                  <Package className="w-3.5 h-3.5 text-ink-700" />
                  <span>Pcs Terjual</span>
                </div>
                <div className="font-display text-lg text-ink-900 mt-1">
                  {report.totalPiecesSold} <span className="text-xs font-medium text-ink-400">/ {report.targetPieces} pcs</span>
                </div>
                <div className="text-xs text-brand-600 font-bold mt-0.5">
                  {Math.round((report.totalPiecesSold / report.targetPieces) * 100)}% target · semua
                  waktu
                </div>
              </div>

              <div className="bg-surface p-4 border-t-4 border-royal-600 shadow-[0_6px_12px_-6px_rgb(8_16_48/0.4)]">
                <div className="flex items-center gap-1.5 text-xs text-ink-500 font-bold">
                  <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
                  <span>Estimasi Laba</span>
                </div>
                <div className="font-display text-lg text-brand-600 mt-1">
                  Rp{report.estimatedProfit.toLocaleString('id-ID')}
                </div>
                <div className="text-xs text-ink-600 mt-0.5">Margin ~40.5% × omzet lunas</div>
              </div>

              <div className="bg-surface p-4 border-t-4 border-royal-600 shadow-[0_6px_12px_-6px_rgb(8_16_48/0.4)]">
                <div className="text-xs text-ink-500 font-bold">Target Omzet Akhir</div>
                <div className="font-display text-base text-ink-700 mt-1 whitespace-nowrap">
                  Rp{report.targetRevenue.toLocaleString('id-ID')}
                </div>
                <div className="text-xs text-ink-600 mt-0.5">Proyeksi Minggu 10-12</div>
              </div>
            </div>

            {(report.totalDiscount > 0 || report.awaitingCashCount > 0) && (
              <p className="text-xs text-ink-500">
                {report.totalDiscount > 0 && (
                  <>Diskon referral yang sudah diberikan: Rp{report.totalDiscount.toLocaleString('id-ID')}. </>
                )}
                {report.awaitingCashCount > 0 && (
                  <>
                    {report.awaitingCashCount} pesanan tunai belum ditandai lunas dan belum dihitung di
                    kartu mana pun.
                  </>
                )}
              </p>
            )}

            {/* Grafik untuk investor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TargetMeters
                revenue={report.totalRevenue}
                revenueTarget={report.targetRevenue}
                pieces={report.totalPiecesSold}
                piecesTarget={report.targetPieces}
              />
              <PaymentSplitBar orders={orders} />
            </div>
            <DailyRevenueChart data={dailySeries} />
            <MenuRevenueBars items={Object.values(report.itemsBreakdown)} />

            {/* Export and copy buttons */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleCopyWhatsAppReport}
                className="flex-1 min-h-[48px] bg-green-700 hover:bg-green-800 text-white px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
              >
                <Copy className="w-4 h-4" />
                <span>{copiedReport ? '✓ Laporan Tersalin!' : 'Salin Laporan WhatsApp Dosen'}</span>
              </button>
              <button
                onClick={handleDownloadCsv}
                className="flex-1 min-h-[48px] bg-royal-600 hover:bg-royal-700 text-white px-4 text-sm font-bold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Export data (Google Sheets)</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: TEAM */}
        {activeTab === 'team' && (
          <div className="bg-surface border-t-4 border-royal-600 shadow-[0_6px_12px_-6px_rgb(8_16_48/0.4)] p-4 space-y-4">
            <div>
              <h2 className="font-extrabold text-base text-ink-900">
                Struktur Tim Kelompok 1 - Laris Manis
              </h2>
              <p className="text-xs text-ink-500">
                Mata Kuliah Kewirausahaan • Telkom University Jakarta • Dosen: Dis
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-brand-50 rounded-lg border border-brand-200">
                <span className="text-xs font-bold text-brand-700">Ketua Tim</span>
                <div className="font-black text-ink-900 mt-0.5">Muhammad Rayfan Pashya</div>
              </div>

              <div className="p-3 bg-paper-50 rounded-lg border border-paper-200">
                <span className="text-xs font-bold text-ink-500">
                  Produksi & R&D
                </span>
                <div className="font-bold text-ink-900 mt-0.5">
                  Afif Nur Sena, Qalam Raydathul Sabani, Fajar Maulana
                </div>
                <div className="text-ink-500 text-xs">Resep Sop, Uji Rasa, Packaging</div>
              </div>

              <div className="p-3 bg-paper-50 rounded-lg border border-paper-200">
                <span className="text-xs font-bold text-ink-500">
                  Marketing & Medsos
                </span>
                <div className="font-bold text-ink-900 mt-0.5">Vio Salman Kafiyan, Rayfan</div>
                <div className="text-ink-500 text-xs">Story Instagram, poster pre-order, Desain Promo</div>
              </div>

              <div className="p-3 bg-paper-50 rounded-lg border border-paper-200">
                <span className="text-xs font-bold text-ink-500">Keuangan</span>
                <div className="font-bold text-ink-900 mt-0.5">Rayhan Arya Ardani, Adam Priyatna</div>
                <div className="text-ink-500 text-xs">Pencatatan Kas, Cashflow, Nota Hpp</div>
              </div>

              <div className="p-3 bg-paper-50 rounded-lg border border-paper-200 sm:col-span-2">
                <span className="text-xs font-bold text-ink-500">
                  Penjualan & Operasional Pre-order
                </span>
                <div className="font-bold text-ink-900 mt-0.5">
                  Yudi Hokiana, Willyansyah, Muhammad Fahmi Yusuf, Rachmat Akbar
                </div>
                <div className="text-ink-500 text-xs">
                  Verifikasi Qris, Delivery Kampus, Pelayanan Konsumen
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
