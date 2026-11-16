import test from 'node:test'
import assert from 'node:assert/strict'
import {
  availableDays,
  dayLabel,
  defaultSettings,
  encodePickup,
  formatPickup,
  generateSlots,
  isValidPickup,
  normalizeSettings,
  pickupRecap,
  scheduleSummary,
  validateSettings,
} from '../src/services/schedule.ts'

const NOW = new Date('2026-11-16T03:00:00Z') // Senin 16 Nov 2026, 10.00 WIB

function settings(over: Record<string, any> = {}) {
  return {
    open: true,
    closeLabel: 'Senin 18.00 WIB',
    days: [
      { id: 'a', date: '2026-11-17', start: '10:00', end: '13:00', step: 60, active: true },
      { id: 'b', date: '2026-11-18', start: '10:00', end: '12:00', step: 30, active: true },
    ],
    ...over,
  }
}

test('dayLabel memakai nama hari yang benar', () => {
  assert.equal(dayLabel('2026-11-17'), 'Selasa 17 Nov')
  assert.equal(dayLabel('2026-11-18'), 'Rabu 18 Nov')
})

test('generateSlots membagi rentang sesuai langkah dan menolak langkah tidak masuk akal', () => {
  assert.deepEqual(generateSlots({ start: '10:00', end: '13:00', step: 60 }).map((s) => s.start), ['10:00', '11:00', '12:00'])
  assert.equal(generateSlots({ start: '10:00', end: '12:00', step: 30 }).length, 4)
  assert.equal(generateSlots({ start: '10:00', end: '10:20', step: 60 }).length, 0)
  assert.equal(generateSlots({ start: '10:00', end: '13:00', step: 1 }).length, 0)
})

test('availableDays: tanpa yang nonaktif, yang sudah lewat, atau saat PO tutup', () => {
  const s = settings()
  s.days.push({ id: 'c', date: '2026-11-19', start: '10:00', end: '11:00', step: 60, active: false })
  s.days.push({ id: 'd', date: '2026-11-10', start: '10:00', end: '11:00', step: 60, active: true })
  assert.deepEqual(availableDays(s, NOW).map((d) => d.id), ['a', 'b'])
  assert.deepEqual(availableDays({ ...s, open: false }, NOW), [])
  assert.equal(availableDays(s, new Date('2026-11-17T03:00:00Z')).length, 2) // hari-H masih boleh
  assert.equal(availableDays(s, new Date('2026-11-18T03:00:00Z')).length, 1)
})

test('isValidPickup menerima slot yang ada dan menolak sisanya', () => {
  const s = settings()
  assert.equal(isValidPickup(s, encodePickup('2026-11-17', '11:00', '12:00'), NOW), true)
  assert.equal(isValidPickup(s, encodePickup('2026-11-18', '10:30', '11:00'), NOW), true)
  assert.equal(isValidPickup(s, encodePickup('2026-11-17', '10:30', '11:30'), NOW), false) // tidak sejajar
  assert.equal(isValidPickup(s, encodePickup('2026-11-17', '13:00', '14:00'), NOW), false) // di luar jam
  assert.equal(isValidPickup(s, encodePickup('2026-11-19', '10:00', '11:00'), NOW), false) // hari tidak ada
  assert.equal(isValidPickup(s, 'Selasa', NOW), false)
  assert.equal(isValidPickup({ ...s, open: false }, encodePickup('2026-11-17', '10:00', '11:00'), NOW), false)
})

test('formatPickup merapikan nilai baru dan membiarkan nilai lama', () => {
  assert.equal(formatPickup('2026-11-17|10:00|11:00'), 'Selasa 17 Nov · 10.00–11.00')
  assert.equal(formatPickup('Selasa'), 'Selasa')
  assert.equal(formatPickup(null), '')
})

test('scheduleSummary menggabungkan jam yang sama', () => {
  const s = settings()
  s.days[1].end = '13:00'
  assert.equal(scheduleSummary(s, NOW), 'Selasa 17 Nov/Rabu 18 Nov 10.00–13.00 WIB')
  assert.equal(scheduleSummary(settings(), NOW), 'Selasa 17 Nov 10.00–13.00 WIB / Rabu 18 Nov 10.00–12.00 WIB')
  assert.equal(scheduleSummary({ ...s, open: false }, NOW), '')
})

test('defaultSettings memilih Selasa dan Rabu terdekat', () => {
  const d = defaultSettings(NOW)
  assert.deepEqual(d.days.map((x) => x.date), ['2026-11-17', '2026-11-18'])
})

test('normalizeSettings membuang data rusak dan validateSettings menangkap jadwal aneh', () => {
  const n = normalizeSettings({ open: false, closeLabel: 'x', days: [{ date: 'bukan', start: '1', end: '2' }, { date: '2026-11-17', start: '10:00', end: '11:00' }] }, defaultSettings(NOW))
  assert.equal(n.open, false)
  assert.equal(n.days.length, 1)
  assert.equal(n.days[0].step, 60)
  assert.equal(normalizeSettings(null, defaultSettings(NOW)).days.length, 2)

  assert.equal(validateSettings(settings()), null)
  const bad = settings()
  bad.days[0].end = '09:00'
  assert.match(validateSettings(bad) ?? '', /setelah jam mulai/)
  const dup = settings()
  dup.days[1].date = dup.days[0].date
  assert.match(validateSettings(dup) ?? '', /dua kali/)
})

test('pickupRecap menjumlah per slot tanpa pesanan batal', () => {
  const rows = pickupRecap([
    { pickupTime: '2026-11-17|10:00|11:00', orderStatus: 'sedang_diproses', paymentStatus: 'verified', totalPieces: 4 },
    { pickupTime: '2026-11-17|10:00|11:00', orderStatus: 'menunggu_pembayaran', paymentStatus: 'pending', totalPieces: 3 },
    { pickupTime: '2026-11-17|10:00|11:00', orderStatus: 'dibatalkan', paymentStatus: 'pending', totalPieces: 9 },
    { pickupTime: null, orderStatus: 'selesai', paymentStatus: 'verified', totalPieces: 1 },
    { pickupTime: '2026-11-18|10:00|11:00', orderStatus: 'siap_diambil', paymentStatus: 'verified', totalPieces: 2 },
  ])
  assert.deepEqual(rows, [
    { pickup: '2026-11-17|10:00|11:00', orders: 2, pieces: 7 },
    { pickup: '2026-11-18|10:00|11:00', orders: 1, pieces: 2 },
    { pickup: '', orders: 1, pieces: 1 },
  ])
})
