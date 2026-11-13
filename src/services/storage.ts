import { Order } from '../types'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const STORAGE_KEY = 'laris_manis_orders_v1'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

// Initial seed orders for demonstration
const INITIAL_SEED_ORDERS: Order[] = [
  {
    id: 'LM-1001',
    customerName: 'Rayhan Arya',
    customerPhone: '081234567890',
    customerClass: 'S1SI-KJ-23-002',
    pickupTime: '12:30',
    items: [
      {
        id: 'cibay-pedas-cibay-2',
        menuItemId: 'cibay-pedas',
        name: 'Cibay Lumer Gurih',
        optionId: 'cibay-2',
        optionLabel: '2 Pcs (Paling Laris)',
        pieces: 2,
        price: 5000,
        quantity: 2,
        notes: 'Bumbu cabai dipisah',
      },
      {
        id: 'puding-karamel-puding-std',
        menuItemId: 'puding-karamel',
        name: 'Puding Karamel & Buah Dingin',
        optionId: 'puding-std',
        optionLabel: '1 Cup Reguler (Segar Dingin)',
        pieces: 1,
        price: 10000,
        quantity: 1,
      },
    ],
    totalItems: 3,
    totalPieces: 5,
    subtotal: 20000,
    discountAmount: 1000,
    referralCode: 'RAWONSETO',
    total: 19000,
    paymentMethod: 'qris',
    paymentStatus: 'verified',
    orderStatus: 'selesai',
    customerNotes: 'Kirim ke lab lantai 3',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    expiresAt: new Date(Date.now() - 3600000 * 2.75).toISOString(),
  },
  {
    id: 'LM-1002',
    customerName: 'Dosen Pak Ardi',
    customerPhone: '085717600986',
    customerClass: 'Ruang Dosen Lt 2',
    pickupTime: '13:00',
    items: [
      {
        id: 'paket-combo-combo-super',
        menuItemId: 'paket-combo',
        name: 'Paket Combo Juara (Cibay + Roll)',
        optionId: 'combo-super',
        optionLabel: '1 Paket (2 Cibay + 2 Roll)',
        pieces: 4,
        price: 13000,
        quantity: 2,
      },
      {
        id: 'puding-karamel-puding-premium',
        menuItemId: 'puding-karamel',
        name: 'Puding Karamel & Buah Dingin',
        optionId: 'puding-premium',
        optionLabel: '1 Cup Jumbo Extra Buah',
        pieces: 1,
        price: 12000,
        quantity: 2,
      },
    ],
    totalItems: 4,
    totalPieces: 10,
    subtotal: 50000,
    discountAmount: 0,
    total: 50000,
    paymentMethod: 'qris',
    paymentStatus: 'verified',
    orderStatus: 'sedang_diproses',
    customerNotes: 'Jangan terlalu pedas',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    expiresAt: new Date(Date.now() + 1800000).toISOString(),
  },
]

// Listeners for in-app reactive updates
type OrderListener = (orders: Order[]) => void
const listeners: Set<OrderListener> = new Set()

// Realtime Supabase: setiap perubahan di tabel orders (dari HP mana pun) memicu muat ulang
let realtimeChannel: ReturnType<SupabaseClient['channel']> | null = null

function startRealtime() {
  if (!supabase || realtimeChannel) return
  realtimeChannel = supabase
    .channel('orders-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
      getOrders().then(notifyListeners)
    })
    .subscribe()
}

function stopRealtime() {
  if (supabase && realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }
}

export function subscribeOrders(listener: OrderListener) {
  listeners.add(listener)
  startRealtime()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) stopRealtime()
  }
}

function notifyListeners(orders: Order[]) {
  listeners.forEach((l) => l(orders))
}

export async function getOrders(): Promise<Order[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('createdAt', { ascending: false })
      if (!error && data) {
        return data as Order[]
      }
    } catch (e) {
      console.warn('Supabase fetch failed, fallback to local:', e)
    }
  }

  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_SEED_ORDERS))
    return INITIAL_SEED_ORDERS
  }
  try {
    return JSON.parse(raw) as Order[]
  } catch {
    return INITIAL_SEED_ORDERS
  }
}

