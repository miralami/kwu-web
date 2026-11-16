import test from 'node:test'
import assert from 'node:assert/strict'
import { buildSalesRows, buildSalesWorkbook, paidLabel } from '../src/services/exportExcel.ts'

// Fixture minimal; tipe Order tidak diimpor agar node bisa menjalankan file ini langsung.
function order(over: Record<string, any> = {}): any {
  return {
    id: 'LM-141126-001',
    customerName: 'Budi',
    customerPhone: '081234567890',
    customerClass: '',
    items: [
      { id: 'a', menuItemId: 'm1', name: 'Mozzarella Sunda', optionId: 'o', optionLabel: '1 Porsi', pieces: 3, price: 10000, quantity: 2 },
      { id: 'b', menuItemId: 'm2', name: 'Puding Buah', optionId: 'p', optionLabel: '1 Cup', pieces: 1, price: 15000, quantity: 1 },
    ],
    totalItems: 2,
    totalPieces: 7,
    subtotal: 35000,
    discountAmount: 0,
    total: 35000,
    paymentMethod: 'qris',
    paymentStatus: 'verified',
    orderStatus: 'selesai',
    createdAt: '2026-11-14T05:30:05.000Z', // 12:30 WIB
    expiresAt: '2026-11-14T05:30:05.000Z',
    ...over,
  }
}

test('satu baris per produk, nomor berurutan, subtotal = qty x harga', () => {
  const rows = buildSalesRows([order()])
  assert.equal(rows.length, 2)
  assert.deepEqual(rows.map((r) => r.no), [1, 2])
  assert.equal(rows[0].subtotal, 20000)
  assert.equal(rows[1].subtotal, 15000)
  assert.equal(rows[0].orderId, 'LM-141126-001')
})

test('tanggal ditulis sebagai jam dinding WIB', () => {
  const [row] = buildSalesRows([order()])
  assert.equal(row.date.toISOString().slice(0, 16), '2026-11-14T12:30')
})

test('urut dari pesanan terlama dan nomor tidak mengulang antar pesanan', () => {
  const rows = buildSalesRows([
    order({ id: 'B', createdAt: '2026-11-15T01:00:00.000Z', items: [order().items[0]] }),
    order({ id: 'A', createdAt: '2026-11-14T01:00:00.000Z', items: [order().items[0]] }),
  ])
  assert.deepEqual(rows.map((r) => r.orderId), ['A', 'B'])
  assert.deepEqual(rows.map((r) => r.no), [1, 2])
})

test('tipe order dan status bayar mengikuti aturan kolom J dan L', () => {
  const walkin = buildSalesRows([order({ customerClass: 'Kasir (walk-in)', paymentStatus: 'pending' })])[0]
  assert.equal(walkin.type, 'Walk-in')
  assert.equal(walkin.paid, 'Lunas')

  const preOrderPending = buildSalesRows([order({ paymentStatus: 'pending' })])[0]
  assert.equal(preOrderPending.type, 'Pre-order')
  assert.equal(preOrderPending.paid, 'Belum Bayar')
  assert.equal(preOrderPending.recognized, 0)

  const preOrderPaid = buildSalesRows([order()])[0]
  assert.equal(preOrderPaid.paid, 'Lunas')
  assert.equal(preOrderPaid.recognized, 20000)

  assert.equal(paidLabel('Pre-order', 'rejected'), 'Belum Bayar')
})

test('workbook: 13 kolom, rumus H/L/M terpasang, judul sheet Penjualan', async () => {
  const wb = await buildSalesWorkbook([order(), order({ id: 'X', paymentStatus: 'pending', createdAt: '2026-11-15T01:00:00.000Z' })])
  const ws = wb.getWorksheet('Penjualan')!
  assert.ok(ws)
  assert.equal(ws.getRow(1).values.length - 1, 13)
  assert.equal(ws.getCell('H2').value.formula, 'F2*G2')
  assert.equal(ws.getCell('L2').value.formula, 'IF(OR(J2="Walk-in",K2="verified"),"Lunas","Belum Bayar")')
  assert.equal(ws.getCell('M2').value.formula, 'IF(L2="Lunas",H2,0)')
  assert.equal(ws.getCell('M2').value.result, 20000)
  assert.equal(ws.getCell('M4').value.formula, 'IF(L4="Lunas",H4,0)') // pesanan X (belum bayar); nilai 0 dihitung Excel
  assert.equal(ws.rowCount, 5) // judul + 2 + 2 produk
  assert.equal(wb.calcProperties.fullCalcOnLoad, true)
})
