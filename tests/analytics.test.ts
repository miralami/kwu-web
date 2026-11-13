import test from 'node:test'
import assert from 'node:assert/strict'
import {
  allocateAmounts,
  buildDailySeries,
  calculateSalesReport,
  isAwaitingCash,
  isCountedOrder,
  jakartaDayNumber,
} from '../src/services/analytics.ts'

// Fixture minimal; tipe Order di src/types tidak diimpor agar node bisa menjalankan file ini langsung.
function order(over: Record<string, any> = {}) {
  const items = over.items ?? [
    {
      id: 'cibay-lumer__reguler',
      menuItemId: 'cibay-lumer',
      name: 'Cibay Lumer',
      optionId: 'reguler',
      optionLabel: 'Reguler (3 pcs)',
      pieces: 3,
      price: 10000,
      quantity: 1,
    },
  ]
  const subtotal = items.reduce((s: number, i: any) => s + i.price * i.quantity, 0)
  const discountAmount = over.discountAmount ?? 0
  return {
    id: 'LM-2000',
    customerName: 'Test',
    customerPhone: '08123456789',
    customerClass: 'SI-23',
    items,
    totalItems: items.length,
    totalPieces: items.reduce((s: number, i: any) => s + i.pieces * i.quantity, 0),
    subtotal,
    discountAmount,
    total: subtotal - discountAmount,
    paymentMethod: 'qris',
    paymentStatus: 'pending',
    orderStatus: 'menunggu_pembayaran',
    customerNotes: '',
    createdAt: '2026-11-13T02:00:00.000Z',
    expiresAt: '2026-11-13T02:15:00.000Z',
    ...over,
  } as any
}

test('hanya pesanan lunas yang dihitung sebagai penjualan', () => {
  assert.equal(isCountedOrder(order()), false) // QRIS pending
  assert.equal(
    isCountedOrder(order({ paymentMethod: 'tunai', paymentStatus: 'pending' })),
    false // tunai belum diserahkan
  )
  assert.equal(isCountedOrder(order({ paymentStatus: 'verified' })), true)
  assert.equal(
    isCountedOrder(order({ paymentStatus: 'verified', orderStatus: 'dibatalkan' })),
    false // batal tidak dihitung walau pernah lunas
  )
  assert.equal(
    isCountedOrder(order({ paymentStatus: 'pending', orderStatus: 'selesai' })),
    false // "selesai" tidak lagi berarti lunas
  )
})

test('tunai pending terdeteksi sebagai kas menunggu', () => {
  assert.equal(isAwaitingCash(order({ paymentMethod: 'tunai', paymentStatus: 'pending' })), true)
  assert.equal(isAwaitingCash(order({ paymentMethod: 'tunai', paymentStatus: 'verified' })), false)
  assert.equal(isAwaitingCash(order({ paymentMethod: 'qris', paymentStatus: 'pending' })), false)
})

test('hari kalender Jakarta: tengah malam WIB tidak pecah ke hari sebelumnya', () => {
  const siang = jakartaDayNumber('2026-11-13T05:00:00.000Z') // 12:00 WIB
  const tengahMalam = jakartaDayNumber('2026-11-12T17:30:00.000Z') // 00:30 WIB, 13 Nov
  const malamSebelumnya = jakartaDayNumber('2026-11-12T16:30:00.000Z') // 23:30 WIB, 12 Nov
  assert.equal(siang, tengahMalam)
  assert.equal(malamSebelumnya, siang - 1)
})

test('diskon dibagi ke item sehingga total menu = total omzet', () => {
  const items = [
    {
      id: 'cibay-lumer__reguler',
      menuItemId: 'cibay-lumer',
      name: 'Cibay Lumer',
      optionId: 'reguler',
      optionLabel: 'Reguler (3 pcs)',
      pieces: 3,
      price: 10000,
      quantity: 1,
    },
    {
      id: 'spicy-ramyeon-roll__two',
      menuItemId: 'spicy-ramyeon-roll',
      name: 'Spicy Ramyeon Roll',
      optionId: 'two',
      optionLabel: '2 pcs',
      pieces: 2,
      price: 5000,
      quantity: 2,
    },
  ]
  const o = order({ items, discountAmount: 3000, paymentStatus: 'verified' })
  const report = calculateSalesReport([o])
  const sumItems = Object.values(report.itemsBreakdown).reduce((s, i) => s + i.revenue, 0)
  assert.equal(report.totalRevenue, o.total)
  assert.equal(sumItems, report.totalRevenue)
  assert.equal(report.totalDiscount, 3000)
  assert.equal(report.totalPiecesSold, 7)
})

test('pembagian rupiah selalu tepat, tidak pernah lebih/kurang 1 rupiah', () => {
  assert.deepEqual(allocateAmounts([20000], 19000), [19000])
  assert.deepEqual(allocateAmounts([10000, 10000], 19000), [9500, 9500])
  const uneven = allocateAmounts([30000, 20000, 20000], 61999)
  assert.equal(
    uneven.reduce((s, v) => s + v, 0),
    61999
  )
  assert.deepEqual(allocateAmounts([0, 0], 5000), [0, 0])
})

test('omzet harian: hari kosong tetap 0, hari tanpa data sama sekali tidak dihitung', () => {
  const orders = [
    order({ paymentStatus: 'verified', createdAt: '2026-11-13T02:00:00.000Z' }),
    order({ paymentStatus: 'pending', createdAt: '2026-11-13T03:00:00.000Z' }), // tidak lunas
  ]
  const series = buildDailySeries(orders, { now: new Date('2026-11-13T05:00:00.000Z'), maxDays: 5 })
  assert.equal(series.points.length, 1)
  assert.equal(series.points[0].label.toLowerCase().includes('13'), true)
  assert.equal(series.points[0].revenue, 10000)
  assert.equal(series.totalRevenue, 10000)
  assert.equal(series.truncated, false)
  assert.equal(buildDailySeries([], {}).points.length, 0)
})

test('jendela grafik terpotong secara jujur, bukan diam-diam', () => {
  const orders = [
    order({ paymentStatus: 'verified', createdAt: '2026-10-01T02:00:00.000Z' }), // 43 hari lalu
    order({ paymentStatus: 'verified', createdAt: '2026-11-12T02:00:00.000Z' }),
    order({ paymentStatus: 'verified', createdAt: '2026-11-13T02:00:00.000Z' }),
  ]
  const series = buildDailySeries(orders, { now: new Date('2026-11-13T05:00:00.000Z') })
  assert.equal(series.points.length, 21)
  assert.equal(series.truncated, true)
  assert.equal(series.omittedDays, 23) // 1 Okt s/d 23 Okt di luar jendela 21 hari
  assert.equal(series.totalRevenue, 20000) // hanya 2 hari terakhir
  assert.equal(
    series.points[20].revenue,
    10000,
    'hari terakhir yang ditampilkan adalah hari ini'
  )
})

test('kas tunai belum lunas dihitung terpisah dari omzet', () => {
  const report = calculateSalesReport([
    order({ paymentMethod: 'tunai', paymentStatus: 'pending', createdAt: '2026-11-13T02:00:00.000Z' }),
    order({ paymentStatus: 'verified' }),
  ])
  assert.equal(report.totalRevenue, 10000)
  assert.equal(report.totalOrders, 1)
  assert.equal(report.awaitingCashCount, 1)
})
