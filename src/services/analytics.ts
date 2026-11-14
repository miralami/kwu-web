import type { Order, SalesReport } from '../types'

/*
  Sumber tunggal untuk angka penjualan: hari kalender Jakarta, definisi "pesanan dihitung",
  dan pembagian diskon ke tiap menu. Semua fungsi di sini murni (tanpa browser/DB) supaya
  bisa diuji: lihat tests/analytics.test.ts
*/

export const JAKARTA_TZ = 'Asia/Jakarta'
export const TARGET_PIECES = 738 // Business Plan hal. 5
export const TARGET_REVENUE = 4786000 // Proyeksi omzet Minggu 10-12
export const ESTIMATED_MARGIN = 0.405 // Laba kotor BP, bukan HPP real

const dayFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: JAKARTA_TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/**
 * Nomor hari kalender Jakarta (hari sejak 1970-01-01 UTC).
 * Dipakai agar pengelompokan harian tidak bergantung zona waktu perangkat.
 */
export function jakartaDayNumber(value: string | Date): number {
  const d = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return NaN
  const parts = dayFmt.formatToParts(d)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value)
  return Math.floor(Date.UTC(get('year'), get('month') - 1, get('day')) / 86400000)
}

const utcMidnight = (dayNumber: number) => new Date(dayNumber * 86400000)

