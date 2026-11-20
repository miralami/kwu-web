// Tautan ulasan per pesanan. Tiap pesanan punya token rahasia sendiri (kolom accessToken, UUID acak
// yang dicek server), jadi pesanan yang tidak dibuat dari web (mis. lewat WhatsApp lalu dicatat
// admin di Kasir) tetap bisa diulas: admin mengirim tautan /ulas/<token> ke pembeli. Kode pesanan
// TIDAK ada di tautan; server yang mencari pesanannya dari token (get_order_by_token).
// Fungsi murni agar bisa dites.

/** Nomor tiruan yang dipakai Kasir bila pembeli tidak punya/menyebut nomor WhatsApp. */
export const WALKIN_PHONE = '080000000000'

/**
 * Nomor WhatsApp dalam format internasional tanpa plus ("6281234567890"), atau null bila
 * nomornya kosong, tiruan, atau tidak masuk akal. Menerima 0812…, 812…, 62812…, +62 812…
 */
export function toWaNumber(phone: string | null | undefined): string | null {
  const digits = (phone ?? '').replace(/\D/g, '')
  if (!digits || digits === WALKIN_PHONE.replace(/\D/g, '')) return null
  let intl: string
  if (digits.startsWith('62')) intl = digits
  else if (digits.startsWith('0')) intl = `62${digits.slice(1)}`
  else if (digits.startsWith('8')) intl = `62${digits}`
  else return null
  return intl.length >= 10 && intl.length <= 15 ? intl : null
}

/**
 * Tautan ulasan satu pesanan. `key` = token rahasia pesanan. Hanya mode demo lokal (pesanan tanpa
 * token) yang memakai kode pesanan sebagai pengganti, karena tidak ada server yang mengeceknya.
 */
export function buildReviewUrl(origin: string, key: string): string {
  return `${origin.replace(/\/+$/, '')}/ulas/${encodeURIComponent(key)}`
}

/** Membaca kunci ulasan dari alamat halaman (/ulas/<kunci>); null bila bukan tautan ulasan. */
export function parseReviewUrl(pathname: string): string | null {
  const m = pathname.replace(/\/+$/, '').match(/^\/ulas\/([A-Za-z0-9-]{3,64})$/)
  return m ? m[1] : null
}

/** Pesan WhatsApp yang dikirim admin untuk meminta ulasan. */
export function reviewRequestMessage(customerName: string, url: string): string {
  const first = customerName.trim().split(/\s+/)[0] || 'kak'
  return `Halo ${first}! Terima kasih sudah jajan di Laris Manis 🙌\nBoleh minta ulasannya? Cuma semenit, klik link ini ya:\n${url}`
}
