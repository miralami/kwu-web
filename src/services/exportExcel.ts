import type { Order } from '../types'

/*
  Ekspor penjualan ke Excel (.xlsx), satu baris per produk per pesanan.
  Logika baris dan rumus ada di fungsi murni (bisa diuji: tests/exportExcel.test.ts);
  exceljs baru dimuat saat tombol ditekan supaya tidak membebani halaman pembeli.

  Kolom: A No | B ID Order | C Tanggal | D Nama | E Produk | F Qty | G Harga/Porsi | H Subtotal
         I Metode | J Tipe Order | K Status Verifikasi | L Status Bayar | M Pendapatan Diakui
*/

export const WALKIN_CLASS = 'Kasir (walk-in)'
const WIB_OFFSET_MS = 7 * 60 * 60 * 1000 // Jakarta tidak memakai DST

export interface SalesRow {
  no: number
  orderId: string
  date: Date // jam dinding WIB disimpan sebagai komponen UTC (exceljs menulis UTC apa adanya)
  name: string
  product: string
  qty: number
  price: number
  subtotal: number
  method: string
  type: 'Walk-in' | 'Pre-order'
  verification: string
  paid: 'Lunas' | 'Belum Bayar'
  recognized: number
}

export function orderType(o: Pick<Order, 'customerClass'>): SalesRow['type'] {
  return o.customerClass === WALKIN_CLASS ? 'Walk-in' : 'Pre-order'
}

/** Sama dengan rumus kolom L di Excel. */
export function paidLabel(verification: string): SalesRow['paid'] {
  // Walk-in pun baru Lunas setelah diverifikasi: kasir mencatatnya dulu sebagai belum bayar
  return verification === 'verified' ? 'Lunas' : 'Belum Bayar'
}

export function buildSalesRows(orders: Order[]): SalesRow[] {
  const sorted = [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const rows: SalesRow[] = []
  for (const o of sorted) {
    const type = orderType(o)
    const date = new Date(Date.parse(o.createdAt) + WIB_OFFSET_MS)
    for (const item of o.items) {
      const subtotal = item.quantity * item.price
      const paid = paidLabel(o.paymentStatus)
      rows.push({
        no: rows.length + 1,
        orderId: o.id,
        date,
        name: o.customerName,
        product: item.name,
        qty: item.quantity,
        price: item.price,
        subtotal,
        method: o.paymentMethod,
        type,
        verification: o.paymentStatus,
        paid,
        recognized: paid === 'Lunas' ? subtotal : 0,
      })
    }
  }
  return rows
}

const HEADERS = [
  'No',
  'ID Order',
  'Tanggal',
  'Nama',
  'Produk',
  'Qty',
  'Harga/Porsi',
  'Subtotal',
  'Metode',
  'Tipe Order',
  'Status Verifikasi',
  'Status Bayar',
  'Pendapatan Diakui',
]

export async function buildSalesWorkbook(orders: Order[]) {
  // exceljs adalah paket CommonJS: tergantung bundler/runtime, kelasnya muncul di namespace
  // atau hanya di `default`. Dua-duanya ditangani.
  const mod = await import('exceljs')
  const ExcelJS = ((mod as unknown as { default?: typeof mod }).default ?? mod) as typeof mod
  const rows = buildSalesRows(orders)

  const wb = new ExcelJS.Workbook()
  wb.creator = 'Laris Manis'
  // exceljs tidak menyimpan nilai cache 0 untuk kolom rumus; minta Excel menghitung ulang saat dibuka
  wb.calcProperties = { fullCalcOnLoad: true }
  const ws = wb.addWorksheet('Penjualan', { views: [{ state: 'frozen', ySplit: 1 }] })

  ws.columns = [
    { width: 6 },
    { width: 18 },
    { width: 17 },
    { width: 22 },
    { width: 24 },
    { width: 7 },
    { width: 14 },
    { width: 14 },
    { width: 10 },
    { width: 12 },
    { width: 18 },
    { width: 14 },
    { width: 18 },
  ]

  const header = ws.addRow(HEADERS)
  header.height = 22
  header.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } }
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3A8A' } }
    cell.alignment = { vertical: 'middle', horizontal: 'center' }
  })

  rows.forEach((r, i) => {
    const n = i + 2 // baris 1 = judul kolom
    ws.addRow([
      r.no,
      r.orderId,
      r.date,
      r.name,
      r.product,
      r.qty,
      r.price,
      { formula: `F${n}*G${n}`, result: r.subtotal },
      r.method,
      r.type,
      r.verification,
      { formula: `IF(K${n}="verified","Lunas","Belum Bayar")`, result: r.paid },
      { formula: `IF(L${n}="Lunas",H${n},0)`, result: r.recognized },
    ])
  })

  ws.getColumn(3).numFmt = 'dd/mm/yyyy hh:mm'
  for (const col of [7, 8, 13]) ws.getColumn(col).numFmt = '#,##0'
  ws.autoFilter = { from: 'A1', to: { row: Math.max(rows.length + 1, 1), column: HEADERS.length } }

  return wb
}

export async function downloadSalesExcel(orders: Order[]): Promise<void> {
  const wb = await buildSalesWorkbook(orders)
  const buffer = await wb.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `Penjualan-LarisManis-${new Date().toISOString().slice(0, 10)}.xlsx`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