export function dayNumberToKey(dayNumber: number): string {
  const d = utcMidnight(dayNumber)
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate()
  ).padStart(2, '0')}`
}

export function dayNumberToLabel(dayNumber: number): string {
  return utcMidnight(dayNumber).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })
}

/**
 * Kode pesanan: LM-DDMMYY-NNN. Tanggal = hari kalender Jakarta, NNN = urutan pesanan hari itu
 * (reset tiap hari, 001 dst). Lebih dari 999 pesanan sehari tetap benar: 1000, 1001, ...
 */
export function formatOrderCode(when: Date, sequence: number): string {
  const parts = dayFmt.formatToParts(when) // en-CA: tahun, bulan, hari
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00'
  return `LM-${get('day')}${get('month')}${get('year').slice(-2)}-${String(sequence).padStart(3, '0')}`
}

/** Pesanan dihitung sebagai penjualan hanya bila uangnya sudah diterima. */
export function isCountedOrder(o: Order): boolean {
  return o.orderStatus !== 'dibatalkan' && o.paymentStatus === 'verified'
}

/** Tunai yang belum ditandai lunas: tidak dihitung, tapi harus terlihat admin. */
export function isAwaitingCash(o: Order): boolean {
  return o.paymentMethod === 'tunai' && o.paymentStatus !== 'verified' && o.orderStatus !== 'dibatalkan'
}

/**
 * Bagi `target` ke beberapa `gross` secara proporsional, dibulatkan ke rupiah penuh
 * dan dijamin jumlahnya tepat `target`. Metode sisa terbesar (largest remainder).
 */
export function allocateAmounts(gross: number[], target: number): number[] {
  const out = gross.map(() => 0)
  const sum = gross.reduce((s, g) => s + g, 0)
  if (gross.length === 0 || sum <= 0 || target <= 0) return out

  const fractions: { i: number; f: number }[] = []
  let assigned = 0
  gross.forEach((g, i) => {
    const exact = (target * g) / sum
    const base = Math.floor(exact)
    out[i] = base
    assigned += base
    fractions.push({ i, f: exact - base })
  })

  let left = target - assigned
  if (left > 0) {
    fractions.sort((a, b) => b.f - a.f || a.i - b.i)
    for (let k = 0; k < fractions.length && left > 0; k++, left--) out[fractions[k].i] += 1
  } else if (left < 0) {
    fractions.sort((a, b) => a.f - b.f || a.i - b.i)
    for (let k = 0; k < fractions.length && left < 0; k++, left++) out[fractions[k].i] -= 1
  }
  return out
}

/**
 * Rekap penjualan. Semua angka = SEMUA WAKTU (bukan 21 hari) dan hanya pesanan lunas.
 * Omzet per menu dibagi setelah diskon, sehingga totalnya sama dengan totalRevenue.
 */
export function calculateSalesReport(orders: Order[]): SalesReport {
  const valid = orders.filter(isCountedOrder)
  let totalRevenue = 0
  let totalPiecesSold = 0
  let totalDiscount = 0
  const breakdown: SalesReport['itemsBreakdown'] = {}

  for (const order of valid) {
    totalRevenue += order.total
    totalDiscount += Math.max(0, order.subtotal - order.total)

    const gross = order.items.map((i) => i.price * i.quantity)
    const net = allocateAmounts(gross, order.total)

    order.items.forEach((item, idx) => {
      totalPiecesSold += item.pieces * item.quantity
      if (!breakdown[item.menuItemId]) {
        breakdown[item.menuItemId] = { name: item.name, pieces: 0, revenue: 0 }
      }
      breakdown[item.menuItemId].pieces += item.pieces * item.quantity
      breakdown[item.menuItemId].revenue += net[idx]
    })
  }

  return {
    totalRevenue,
    totalOrders: valid.length,
    totalPiecesSold,
    totalDiscount,
    targetPieces: TARGET_PIECES,
    targetRevenue: TARGET_REVENUE,
    estimatedProfit: Math.round(totalRevenue * ESTIMATED_MARGIN),
    itemsBreakdown: breakdown,
    awaitingCashCount: orders.filter(isAwaitingCash).length,
  }
}

export interface DailyPoint {
  key: string // YYYY-MM-DD (kalender Jakarta)
  label: string // "12 Nov"
  revenue: number
  orders: number
  pieces: number
}

export interface DailySeries {
  points: DailyPoint[]
  windowDays: number
  rangeLabel: string
  truncated: boolean
  omittedDays: number
  totalRevenue: number // hanya di dalam jendela yang ditampilkan
}

/**
 * Omzet per hari kalender Jakarta, maksimal `maxDays` hari terakhir sampai hari ini.
 * Hari tanpa penjualan tetap muncul sebagai 0. Hari lama yang terpotong dilaporkan
 * lewat `truncated`/`omittedDays`, bukan dihilangkan diam-diam.
 */
export function buildDailySeries(
  orders: Order[],
  opts: { maxDays?: number; now?: Date } = {}
): DailySeries {
  const maxDays = opts.maxDays ?? 21
  const today = jakartaDayNumber(opts.now ?? new Date())
  const counted = orders.filter(isCountedOrder)

  const byDay = new Map<number, { revenue: number; orders: number; pieces: number }>()
  let earliest = Infinity
  for (const o of counted) {
    const n = jakartaDayNumber(o.createdAt)
    if (!Number.isFinite(n)) continue
    if (n < earliest) earliest = n
    const cur = byDay.get(n) || { revenue: 0, orders: 0, pieces: 0 }
    cur.revenue += o.total
    cur.orders += 1
    cur.pieces += o.totalPieces
    byDay.set(n, cur)
  }

  if (!Number.isFinite(earliest)) {
    return { points: [], windowDays: 0, rangeLabel: '', truncated: false, omittedDays: 0, totalRevenue: 0 }
  }

  const windowStart = today - (maxDays - 1)
  const start = Math.max(earliest, windowStart)
  const points: DailyPoint[] = []
  let totalRevenue = 0

  for (let n = start; n <= today; n++) {
    const v = byDay.get(n) || { revenue: 0, orders: 0, pieces: 0 }
    totalRevenue += v.revenue
    points.push({ key: dayNumberToKey(n), label: dayNumberToLabel(n), ...v })
  }

  return {
    points,
    windowDays: points.length,
    rangeLabel: `${dayNumberToLabel(start)} – ${dayNumberToLabel(today)}`,
    truncated: earliest < windowStart,
    omittedDays: earliest < windowStart ? windowStart - earliest : 0,
    totalRevenue,
  }
}