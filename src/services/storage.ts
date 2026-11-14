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
    customerName: 'Contoh Pembeli 1',
    customerPhone: '081200000001',
    customerClass: '',
    items: [
      {
        id: 'cibay-pedas-cibay-porsi',
        menuItemId: 'cibay-pedas',
        name: 'Mozarela Sunda',
        optionId: 'cibay-porsi',
        optionLabel: '1 Porsi (Isi 3 Pcs)',
        pieces: 3,
        price: 10000,
        quantity: 1,
      },
      {
        id: 'puding-karamel-puding-cup',
        menuItemId: 'puding-karamel',
        name: 'Puding Buah',
        optionId: 'puding-cup',
        optionLabel: '1 Cup',
        pieces: 1,
        price: 15000,
        quantity: 1,
      },
    ],
    totalItems: 2,
    totalPieces: 4,
    subtotal: 25000,
    discountAmount: 0,
    total: 25000,
    paymentMethod: 'qris',
    paymentStatus: 'verified',
    orderStatus: 'selesai',
    customerNotes: 'Contoh data, bukan pesanan sungguhan',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    expiresAt: new Date(Date.now() - 3600000 * 3).toISOString(),
  },
  {
    id: 'LM-1002',
    customerName: 'Contoh Pembeli 2',
    customerPhone: '081200000002',
    customerClass: '',
    items: [
      {
        id: 'ramyeon-roll-roll-porsi',
        menuItemId: 'ramyeon-roll',
        name: 'Spicy Ramyeon Roll',
        optionId: 'roll-porsi',
        optionLabel: '1 Porsi (Isi 4 Pcs)',
        pieces: 4,
        price: 10000,
        quantity: 1,
      },
    ],
    totalItems: 1,
    totalPieces: 4,
    subtotal: 10000,
    discountAmount: 0,
    total: 10000,
    paymentMethod: 'qris',
    paymentStatus: 'verified',
    orderStatus: 'sedang_diproses',
    customerNotes: 'Contoh data, bukan pesanan sungguhan',
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    expiresAt: new Date(Date.now() - 1800000).toISOString(),
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

// Pembeli membatalkan pesanannya sendiri. Hanya berlaku selama belum dibayar: bila admin
// sudah memverifikasi di saat yang sama, tidak ada baris yang cocok dan tidak ada yang berubah.
// Sengaja tidak memuat seluruh tabel: pembeli hanya menyentuh pesanannya sendiri.
export async function cancelUnpaidOrder(orderId: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase
      .from('orders')
      .update({ orderStatus: 'dibatalkan' })
      .eq('id', orderId)
      .eq('paymentStatus', 'pending')
      .eq('orderStatus', 'menunggu_pembayaran')
    if (error) {
      console.error('Failed to cancel order on Supabase:', error)
      throw new Error('Pesanan gagal dibatalkan. Periksa koneksi internet lalu coba lagi.')
    }
    return
  }

  const current = await getOrders()
  const updated = current.map((o) =>
    o.id === orderId && o.paymentStatus === 'pending' && o.orderStatus === 'menunggu_pembayaran'
      ? { ...o, orderStatus: 'dibatalkan' as const }
      : o
  )
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  notifyListeners(updated)
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
