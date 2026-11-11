import { Order, SalesReport } from '../types'
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

export function subscribeOrders(listener: OrderListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
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
  const current = await getOrders()
  const updated = [order, ...current.filter((o) => o.id !== order.id)]

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  notifyListeners(updated)

  if (supabase) {
    try {
      await supabase.from('orders').upsert(order)
    } catch (e) {
      console.error('Failed to sync order to Supabase:', e)
    }
  }
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
    try {
      await supabase
        .from('orders')
        .update({
          orderStatus,
          ...(paymentStatus ? { paymentStatus } : {}),
        })
        .eq('id', orderId)
    } catch (e) {
      console.error('Failed to update status on Supabase:', e)
    }
  }
}

export async function deleteOrder(orderId: string): Promise<void> {
  const current = await getOrders()
  const updated = current.filter((o) => o.id !== orderId)

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  notifyListeners(updated)

  if (supabase) {
    try {
      await supabase.from('orders').delete().eq('id', orderId)
    } catch (e) {
      console.error('Failed to delete on Supabase:', e)
    }
  }
}

export function calculateSalesReport(orders: Order[]): SalesReport {
  // Only count verified payments or completed orders
  const validOrders = orders.filter(
    (o) =>
      o.orderStatus !== 'dibatalkan' &&
      (o.paymentStatus === 'verified' || o.paymentMethod === 'tunai' || o.orderStatus === 'selesai')
  )

  let totalRevenue = 0
  let totalPiecesSold = 0
  const breakdown: SalesReport['itemsBreakdown'] = {}

  for (const order of validOrders) {
    totalRevenue += order.total
    for (const item of order.items) {
      const pieces = item.pieces * item.quantity
      totalPiecesSold += pieces

      if (!breakdown[item.menuItemId]) {
        breakdown[item.menuItemId] = {
          name: item.name,
          pieces: 0,
          revenue: 0,
        }
      }
      breakdown[item.menuItemId].pieces += pieces
      breakdown[item.menuItemId].revenue += item.price * item.quantity
    }
  }

  // Estimated gross margin is ~40.5% as per Business Plan
  const estimatedProfit = Math.round(totalRevenue * 0.405)

  return {
    totalRevenue,
    totalOrders: validOrders.length,
    totalPiecesSold,
    targetPieces: 738, // Target from Business Plan page 5
    estimatedProfit,
    itemsBreakdown: breakdown,
  }
}

// Generate unique order ID: LM-XXXX
export function generateOrderId(): string {
  const num = Math.floor(1000 + Math.random() * 9000)
  return `LM-${num}`
}
