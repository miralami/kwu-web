import { CartItem, Order } from '../types'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const STORAGE_KEY = 'laris_manis_orders_v1'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const supabase: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null

/** True bila terhubung ke Supabase. Maka halaman tim memakai login Supabase, bukan kata sandi lokal. */
export const isSupabaseConfigured = supabase !== null

// Fungsi database belum dibuat (supabase/schema.sql belum dijalankan ulang): aplikasi tetap
// jalan dengan cara lama selama masa peralihan, lalu aman begitu schema.sql dijalankan.
function isMissingFunction(error: { code?: string; message?: string } | null): boolean {
  return !!error && (error.code === 'PGRST202' || /could not find the function/i.test(error.message ?? ''))
}

// --- Login admin (Supabase Auth) ---
// Semua admin memakai SATU akun bersama dan hanya mengetik PIN. Aplikasi hanya tahu email akun
// itu dan awalan kata sandinya; PIN-nya sendiri hanya ada di Supabase (Authentication > Users),
// jadi mengganti PIN cukup di sana tanpa deploy ulang. Supabase mewajibkan kata sandi minimal
// 6 karakter, itu sebabnya ada awalan. Hanya akun yang terdaftar di tabel admins yang dianggap admin.
// Karena akunnya bersama, keamanannya sebanding dengan kekuatan PIN: pakai PIN yang tidak mudah ditebak.
export const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL as string | undefined) || 'admin@laris-manis.app'
const ADMIN_PASSWORD_PREFIX = 'larismanis-'

export async function adminSignIn(pin: string): Promise<void> {
  if (!supabase) throw new Error('Supabase belum terhubung.')
  const { error } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD_PREFIX + pin.trim(),
  })
  if (error) throw new Error('Kata sandi salah. Coba lagi.')
  const { data } = await supabase.rpc('is_admin')
  if (data !== true) {
    await supabase.auth.signOut()
    throw new Error('Akun admin belum didaftarkan di database. Hubungi pengurus Supabase.')
  }
}

/** Sesi admin yang masih berlaku dari login sebelumnya (disimpan oleh Supabase di browser). */
export async function adminHasSession(): Promise<boolean> {
  if (!supabase) return false
  const { data } = await supabase.auth.getSession()
  if (!data.session) return false
  const res = await supabase.rpc('is_admin')
  return res.data === true
}

export async function adminSignOut(): Promise<void> {
  if (supabase) await supabase.auth.signOut()
}

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
        name: 'Mozzarella Sunda',
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

// Status sinkronisasi untuk indikator di dashboard admin:
//  live    = realtime Supabase tersambung (perubahan admin lain muncul seketika)
//  polling = realtime putus; dashboard tetap menyegarkan berkala sebagai cadangan
//  local   = tanpa Supabase; hanya sinkron antar-tab di perangkat yang sama
export type SyncState = 'idle' | 'live' | 'polling' | 'local'
let syncState: SyncState = 'idle'
const syncListeners = new Set<(s: SyncState) => void>()

function setSyncState(next: SyncState) {
  if (next === syncState) return
  syncState = next
  syncListeners.forEach((l) => l(next))
}

export function subscribeSyncState(listener: (s: SyncState) => void) {
  listener(syncState)
  syncListeners.add(listener)
  return () => {
    syncListeners.delete(listener)
  }
}

// Realtime Supabase: setiap perubahan di tabel orders (dari HP admin mana pun) memicu muat ulang.
// Rentetan kejadian digabung (debounce) agar satu aksi tidak memuat ulang berkali-kali.
let realtimeChannel: ReturnType<SupabaseClient['channel']> | null = null
let refetchTimer: ReturnType<typeof setTimeout> | null = null

function scheduleRefetch() {
  if (refetchTimer) clearTimeout(refetchTimer)
  refetchTimer = setTimeout(() => {
    refetchTimer = null
    getOrders().then(notifyListeners)
  }, 250)
}

function startRealtime() {
  if (!supabase) {
    setSyncState('local')
    return
  }
  if (realtimeChannel) return
  realtimeChannel = supabase
    .channel('orders-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, scheduleRefetch)
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setSyncState('live')
        scheduleRefetch() // kejar perubahan yang terlewat selama belum tersambung
      } else {
        setSyncState('polling')
      }
    })
}

function stopRealtime() {
  if (supabase && realtimeChannel) {
    supabase.removeChannel(realtimeChannel)
    realtimeChannel = null
  }
  setSyncState('idle')
}

// Mode lokal: tab lain di perangkat yang sama menulis ke localStorage
function onStorageEvent(e: StorageEvent) {
  if (e.key === STORAGE_KEY) getOrders().then(notifyListeners)
}

