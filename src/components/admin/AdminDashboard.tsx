import React, { useState } from 'react'
import { Order, OrderStatus, PaymentStatus } from '../../types'
import { MENU_ITEMS } from '../../data/menu'
import { calculateSalesReport, saveOrder, generateOrderId } from '../../services/storage'
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

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerClass.toLowerCase().includes(searchQuery.toLowerCase())

    if (!matchesSearch) return false

    if (orderFilter === 'pending') {
      return order.paymentStatus === 'pending' && order.paymentMethod === 'qris'
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
      id: generateOrderId(),
      customerName: posCustomerName.trim() || 'Offline Customer',
      customerPhone: '080000000000',
      customerClass: 'Kampus Tel-U (Kasir POS)',
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
      expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
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

Ringkasan Finansial:
• Total Omzet Masuk: Rp${report.totalRevenue.toLocaleString('id-ID')}
• Total Transaksi: ${report.totalOrders} pesanan
• Total Pcs Terjual: ${report.totalPiecesSold} / 738 pcs target (${Math.round((report.totalPiecesSold / 738) * 100)}%)
• Estimasi Laba Kotor (40.5%): Rp${report.estimatedProfit.toLocaleString('id-ID')}

Rincian Penjualan per Menu:
${Object.values(report.itemsBreakdown)
  .map((i) => `• ${i.name}: ${i.pieces} pcs (Rp${i.revenue.toLocaleString('id-ID')})`)
  .join('\n')}

Laporan digenerate otomatis via kwu-web Laris Manis.`

    navigator.clipboard.writeText(text)
    setCopiedReport(true)
    setTimeout(() => setCopiedReport(false), 2000)
  }

  const handleDownloadCsv = () => {
    const headers = 'ID,Tanggal,Nama,Kelas/Lokasi,No WA,Metode,Status Bayar,Status Pesanan,Total Pcs,Total Tagihan\n'
    const rows = orders
      .map(
        (o) =>
          `"${o.id}","${new Date(o.createdAt).toLocaleString('id-ID')}","${o.customerName}","${o.customerClass}","${o.customerPhone}","${o.paymentMethod}","${o.paymentStatus}","${o.orderStatus}",${o.totalPieces},${o.total}`
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
      {/* Top Navbar */}
      <div className="bg-inverse text-white px-4 py-3 flex items-center justify-between border-b border-paper-200">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-brand-500" />
          <div>
            <h1 className="font-extrabold text-sm sm:text-base leading-tight">
              Dashboard Tim & Kasir Laris Manis
            </h1>
            <p className="text-xs text-stone-300">Kelompok 1 • S1SI-KJ-23-002</p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="min-h-[44px] px-3 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold"
        >
          Keluar Mode Tim
        </button>
      </div>

      {/* Tabs */}
      <div className="bg-surface border-b border-paper-200 px-4 flex gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: 'orders', label: 'Pesanan Masuk', count: orders.length },
          { id: 'pos', label: 'Kasir Walk-in POS' },
          { id: 'report', label: 'Rekap Finansial & Target' },
          { id: 'team', label: 'Struktur Tim (11)' },
        ].map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`min-h-[44px] py-2 px-3 sm:px-4 text-xs font-bold whitespace-nowrap border-b-2 transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'border-brand-600 text-brand-700 bg-brand-50'
                  : 'border-transparent text-ink-600 hover:text-ink-900'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className="bg-paper-200 text-ink-800 text-xs px-1.5 py-0.5 rounded font-extrabold">
                  {tab.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 max-w-4xl w-full mx-auto">
        {/* TAB 1: ORDERS */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2 justify-between items-stretch sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-ink-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari ID, nama pemesan, kelas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full min-h-[44px] pl-9 pr-3 py-2 text-xs bg-surface border border-paper-200 rounded-lg"
                />
              </div>

              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                {[
                  { id: 'all', label: 'Semua' },
                  { id: 'pending', label: 'Cek QRIS' },
                  { id: 'processing', label: 'Dimasak' },
                  { id: 'ready', label: 'Siap Ambil' },
                  { id: 'completed', label: 'Selesai' },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setOrderFilter(f.id)}
                    className={`min-h-[44px] px-3 rounded-lg text-xs font-bold whitespace-nowrap border ${
                      orderFilter === f.id
                        ? 'bg-ink-900 text-surface border-ink-900'
                        : 'bg-surface text-ink-700 border-paper-200 hover:bg-paper-50'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders Feed */}
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center bg-surface rounded-lg border border-paper-200 text-ink-500 text-xs">
                Tidak ada pesanan pada filter ini.
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order) => {
                  return (
                    <div
                      key={order.id}
                      className="bg-surface rounded-lg border border-paper-200 p-4 shadow-sm space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-paper-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-ink-900 text-sm">#{order.id}</span>
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                              order.paymentStatus === 'verified'
                                ? 'bg-green-100 text-green-800'
                                : order.paymentMethod === 'tunai'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-amber-100 text-amber-900'
                            }`}
                          >
                            {order.paymentMethod === 'tunai'
                              ? 'Tunai di Tempat'
                              : order.paymentStatus === 'verified'
                              ? 'QRIS Terverifikasi'
                              : 'Menunggu Bukti QRIS'}
                          </span>
                        </div>

                        <div className="text-xs text-ink-500">
                          {new Date(order.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <div className="font-bold text-ink-900">{order.customerName}</div>
                          <div className="text-ink-600">{order.customerClass}</div>
                          <div className="mt-1">
                            <a
                              href={`https://wa.me/${order.customerPhone.replace(/^0/, '62')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-green-700 font-bold hover:underline inline-flex items-center gap-1"
                            >
                              <MessageCircle className="w-3.5 h-3.5" /> {order.customerPhone}
                            </a>
                          </div>
                          {order.customerNotes && (
                            <div className="mt-1 text-xs bg-paper-100 text-ink-800 p-2 rounded border border-paper-200">
                              Catatan: {order.customerNotes}
                            </div>
                          )}
                        </div>

                        <div className="bg-paper-50 p-2.5 rounded-lg border border-paper-100 space-y-1">
                          {order.items.map((i) => (
                            <div key={i.id} className="flex justify-between text-xs">
                              <span>
                                {i.name} ({i.optionLabel}) x{i.quantity}
                              </span>
                              <span className="font-semibold text-ink-900">
                                Rp{(i.price * i.quantity).toLocaleString('id-ID')}
                              </span>
                            </div>
                          ))}
                          <div className="pt-1.5 border-t border-paper-200 flex justify-between font-extrabold text-xs text-ink-900">
                            <span>Total ({order.totalPieces} Pcs)</span>
                            <span className="text-brand-600">
                              Rp{order.total.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Action Buttons with min 44px hit height */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-paper-100">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {order.paymentMethod === 'qris' && order.paymentStatus === 'pending' && (
                            <button
                              onClick={() => onUpdateStatus(order.id, 'sedang_diproses', 'verified')}
                              className="min-h-[44px] bg-green-700 hover:bg-green-800 text-white text-xs font-bold px-3 rounded-lg flex items-center gap-1"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Verifikasi Mutasi Masuk</span>
                            </button>
                          )}

                          <button
                            onClick={() => onUpdateStatus(order.id, 'sedang_diproses')}
                            className={`min-h-[44px] text-xs font-bold px-3 rounded-lg flex items-center gap-1 border ${
                              order.orderStatus === 'sedang_diproses'
                                ? 'bg-brand-600 text-white border-brand-600'
                                : 'bg-paper-100 hover:bg-paper-200 text-ink-700 border-paper-200'
                            }`}
                          >
                            <ChefHat className="w-3.5 h-3.5" />
                            <span>Dimasak</span>
                          </button>

                          <button
                            onClick={() => onUpdateStatus(order.id, 'siap_diambil')}
                            className={`min-h-[44px] text-xs font-bold px-3 rounded-lg flex items-center gap-1 border ${
                              order.orderStatus === 'siap_diambil'
                                ? 'bg-blue-700 text-white border-blue-700'
                                : 'bg-paper-100 hover:bg-paper-200 text-ink-700 border-paper-200'
                            }`}
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            <span>Siap Diambil</span>
                          </button>

                          <button
                            onClick={() => onUpdateStatus(order.id, 'selesai', 'verified')}
                            className={`min-h-[44px] text-xs font-bold px-3 rounded-lg flex items-center gap-1 border ${
                              order.orderStatus === 'selesai'
                                ? 'bg-green-700 text-white border-green-700'
                                : 'bg-paper-100 hover:bg-paper-200 text-ink-700 border-paper-200'
                            }`}
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Selesai</span>
                          </button>
                        </div>

                        {confirmDeleteId === order.id ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-red-600 font-bold">Hapus?</span>
                            <button
                              onClick={() => {
                                onDeleteOrder(order.id)
                                setConfirmDeleteId(null)
                              }}
                              className="min-h-[44px] px-3 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700"
                            >
                              Ya
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="min-h-[44px] px-2.5 bg-paper-100 text-ink-700 text-xs font-bold rounded-lg hover:bg-paper-200"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setConfirmDeleteId(order.id)}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center text-ink-400 hover:text-red-700 rounded-lg hover:bg-red-50"
                            aria-label={`Batalkan pesanan #${order.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: KASIR OFFLINE */}
        {activeTab === 'pos' && (
          <div className="bg-surface rounded-lg border border-paper-200 p-5 space-y-5">
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
                      QRIS Statis
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
                    className="text-xs px-2.5 py-1 border border-paper-200 rounded-md bg-paper-50 max-w-[160px]"
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
                className="w-full min-h-[48px] bg-ink-900 text-surface rounded-lg text-xs sm:text-sm font-extrabold hover:bg-ink-800"
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
              <div className="bg-surface p-4 rounded-lg border border-paper-200">
                <div className="flex items-center gap-1.5 text-xs text-ink-500 font-bold uppercase">
                  <DollarSign className="w-3.5 h-3.5 text-green-700" />
                  <span>Total Omzet</span>
                </div>
                <div className="text-lg sm:text-xl font-black text-green-700 mt-1">
                  Rp{report.totalRevenue.toLocaleString('id-ID')}
                </div>
                <div className="text-xs text-ink-400 mt-0.5">{report.totalOrders} Transaksi Sukses</div>
              </div>

              <div className="bg-surface p-4 rounded-lg border border-paper-200">
                <div className="flex items-center gap-1.5 text-xs text-ink-500 font-bold uppercase">
                  <Package className="w-3.5 h-3.5 text-ink-700" />
                  <span>Pcs Terjual</span>
                </div>
                <div className="text-lg sm:text-xl font-black text-ink-900 mt-1">
                  {report.totalPiecesSold} <span className="text-xs font-medium text-ink-400">/ 738 pcs</span>
                </div>
                <div className="text-xs text-brand-600 font-bold mt-0.5">
                  {Math.round((report.totalPiecesSold / 738) * 100)}% Target Tercapai
                </div>
              </div>

              <div className="bg-surface p-4 rounded-lg border border-paper-200">
                <div className="flex items-center gap-1.5 text-xs text-ink-500 font-bold uppercase">
                  <TrendingUp className="w-3.5 h-3.5 text-brand-600" />
                  <span>Estimasi Laba</span>
                </div>
                <div className="text-lg sm:text-xl font-black text-brand-600 mt-1">
                  Rp{report.estimatedProfit.toLocaleString('id-ID')}
                </div>
                <div className="text-xs text-ink-400 mt-0.5">Margin ~40.5% (BP)</div>
              </div>

              <div className="bg-surface p-4 rounded-lg border border-paper-200">
                <div className="text-xs text-ink-500 font-bold uppercase">Target Omzet Akhir</div>
                <div className="text-lg sm:text-xl font-black text-ink-700 mt-1">
                  Rp4.786.000
                </div>
                <div className="text-xs text-ink-400 mt-0.5">Proyeksi Minggu 10-12</div>
              </div>
            </div>

            {/* Target Progress Bar */}
            <div className="bg-surface p-4 rounded-lg border border-paper-200 space-y-2">
              <div className="flex justify-between text-xs font-bold text-ink-800">
                <span>Progress Penjualan Target Pcs (Minggu 10 - 12)</span>
                <span>{report.totalPiecesSold} / 738 pcs</span>
              </div>
              <div className="w-full bg-paper-100 rounded-full h-3 overflow-hidden border border-paper-200">
                <div
                  className="bg-brand-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, (report.totalPiecesSold / 738) * 100)}%` }}
                />
              </div>
            </div>

            {/* Breakdown per menu */}
            <div className="bg-surface rounded-lg border border-paper-200 p-4 space-y-3">
              <h3 className="font-extrabold text-sm text-ink-900">Rincian Penjualan per Menu</h3>
              <div className="space-y-2">
                {Object.values(report.itemsBreakdown).length === 0 ? (
                  <p className="text-xs text-ink-400">Belum ada menu yang laku.</p>
                ) : (
                  Object.values(report.itemsBreakdown).map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between p-2.5 bg-paper-50 rounded-lg text-xs border border-paper-100"
                    >
                      <div>
                        <span className="font-bold text-ink-900">{item.name}</span>
                        <span className="text-ink-500 ml-2">({item.pieces} pcs)</span>
                      </div>
                      <span className="font-bold text-ink-900">
                        Rp{item.revenue.toLocaleString('id-ID')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

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
                className="flex-1 min-h-[48px] bg-ink-900 hover:bg-ink-800 text-surface px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Data CSV (Google Sheets)</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: TEAM */}
        {activeTab === 'team' && (
          <div className="bg-surface rounded-lg border border-paper-200 p-5 space-y-4">
            <div>
              <h2 className="font-extrabold text-base text-ink-900">
                Struktur Tim Kelompok 1 - Laris Manis
              </h2>
              <p className="text-xs text-ink-500">
                Mata Kuliah Kewirausahaan • Telkom University Jakarta • Dosen: DIS
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-brand-50 rounded-lg border border-brand-200">
                <span className="text-xs font-bold uppercase text-brand-700">Ketua Tim</span>
                <div className="font-black text-ink-900 mt-0.5">Muhammad Rayfan Pashya</div>
                <div className="text-ink-500 text-xs">NIM: 102042300174</div>
              </div>

              <div className="p-3 bg-paper-50 rounded-lg border border-paper-200">
                <span className="text-xs font-bold uppercase text-ink-500">
                  Produksi & R&D
                </span>
                <div className="font-bold text-ink-900 mt-0.5">
                  Afif Nur Sena, Qalam Raydathul Sabani, Fajar Maulana, Rachmat Akbar
                </div>
                <div className="text-ink-500 text-xs">Resep SOP, Uji Rasa, Packaging</div>
              </div>

              <div className="p-3 bg-paper-50 rounded-lg border border-paper-200">
                <span className="text-xs font-bold uppercase text-ink-500">
                  Marketing & Medsos
                </span>
                <div className="font-bold text-ink-900 mt-0.5">Vio Salman Kafiyan, Rayfan</div>
                <div className="text-ink-500 text-xs">Story IG, Poster PO, Desain Promo</div>
              </div>

              <div className="p-3 bg-paper-50 rounded-lg border border-paper-200">
                <span className="text-xs font-bold uppercase text-ink-500">Keuangan</span>
                <div className="font-bold text-ink-900 mt-0.5">Rayhan Arya Ardani, Adam Priyatna</div>
                <div className="text-ink-500 text-xs">Pencatatan Kas, Cashflow, Nota HPP</div>
              </div>

              <div className="p-3 bg-paper-50 rounded-lg border border-paper-200 sm:col-span-2">
                <span className="text-xs font-bold uppercase text-ink-500">
                  Penjualan & Operasional PO
                </span>
                <div className="font-bold text-ink-900 mt-0.5">
                  Yudi Hokiana, Willyansyah, Muhammad Fahmi Yusuf
                </div>
                <div className="text-ink-500 text-xs">
                  Verifikasi QRIS, Delivery Kampus, Pelayanan Konsumen
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
