import React, { useState, useEffect, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { MenuItem, MenuOption, CartItem, Order } from './types'
import { MENU_ITEMS } from './data/menu'
import { isOrderActive } from './data/orderStatus'
import {
  getOrders,
  saveOrder,
  updateOrderStatus,
  deleteOrder,
  subscribeOrders,
  generateOrderId,
  getMyOrderIds,
  rememberMyOrder,
  getOrdersByIds,
} from './services/storage'
import { MyOrdersBanner } from './components/customer/MyOrdersBanner'
import { Navbar } from './components/Navbar'
import { SectionDivider } from './components/SectionDivider'
import { MenuCatalog } from './components/customer/MenuCatalog'
import { OptionModal } from './components/customer/OptionModal'
import { CartDrawer } from './components/customer/CartDrawer'
import { OrderReceiptModal } from './components/customer/OrderReceiptModal'
import { AdminDashboard } from './components/admin/AdminDashboard'
import { AiChatbot } from './components/chat/AiChatbot'
import { Lock, ShoppingBag, ArrowRight } from 'lucide-react'

// Kata sandi tim. Bukan rahasia yang aman (ikut ter-bundle); cukup untuk menutup pintu dashboard.
const ADMIN_PASSWORDS = ['1234', '002', '2026']

function isAdminPathNow() {
  // Vercel mengarahkan /admin ke index.html lewat rewrite, jadi path dibaca dari location.
  return window.location.pathname.replace(/\/+$/, '').startsWith('/admin')
}

const isAdminPath = isAdminPathNow()

export function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [activeItemForOption, setActiveItemForOption] = useState<MenuItem | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  // Pesanan milik pelanggan di perangkat ini, statusnya disegarkan berkala dari server
  const [myOrders, setMyOrders] = useState<Order[]>([])
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null)
  const activeReceiptOrder = myOrders.find((o) => o.id === trackedOrderId) ?? null

  // Gerbang tim: halaman /admin hanya minta kata sandi. Bukan keamanan sungguhan —
  // nilainya ada di bundle — hanya penjaga pintu supaya pembeli tidak menyasar dashboard.
  const [isTeamed, setIsTeamed] = useState(false)
  const [passInput, setPassInput] = useState('')
  const [passError, setPassError] = useState(false)

  useEffect(() => {
    getOrders().then(setOrders)
    const unsubscribe = subscribeOrders(setOrders)
    return () => unsubscribe()
  }, [])

  const refreshMyOrders = useCallback(async () => {
    const fresh = await getOrdersByIds(getMyOrderIds())
    setMyOrders((prev) => {
      // Pertahankan pesanan yang belum terbaca dari server (mis. sinkronisasi masih tertunda)
      const freshIds = new Set(fresh.map((o) => o.id))
      return [...fresh, ...prev.filter((o) => !freshIds.has(o.id))]
    })
  }, [])

  // Segarkan saat dibuka, saat data lokal berubah (admin di perangkat yang sama),
  // dan saat pelanggan kembali ke tab
  useEffect(() => {
    refreshMyOrders()
  }, [orders, refreshMyOrders])

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshMyOrders()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [refreshMyOrders])

  // Polling hanya selama masih ada pesanan aktif, agar update admin dari HP lain ikut masuk
  const hasActiveOrder = myOrders.some(isOrderActive)
  useEffect(() => {
    if (!hasActiveOrder) return
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refreshMyOrders()
    }, 10000)
    return () => clearInterval(timer)
  }, [hasActiveOrder, refreshMyOrders])

  // Tampilkan pesanan aktif + yang baru selesai/dibatalkan dalam 12 jam terakhir
  const visibleMyOrders = myOrders.filter(
    (o) => isOrderActive(o) || Date.now() - new Date(o.createdAt).getTime() < 12 * 3600_000
  )

  const handleAddToCart = (
    item: MenuItem,
    option: MenuOption,
    quantity: number,
    notes: string = ''
  ) => {
    const id = `${item.id}-${option.id}`
    setCartItems((prev) => {
      const existing = prev.find((i) => i.id === id)
      if (existing) {
        return prev.map((i) =>
          i.id === id ? { ...i, quantity: i.quantity + quantity, notes: notes || i.notes } : i
        )
      }
      return [
        ...prev,
        {
          id,
          menuItemId: item.id,
          name: item.name,
          optionId: option.id,
          optionLabel: option.label,
          pieces: option.pieces,
          price: option.price,
          quantity,
          notes,
        },
      ]
    })
  }

  const handleQuickAdd = (item: MenuItem, option: MenuOption) => {
    handleAddToCart(item, option, 1)
  }

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i))
        .filter((i) => i.quantity > 0)
    )
  }

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id))
  }

  const handleCheckout = async (formData: {
    customerName: string
    customerPhone: string
    customerNotes: string
    paymentMethod: 'qris' | 'tunai'
  }) => {
    const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const totalPieces = cartItems.reduce((sum, item) => sum + item.pieces * item.quantity, 0)

    const newOrder: Order = {
      id: generateOrderId(),
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerClass: '', // form lokasi dihapus; kolom tetap ada di database (default kosong)
      items: [...cartItems],
      totalItems: cartItems.length,
      totalPieces,
      subtotal,
      discountAmount: 0,
      total: subtotal,
      paymentMethod: formData.paymentMethod,
      paymentStatus: 'pending', // tunai pun belum lunas sampai admin terima uangnya di booth
      orderStatus: 'menunggu_pembayaran',
      customerNotes: formData.customerNotes,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 15 * 60000).toISOString(),
    }

    await saveOrder(newOrder)
    rememberMyOrder(newOrder.id)
    setMyOrders((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)])

    try {
      confetti({
        particleCount: 60,
        spread: 55,
        origin: { y: 0.6 },
      })
    } catch {
      // Ignore
    }

    setCartItems([])
    setIsCartOpen(false)
    setTrackedOrderId(newOrder.id)
  }

  const handleVerifyPass = (e: React.FormEvent) => {
    e.preventDefault()
    if (ADMIN_PASSWORDS.includes(passInput)) {
      setIsTeamed(true)
      setPassInput('')
      setPassError(false)
    } else {
      setPassError(true)
    }
  }

  // Kunci scroll halaman utama selama modal (menu, keranjang, bukti pesanan) terbuka
  const isAnyModalOpen = isCartOpen || !!activeItemForOption || !!activeReceiptOrder
  useEffect(() => {
    if (!isAnyModalOpen) return
    const html = document.documentElement
    const prev = [html.style.overflow, document.body.style.overflow]
    html.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prev[0]
      document.body.style.overflow = prev[1]
    }
  }, [isAnyModalOpen])

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const cartSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // Halaman tim: /admin. Dashboard hanya dirender setelah kata sandi benar, sehingga
  // daftar pesanan tidak pernah terunduh sebelum gerbang lolos.
  if (isAdminPath) {
    if (!isTeamed) {
      return (
        <div className="min-h-screen bg-surface text-ink-900 flex items-center justify-center p-4">
          <div className="bg-surface rounded-xl p-6 max-w-xs w-full shadow-2xl space-y-4 text-center border border-paper-200">
            <div className="w-12 h-12 bg-paper-100 text-ink-900 rounded-full flex items-center justify-center mx-auto border border-paper-200">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-extrabold text-base text-ink-900">Akses Tim</h1>

            <form onSubmit={handleVerifyPass} className="space-y-3">
              <input
                type="password"
                autoFocus
                aria-label="Kata sandi"
                value={passInput}
                onChange={(e) => {
                  setPassInput(e.target.value)
                  setPassError(false)
                }}
                className="w-full min-h-[48px] text-center text-lg tracking-widest font-extrabold border border-paper-200 rounded-lg focus:outline-none focus:border-brand-600 bg-paper-50"
              />
              {passError && <p className="text-xs text-red-600 font-bold">Salah. Coba lagi.</p>}

              <button
                type="submit"
                className="w-full min-h-[44px] rounded-lg text-xs font-bold text-surface bg-ink-900 hover:bg-ink-800"
              >
                Masuk
              </button>
            </form>

            <a href="/" className="block text-xs text-ink-500 underline">
              Kembali ke halaman pemesanan
            </a>
          </div>
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-surface text-ink-900">
        <AdminDashboard
          orders={orders}
          onUpdateStatus={(id, oStatus, pStatus) => updateOrderStatus(id, oStatus, pStatus)}
          onDeleteOrder={(id) => deleteOrder(id)}
          onClose={() => {
            setIsTeamed(false)
            window.location.href = '/'
          }}
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface text-ink-900 flex flex-col justify-between pb-24 sm:pb-12">
      <div>
        <Navbar cartCount={totalCartCount} onOpenCart={() => setIsCartOpen(true)} />

        <main className="max-w-3xl mx-auto px-4 py-6">
          <MyOrdersBanner orders={visibleMyOrders} onOpenOrder={setTrackedOrderId} />
          <MenuCatalog
            items={MENU_ITEMS}
            onSelectItem={(item) => setActiveItemForOption(item)}
            onQuickAdd={handleQuickAdd}
            onViewCombo={() => {
              const comboItem = MENU_ITEMS.find((m) => m.id === 'paket-combo')
              if (comboItem) setActiveItemForOption(comboItem)
            }}
          />
        </main>
      </div>

      {/* Sticky Bottom Thumb-Zone Bar (Master Checklist 1.2.6 & 1.2.8) */}
      {totalCartCount > 0 && !isCartOpen && !activeReceiptOrder && (
        <div className="fixed bottom-0 inset-x-0 z-30 p-3 bg-surface/95 backdrop-blur-md border-t border-paper-200 shadow-lg">
          <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
            <div>
              <div className="text-xs text-ink-500 font-bold">
                Total ({totalCartCount} item)
              </div>
              <div className="text-base font-extrabold text-ink-900">
                Rp{cartSubtotal.toLocaleString('id-ID')}
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              className="min-h-[48px] bg-brand-600 hover:bg-brand-700 text-white px-5 rounded-lg text-xs sm:text-sm font-extrabold flex items-center gap-2 active:scale-[0.98] transition-all shadow-sm"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Lihat Pesanan & Bayar</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <footer className="mt-12 px-4 pb-6 text-center text-xs text-ink-400 max-w-3xl mx-auto w-full space-y-6">
        <SectionDivider />
        <p>Laris Manis · Tel-U Jakarta</p>
      </footer>

      {/* Option Picker Modal */}
      {activeItemForOption && (
        <OptionModal
          item={activeItemForOption}
          onClose={() => setActiveItemForOption(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />

      {/* Receipt & QRIS Modal */}
      <OrderReceiptModal
        order={activeReceiptOrder}
        onClose={() => setTrackedOrderId(null)}
      />

      {/* Floating AI Chatbot */}
      <AiChatbot />
    </div>
  )
}
export default App