export async function saveOrder(order: Order): Promise<void> {
  // Simpan ke server dulu: kalau gagal, pesanan tidak boleh dianggap terkirim karena
  // admin tidak akan pernah melihatnya
  if (supabase) {
    const { error } = await supabase.from('orders').insert(order)
    if (error) {
      console.error('Failed to save order to Supabase:', error)
      throw new Error('Pesanan gagal terkirim ke server. Periksa koneksi internet lalu coba lagi.')
    }
  }

  const current = await getOrders()
  const updated = [order, ...current.filter((o) => o.id !== order.id)]

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  notifyListeners(updated)
}

export async function updateOrderStatus(
  orderId: string,
  orderStatus: Order['orderStatus'],
  paymentStatus?: Order['paymentStatus']
): Promise<void> {
  const current = await getOrders()
  const updated = current.map((order) => {
    if (order.id === orderId) {
      return {
        ...order,
        orderStatus,
        paymentStatus: paymentStatus ?? order.paymentStatus,
      }
    }
    return order
  })

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  notifyListeners(updated)

  if (supabase) {
    const { error } = await supabase
      .from('orders')
      .update({
        orderStatus,
        ...(paymentStatus ? { paymentStatus } : {}),
      })
      .eq('id', orderId)
    if (error) {
      console.error('Failed to update status on Supabase:', error)
      alert('Gagal memperbarui status di server. Periksa koneksi lalu coba lagi.')
      getOrders().then(notifyListeners) // kembalikan tampilan ke data server
    }
  }
}

export async function deleteOrder(orderId: string): Promise<void> {
  const current = await getOrders()
  const updated = current.filter((o) => o.id !== orderId)

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  notifyListeners(updated)

  if (supabase) {
    const { error } = await supabase.from('orders').delete().eq('id', orderId)
    if (error) {
      console.error('Failed to delete on Supabase:', error)
      alert('Gagal menghapus pesanan di server. Periksa koneksi lalu coba lagi.')
      getOrders().then(notifyListeners)
    }
  }
}

// Definisi "penjualan sah", rekap, dan seri harian tinggal di services/analytics.ts
// (fungsi murni + teruji). Diekspor ulang di sini agar import lama tetap jalan.
export { isCountedOrder, calculateSalesReport } from './analytics'

// --- Pelacakan pesanan milik pelanggan di perangkat ini ---

const MY_ORDERS_KEY = 'laris_manis_my_orders_v1'

export function getMyOrderIds(): string[] {
  try {
    const raw = localStorage.getItem(MY_ORDERS_KEY)
    const ids = raw ? JSON.parse(raw) : []
    return Array.isArray(ids) ? ids : []
  } catch {
    return []
  }
}

export function rememberMyOrder(orderId: string): void {
  try {
    const ids = [orderId, ...getMyOrderIds().filter((id) => id !== orderId)].slice(0, 10)
    localStorage.setItem(MY_ORDERS_KEY, JSON.stringify(ids))
  } catch {
    // Penyimpanan diblokir (mis. mode privat): pelacakan hanya berlaku selama tab terbuka
  }
}

// Ambil pesanan tertentu saja (bukan seluruh tabel) agar status terbaru dari admin
// bisa dibaca pelanggan di HP-nya sendiri.
export async function getOrdersByIds(ids: string[]): Promise<Order[]> {
  if (ids.length === 0) return []

  if (supabase) {
    try {
      const { data, error } = await supabase.from('orders').select('*').in('id', ids)
      if (!error && data) {
        return (data as Order[]).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      }
    } catch (e) {
      console.warn('Supabase fetch failed, fallback to local:', e)
    }
  }

  const local = await getOrders()
  return local.filter((o) => ids.includes(o.id))
}

// Generate unique order ID: LM-XXXXXX
// 6 digit (900 ribu kombinasi): dengan 4 digit, ratusan pesanan hampir pasti ada yang bentrok
export function generateOrderId(): string {
  const num = Math.floor(100000 + Math.random() * 900000)
  return `LM-${num}`
}
