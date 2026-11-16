import test from 'node:test'
import assert from 'node:assert/strict'
import {
  formatAverage,
  maskName,
  reviewsForMenu,
  sanitizeRatings,
  summarizeByMenu,
} from '../src/services/reviews.ts'

function review(over: Record<string, any> = {}) {
  return {
    id: 'r1',
    orderId: 'LM-1',
    displayName: 'Budi S.',
    ratings: { a: 5 },
    comment: '',
    hidden: false,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...over,
  }
}

test('maskName menyamarkan nama belakang dan menghormati anonim', () => {
  assert.equal(maskName('Budi Santoso', false), 'Budi S.')
  assert.equal(maskName('  budi   ahmad  santoso ', false), 'budi S.')
  assert.equal(maskName('Budi', false), 'Budi')
  assert.equal(maskName('Budi Santoso', true), 'Anonim')
  assert.equal(maskName('   ', false), 'Anonim')
})

test('sanitizeRatings hanya menerima 1..5 untuk menu yang ada di pesanan', () => {
  const out = sanitizeRatings({ a: 5, b: 0, c: 3, d: 2.5, x: 4, e: '4' }, ['a', 'b', 'c', 'd', 'e'])
  assert.deepEqual(out, { a: 5, c: 3, e: 4 })
})

test('summarizeByMenu menghitung rata-rata satu desimal dan mengabaikan yang tersembunyi', () => {
  const list = [
    review({ ratings: { a: 5, b: 4 } }),
    review({ id: 'r2', ratings: { a: 4 } }),
    review({ id: 'r3', ratings: { a: 1 }, hidden: true }),
  ]
  const s = summarizeByMenu(list)
  assert.deepEqual(s.a, { average: 4.5, count: 2 })
  assert.deepEqual(s.b, { average: 4, count: 1 })
  assert.equal(s.zzz, undefined)
})

test('reviewsForMenu: terbaru dulu, tanpa yang tersembunyi, dibatasi', () => {
  const list = [
    review({ id: 'old', createdAt: '2026-01-01T00:00:00.000Z' }),
    review({ id: 'new', createdAt: '2026-01-03T00:00:00.000Z' }),
    review({ id: 'hid', createdAt: '2026-01-04T00:00:00.000Z', hidden: true }),
    review({ id: 'other', ratings: { b: 3 } }),
  ]
  assert.deepEqual(reviewsForMenu(list, 'a').map((r) => r.id), ['new', 'old'])
  assert.equal(reviewsForMenu(list, 'a', 1).length, 1)
})

test('formatAverage memakai koma', () => {
  assert.equal(formatAverage(4.8), '4,8')
  assert.equal(formatAverage(5), '5,0')
})
