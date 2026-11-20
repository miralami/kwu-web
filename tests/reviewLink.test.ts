import test from 'node:test'
import assert from 'node:assert/strict'
import {
  WALKIN_PHONE,
  buildReviewUrl,
  parseReviewUrl,
  reviewRequestMessage,
  toWaNumber,
} from '../src/services/reviewLink.ts'

test('toWaNumber menormalkan berbagai bentuk nomor Indonesia', () => {
  assert.equal(toWaNumber('081234567890'), '6281234567890')
  assert.equal(toWaNumber('81234567890'), '6281234567890') // tanpa 0 di depan
  assert.equal(toWaNumber('+62 812-3456-7890'), '6281234567890')
  assert.equal(toWaNumber('6281234567890'), '6281234567890')
})

test('toWaNumber menolak nomor kosong, tiruan Kasir, dan tidak masuk akal', () => {
  assert.equal(toWaNumber(''), null)
  assert.equal(toWaNumber(null), null)
  assert.equal(toWaNumber(WALKIN_PHONE), null)
  assert.equal(toWaNumber('12345'), null)
  assert.equal(toWaNumber('0812'), null)
  assert.equal(toWaNumber('99999999999999999999'), null)
})

test('buildReviewUrl hanya memuat token, dan parseReviewUrl membacanya kembali', () => {
  const token = 'a3f9c1d2-7b4e-4c8a-9e21-5d6f0b8a1c33'
  const url = buildReviewUrl('https://situs.example/', token)
  assert.equal(url, `https://situs.example/ulas/${token}`)
  assert.ok(!url.includes('LM-'), 'kode pesanan tidak boleh ada di tautan')
  assert.equal(parseReviewUrl(new URL(url).pathname), token)
  assert.equal(parseReviewUrl(`/ulas/${token}/`), token)
})

test('parseReviewUrl menolak yang bukan tautan ulasan atau berisi karakter janggal', () => {
  assert.equal(parseReviewUrl('/'), null)
  assert.equal(parseReviewUrl('/ulas'), null)
  assert.equal(parseReviewUrl('/ulas/'), null)
  assert.equal(parseReviewUrl('/ulas/ab'), null) // terlalu pendek
  assert.equal(parseReviewUrl('/ulas/<script>'), null)
  assert.equal(parseReviewUrl('/ulas/../../etc'), null)
  assert.equal(parseReviewUrl('/ulas/' + 'a'.repeat(65)), null)
  assert.equal(parseReviewUrl('/admin/abc-123'), null)
})

test('reviewRequestMessage menyapa nama depan dan memuat tautan', () => {
  const msg = reviewRequestMessage('Budi Santoso', 'https://x.id/ulas/abc-123')
  assert.match(msg, /^Halo Budi!/)
  assert.match(msg, /https:\/\/x\.id\/ulas\/abc-123$/)
  assert.match(reviewRequestMessage('  ', 'u'), /^Halo kak!/)
})