export function subscribeOrders(listener: OrderListener) {
  if (listeners.size === 0 && !supabase) window.addEventListener('storage', onStorageEvent)
  listeners.add(listener)
  startRealtime()
  return () => {
    listeners.delete(listener)
    if (listeners.size === 0) {
      window.removeEventListener('storage', onStorageEvent)
      stopRealtime()
    }
  }
}

function notifyListeners(orders: Order[]) {
  listeners.forEach((l) => l(orders))
}

// Hasil terakhir yang berhasil dimuat dari server. Bila satu pemuatan gagal (sinyal putus),
// dashboard tetap menampilkan data ini, bukan data contoh lokal.
let lastServerOrders: Order[] = []

export async function getOrders(): Promise<Order[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('createdAt', { ascending: false })
      if (!error && data) {
        lastServerOrders = data as Order[]
        return lastServerOrders
      }
    } catch (e) {
      console.warn('Supabase fetch failed:', e)
    }
    return lastServerOrders
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

/**
 * Verifikasi pembayaran: hanya berhasil bila pesanan MASIH belum dibayar dan belum dibatalkan.
 * Bila admin lain sudah memprosesnya lebih dulu, mengembalikan false dan tidak mengubah apa pun,
 * jadi dua admin yang menekan tombol bersamaan tidak saling menimpa.
 */
export async function verifyPayment(orderId: string): Promise<boolean> {
  if (supabase) {
    const { data, error } = await supabase
      .from('orders')
      .update({ orderStatus: 'sedang_diproses', paymentStatus: 'verified' })
      .eq('id', orderId)
      .eq('paymentStatus', 'pending')
      .neq('orderStatus', 'dibatalkan')
      .select('id')
    if (error) {
      console.error('Failed to verify payment on Supabase:', error)
      throw new Error('Gagal memverifikasi di server. Periksa koneksi lalu coba lagi.')
    }
    getOrders().then(notifyListeners)
    return (data?.length ?? 0) > 0
  }

  const current = await getOrders()
  const target = current.find((o) => o.id === orderId)
  if (!target || target.paymentStatus !== 'pending' || target.orderStatus === 'dibatalkan') return false
  const updated = current.map((o) =>
    o.id === orderId ? { ...o, orderStatus: 'sedang_diproses' as const, paymentStatus: 'verified' as const } : o
  )
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  notifyListeners(updated)
  return true
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
import { formatOrderCode } from './analytics'

// --- Pesanan milik pembeli di perangkat ini ---
// Pembeli tidak punya akun. Tiap pesanan punya token rahasia dari server; HP menyimpan pasangan
// {id, token} dan hanya dengan pasangan itu pesanan bisa dilihat atau dibatalkan (lihat
// get_my_orders / cancel_my_order di schema.sql). Kode pesanan sendiri berurutan, jadi
// mudah ditebak dan sengaja tidak cukup untuk membuka pesanan orang lain.

const MY_ORDERS_KEY = 'laris_manis_my_orders_v2'
const LEGACY_MY_ORDERS_KEY = 'laris_manis_my_orders_v1'
// Batas pesanan yang diingat per HP; yang lebih lama dilepas dari daftar "Pesanan Saya"
const MAX_MY_ORDERS = 20

export interface OrderRef {
  id: string
  token: string
}

export function getMyOrderRefs(): OrderRef[] {
  try {
    const raw = localStorage.getItem(MY_ORDERS_KEY)
    const list = raw ? JSON.parse(raw) : []
    const refs: OrderRef[] = Array.isArray(list)
      ? list.filter((r) => r && typeof r.id === 'string' && typeof r.token === 'string')
      : []
    if (refs.length > 0 || supabase) return refs
    // Mode lokal: ambil daftar lama (hanya id), tidak butuh token
    const legacy = JSON.parse(localStorage.getItem(LEGACY_MY_ORDERS_KEY) || '[]')
    return Array.isArray(legacy) ? legacy.map((id: string) => ({ id, token: '' })) : []
  } catch {
    return []
  }
}

export function rememberMyOrder(ref: OrderRef): void {
  try {
    const refs = [ref, ...getMyOrderRefs().filter((r) => r.id !== ref.id)].slice(0, MAX_MY_ORDERS)
    localStorage.setItem(MY_ORDERS_KEY, JSON.stringify(refs))
  } catch {
    // Penyimpanan diblokir (mis. mode privat): pelacakan hanya berlaku selama tab terbuka
  }
}

/**
 * Buat pesanan. Dengan Supabase, SERVER yang menentukan kode, status awal (QRIS + belum bayar),
 * dan total, sehingga pembeli tidak bisa membuat pesanan yang sudah "lunas". Token rahasia
 * dikembalikan satu kali dan disimpan di HP ini.
 */
export async function createOrder(input: {
  customerName: string
  customerPhone: string
  customerNotes: string
  items: CartItem[]
}): Promise<{ order: Order; ref: OrderRef }> {
  if (supabase) {
    const { data, error } = await supabase.rpc('create_order', {
      p_name: input.customerName,
      p_phone: input.customerPhone,
      p_notes: input.customerNotes,
      p_items: input.items,
    })
    if (!error && data && typeof data === 'object') {
      const { accessToken, ...order } = data as Order & { accessToken: string }
      return { order: order as Order, ref: { id: order.id, token: accessToken } }
    }
    if (!isMissingFunction(error)) {
      console.error('Failed to create order on Supabase:', error)
      throw new Error('Pesanan gagal terkirim ke server. Periksa koneksi internet lalu coba lagi.')
    }
    console.warn('create_order belum ada di database, memakai cara lama sementara.')
  }

  // Mode lokal, atau masa peralihan sebelum schema.sql dijalankan
  const subtotal = input.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const order: Order = {
    id: await generateOrderCode(),
    customerName: input.customerName,
    customerPhone: input.customerPhone,
    customerClass: '',
    items: [...input.items],
    totalItems: input.items.length,
    totalPieces: input.items.reduce((sum, i) => sum + i.pieces * i.quantity, 0),
    subtotal,
    discountAmount: 0,
    total: subtotal,
    paymentMethod: 'qris', // checkout online selalu QRIS; tunai hanya lewat kasir walk-in
    paymentStatus: 'pending', // baru dihitung omzet setelah admin memverifikasi mutasi
    orderStatus: 'menunggu_pembayaran',
    customerNotes: input.customerNotes,
    createdAt: new Date().toISOString(),
    expiresAt: new Date().toISOString(), // kolom wajib di database; batas bayar sudah tidak dipakai
  }
  await saveOrder(order)
  return { order, ref: { id: order.id, token: '' } }
}

// Ambil pesanan milik pembeli saja (bukan seluruh tabel) agar status terbaru dari admin
// bisa dibaca pelanggan di HP-nya sendiri.
export async function getOrdersByRefs(refs: OrderRef[]): Promise<Order[]> {
  if (refs.length === 0) return []
  const byNewest = (a: Order, b: Order) => b.createdAt.localeCompare(a.createdAt)

  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('get_my_orders', { p_refs: refs })
      if (!error && Array.isArray(data)) return (data as Order[]).sort(byNewest)
      if (isMissingFunction(error)) {
        const legacy = await supabase.from('orders').select('*').in('id', refs.map((r) => r.id))
        if (!legacy.error && legacy.data) return (legacy.data as Order[]).sort(byNewest)
      }
    } catch (e) {
      console.warn('Supabase fetch failed, fallback to local:', e)
    }
  }

  const ids = new Set(refs.map((r) => r.id))
  return (await getOrders()).filter((o) => ids.has(o.id))
}

