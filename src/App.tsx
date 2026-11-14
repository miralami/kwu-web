import React, { useState, useEffect, useCallback } from 'react'
import confetti from 'canvas-confetti'
import { MenuItem, MenuOption, CartItem, Order } from './types'
import { MENU_ITEMS } from './data/menu'
import { isOrderActive, isAwaitingPayment } from './data/orderStatus'
import {
  getOrders,
  updateOrderStatus,
  deleteOrder,
  cancelUnpaidOrder,
  subscribeOrders,
  createOrder,
  getMyOrderRefs,
  rememberMyOrder,
  getOrdersByRefs,
  isSupabaseConfigured,
  adminSignIn,
  adminHasSession,
  adminSignOut,
} from './services/storage'
import { MyOrdersBanner } from './components/customer/MyOrdersBanner'
import { Navbar } from './components/Navbar'
import { MenuCatalog } from './components/customer/MenuCatalog'
import { OptionModal } from './components/customer/OptionModal'
import { CartDrawer } from './components/customer/CartDrawer'
import { OrderReceiptModal } from './components/customer/OrderReceiptModal'
import { AdminDashboard } from './components/admin/AdminDashboard'
import { Lock } from 'lucide-react'

// Kata sandi tim. Bukan rahasia yang aman (ikut ter-bundle); cukup untuk menutup pintu dashboard.
const ADMIN_PASSWORDS = ['0202']
// Alamat halaman tim sengaja acak (bukan /admin) agar tidak mudah ditebak. Ini hanya
// penyamaran, bukan keamanan: nilainya ikut ter-bundle. Ganti di sini bila bocor.
const ADMIN_PATH = '/tim-d93fdb2daea0'

function isAdminPathNow() {
  // Vercel mengarahkan semua path ke index.html lewat rewrite, jadi path dibaca dari location.
  return window.location.pathname.replace(/\/+$/, '') === ADMIN_PATH
}

const isAdminPath = isAdminPathNow()

// Pesanan yang tidak kunjung dibayar berhenti dilacak di HP pembeli setelah 24 jam (tanpa
// scheduler di server); pesanan selesai/batal tetap terlihat 12 jam sebagai riwayat singkat.
const STALE_UNPAID_MS = 24 * 3600_000
const RECENT_DONE_MS = 12 * 3600_000

