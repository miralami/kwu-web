export type ProductCategory = 'semua' | 'gurih' | 'manis'

export interface MenuOption {
  id: string
  label: string // e.g. "1 pcs", "2 pcs"
  pieces: number
  price: number
  savings?: number // e.g. 1000
}

export interface MenuItem {
  id: string
  name: string
  category: 'gurih' | 'manis'
  tagline: string
  description: string
  image: string
  options: MenuOption[]
  isPopular?: boolean
}

export interface CartItem {
  id: string // unique item key in cart (menuId + optionId)
  menuItemId: string
  name: string
  optionId: string
  optionLabel: string
  pieces: number
  price: number
  quantity: number
  notes?: string
}

// 'tunai' hanya dari kasir walk-in (uang diterima langsung di booth); checkout online selalu QRIS
export type PaymentMethod = 'qris' | 'tunai'

export type PaymentStatus = 'pending' | 'verified' | 'rejected'

export type OrderStatus =
  | 'menunggu_pembayaran'
  | 'menunggu_verifikasi'
  | 'sedang_diproses'
  | 'siap_diambil'
  | 'selesai'
  | 'dibatalkan'

export interface Order {
  id: string // e.g. LM-8492
  customerName: string
  customerPhone: string
  customerClass: string // e.g. S1SI-02 / Lantai 3
  pickupTime?: string
  items: CartItem[]
  totalItems: number
  totalPieces: number
  subtotal: number
  discountAmount: number
  referralCode?: string
  total: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  orderStatus: OrderStatus
  customerNotes?: string
  adminNotes?: string
  createdAt: string
  accessToken?: string // hanya dikembalikan sekali saat pesanan dibuat; rahasia milik pembeli
  expiresAt: string // tidak dipakai lagi (batas bayar dihapus); tetap diisi karena kolom database wajib
}

export interface SalesReport {
  totalRevenue: number
  totalOrders: number
  totalPiecesSold: number
  totalDiscount: number
  targetPieces: number
  targetRevenue: number
  estimatedProfit: number
  awaitingCashCount: number
  itemsBreakdown: {
    [key: string]: {
      name: string
      pieces: number
      revenue: number
    }
  }
}