// Pembeli membatalkan pesanannya sendiri. Hanya berlaku selama belum dibayar: bila admin
// sudah memverifikasi di saat yang sama, server tidak mengubah apa pun.
export async function cancelUnpaidOrder(orderId: string): Promise<void> {
  const token = getMyOrderRefs().find((r) => r.id === orderId)?.token ?? ''

  if (supabase) {
    const { error } = await supabase.rpc('cancel_my_order', { p_id: orderId, p_token: token })
    if (!error) return
    if (!isMissingFunction(error)) {
      console.error('Failed to cancel order on Supabase:', error)
      throw new Error('Pesanan gagal dibatalkan. Periksa koneksi internet lalu coba lagi.')
    }
    const legacy = await supabase
      .from('orders')
      .update({ orderStatus: 'dibatalkan' })
      .eq('id', orderId)
      .eq('paymentStatus', 'pending')
      .eq('orderStatus', 'menunggu_pembayaran')
    if (legacy.error) throw new Error('Pesanan gagal dibatalkan. Periksa koneksi internet lalu coba lagi.')
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

// Kode pesanan LM-DDMMYY-NNN, urutan reset tiap hari (hari kalender Jakarta).
// Dipakai kasir admin dan mode lokal. Dengan Supabase, nomor diambil dari fungsi database
// next_order_code() (atomik, tidak pernah kembar). Pembeli memakai create_order di atas.
export async function generateOrderCode(): Promise<string> {
  const now = new Date()
  if (supabase) {
    const { data, error } = await supabase.rpc('next_order_code')
    if (!error && typeof data === 'string' && data) return data
    // Fungsi belum dibuat / bukan admin: jangan blokir, pakai nomor cadangan 9xx
    console.warn('next_order_code belum tersedia, memakai nomor cadangan:', error)
    return formatOrderCode(now, 900 + Math.floor(Math.random() * 100))
  }
  const dayKey = formatOrderCode(now, 0).slice(0, -3) // "LM-141125-"
  const today = (await getOrders()).filter((o) => o.id.startsWith(dayKey)).length
  return formatOrderCode(now, today + 1)
}