export function App() {
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [activeItemForOption, setActiveItemForOption] = useState<MenuItem | null>(null)
  const [isCartOpen, setIsCartOpen] = useState(false)
  // Pesanan milik pelanggan di perangkat ini, statusnya disegarkan berkala dari server
  const [myOrders, setMyOrders] = useState<Order[]>([])
  const [trackedOrderId, setTrackedOrderId] = useState<string | null>(null)
  const activeReceiptOrder = myOrders.find((o) => o.id === trackedOrderId) ?? null

  // Gerbang tim. Dengan Supabase: login Supabase Auth (email + kata sandi) dan akun harus
  // terdaftar di tabel admins; database sendiri yang menolak pembaca lain. Tanpa Supabase
  // (mode demo lokal): kata sandi di bawah, yang hanya penjaga pintu karena ikut ter-bundle.
  const [isTeamed, setIsTeamed] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [passInput, setPassInput] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  // Lanjutkan sesi admin yang masih berlaku
  useEffect(() => {
    if (!isAdminPath || !isSupabaseConfigured) return
    adminHasSession().then((ok) => ok && setIsTeamed(true))
  }, [])

  // Seluruh tabel pesanan (berisi nama & nomor WA semua pembeli) hanya dimuat dan
  // disiarkan realtime untuk tim yang sudah lolos gerbang tim. Pembeli cukup memuat
  // pesanannya sendiri lewat refreshMyOrders di bawah.
  useEffect(() => {
    if (!isAdminPath || !isTeamed) return
    getOrders().then(setOrders)
    const unsubscribe = subscribeOrders(setOrders)
    return () => unsubscribe()
  }, [isTeamed])

  const refreshMyOrders = useCallback(async () => {
    const fresh = await getOrdersByRefs(getMyOrderRefs())
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

  // Tampilkan pesanan aktif + yang baru selesai/dibatalkan; pesanan yang belum dibayar
  // lebih dari sehari dianggap ditinggalkan dan tidak dilacak lagi
  const visibleMyOrders = myOrders.filter((o) => {
    const age = Date.now() - new Date(o.createdAt).getTime()
    if (isAwaitingPayment(o)) return age < STALE_UNPAID_MS
    return isOrderActive(o) || age < RECENT_DONE_MS
  })

  // Polling hanya selama masih ada pesanan aktif, agar update admin dari HP lain ikut masuk
  const hasActiveOrder = visibleMyOrders.some(isOrderActive)
  useEffect(() => {
    if (!hasActiveOrder) return
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refreshMyOrders()
    }, 10000)
    return () => clearInterval(timer)
  }, [hasActiveOrder, refreshMyOrders])

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

  const handleSetQuantity = (id: string, quantity: number) => {
    setCartItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)))
  }

  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== id))
  }

  const handleCheckout = async (formData: {
    customerName: string
    customerPhone: string
    customerNotes: string
  }) => {
    const { order: newOrder, ref } = await createOrder({
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerNotes: formData.customerNotes,
      items: cartItems,
    })
    rememberMyOrder(ref)
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

  const handleCancelOrder = async (orderId: string) => {
    await cancelUnpaidOrder(orderId)
    await refreshMyOrders()
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoggingIn) return
    setIsLoggingIn(true)
    setLoginError('')
    try {
      if (isSupabaseConfigured) {
        await adminSignIn(emailInput, passInput)
      } else if (!ADMIN_PASSWORDS.includes(passInput)) {
        throw new Error('Salah. Coba lagi.')
      }
      setIsTeamed(true)
      setPassInput('')
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Gagal masuk. Coba lagi.')
    } finally {
      setIsLoggingIn(false)
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
  const cartQuantities = cartItems.reduce<Record<string, number>>((acc, i) => {
    acc[i.menuItemId] = (acc[i.menuItemId] ?? 0) + i.quantity
    return acc
  }, {})
  const showCartBar = totalCartCount > 0 && !isCartOpen && !activeReceiptOrder

  // Halaman tim (ADMIN_PATH). Dashboard hanya dirender setelah kata sandi benar, sehingga
  // daftar pesanan tidak pernah terunduh sebelum gerbang lolos.
  if (isAdminPath) {
    if (!isTeamed) {
      return (
        <div className="min-h-screen bg-royal-600 text-ink-900 flex items-center justify-center p-4">
          <div className="nota relative bg-surface p-6 pt-8 max-w-xs w-full shadow-[0_14px_28px_-10px_rgb(8_16_48/0.55)] space-y-4 text-center">
            <div className="nota-holes" aria-hidden="true" />
            <div className="w-12 h-12 bg-paper-100 text-royal-700 rounded-full flex items-center justify-center mx-auto border-2 border-dashed border-royal-600">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="font-display uppercase text-3xl leading-none text-brand-600">Akses Tim</h1>

            <form onSubmit={handleLogin} className="space-y-3">
              {isSupabaseConfigured && (
                <input
                  type="email"
                  autoFocus
                  autoComplete="username"
                  aria-label="Email admin"
                  placeholder="Email admin"
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value)
                    setLoginError('')
                  }}
                  className="w-full min-h-[48px] px-3 text-center border-2 border-paper-300 rounded-lg focus:outline-none focus:border-royal-600 bg-paper-50"
                />
              )}
              <input
                type="password"
                autoFocus={!isSupabaseConfigured}
                autoComplete="current-password"
                aria-label="Kata sandi"
                placeholder={isSupabaseConfigured ? 'Kata sandi' : undefined}
                value={passInput}
                onChange={(e) => {
                  setPassInput(e.target.value)
                  setLoginError('')
                }}
                className="w-full min-h-[48px] text-center text-lg tracking-widest font-extrabold border-2 border-paper-300 rounded-lg focus:outline-none focus:border-royal-600 bg-paper-50"
              />
              {loginError && (
                <p role="alert" className="text-sm text-red-700 font-bold">
                  {loginError}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full min-h-[48px] text-sm font-extrabold text-white bg-brand-600 hover:bg-brand-700 disabled:opacity-60"
              >
                {isLoggingIn ? 'Memeriksa...' : 'Masuk'}
              </button>
            </form>

            <a href="/" className="block min-h-[44px] leading-[44px] text-sm text-royal-700 underline">
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
          onClose={async () => {
            await adminSignOut()
            setIsTeamed(false)
            window.location.href = '/'
          }}
        />
      </div>
    )
  }

  return (
    <div
      className={`relative isolate overflow-x-clip min-h-screen bg-royal-600 text-ink-900 flex flex-col justify-between ${
        showCartBar ? 'pb-32' : 'pb-6'
      }`}
    >
      <div aria-hidden="true" className="ground-rays pointer-events-none -z-10" />
      <div>
        <Navbar cartCount={totalCartCount} onOpenCart={() => setIsCartOpen(true)} />

        <main className="max-w-xl mx-auto px-3 pt-12 pb-6 sm:pt-14 sm:pb-6">
          <MenuCatalog
            items={MENU_ITEMS}
            quantities={cartQuantities}
            onSelectItem={(item) => setActiveItemForOption(item)}
            onAdd={(item) => handleQuickAdd(item, item.options[0])}
            onRemove={(item) => handleUpdateQuantity(`${item.id}-${item.options[0].id}`, -1)}
            header={<MyOrdersBanner orders={visibleMyOrders} onOpenOrder={setTrackedOrderId} />}
          />
        </main>
      </div>

      {/* Bar bawah: garis sobek nota, jumlah, dan cap PESAN */}
      {showCartBar && (
        <div className="fixed bottom-0 inset-x-0 z-30 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-surface border-t-[3px] border-dashed border-royal-600 shadow-[0_-8px_20px_rgb(8_16_48/0.35)]">
          <div className="max-w-xl mx-auto flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-xs font-extrabold uppercase text-royal-700">Jumlah · {totalCartCount} item</div>
              <div key={cartSubtotal} className="bump font-display text-[1.7rem] leading-none text-brand-600 tabular-nums">
                Rp{cartSubtotal.toLocaleString('id-ID')}
              </div>
            </div>

            <button
              onClick={() => setIsCartOpen(true)}
              aria-label="Lihat pesanan dan bayar"
              className="stamp stamp-btn shrink-0 min-h-[52px] border-4 border-double border-brand-600 text-brand-600 bg-transparent px-5 font-display uppercase text-2xl leading-none"
            >
              Pesan
            </button>
          </div>
        </div>
      )}

      <footer className="mt-8 px-4 text-center text-xs text-white/80 max-w-xl mx-auto w-full">
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
        onSetQuantity={handleSetQuantity}
        onRemoveItem={handleRemoveItem}
        onCheckout={handleCheckout}
      />

      {/* Receipt & QRIS Modal */}
      <OrderReceiptModal
        key={trackedOrderId ?? 'none'}
        order={activeReceiptOrder}
        onClose={() => setTrackedOrderId(null)}
        onCancel={handleCancelOrder}
      />

    </div>
  )
}
export default App
