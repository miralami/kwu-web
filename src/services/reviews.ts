// Logika murni review (tanpa Supabase/localStorage) agar bisa dites langsung dengan node --test.
// Penyimpanannya ada di reviewStorage.ts.

export interface Review {
  id: string
  orderId: string // hanya untuk admin; tidak dikirim ke publik oleh server
  displayName: string // sudah disamarkan ("Budi S.") atau "Anonim"
  ratings: Record<string, number> // menuItemId -> 1..5
  comment: string
  hidden: boolean
  createdAt: string
}

export const MAX_COMMENT_LENGTH = 200

/** "Budi Santoso" -> "Budi S."; satu kata tetap apa adanya; kosong atau anonim -> "Anonim". */
export function maskName(fullName: string, anonymous: boolean): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (anonymous || parts.length === 0) return 'Anonim'
  const first = parts[0].slice(0, 20)
  if (parts.length === 1) return first
  return `${first} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`
}

/** Hanya nilai bulat 1..5 untuk menu yang memang ada di pesanan yang dipakai. */
export function sanitizeRatings(
  ratings: Record<string, unknown>,
  allowedMenuIds: string[]
): Record<string, number> {
  const out: Record<string, number> = {}
  for (const id of allowedMenuIds) {
    const v = Number(ratings[id])
    if (Number.isInteger(v) && v >= 1 && v <= 5) out[id] = v
  }
  return out
}

export interface MenuRatingSummary {
  average: number // satu desimal, 0 bila belum ada
  count: number
}

/** Rata-rata dan jumlah ulasan per menu. Ulasan tersembunyi tidak dihitung. */
export function summarizeByMenu(reviews: Review[]): Record<string, MenuRatingSummary> {
  const sums: Record<string, { total: number; count: number }> = {}
  for (const r of reviews) {
    if (r.hidden) continue
    for (const [menuId, stars] of Object.entries(r.ratings)) {
      const s = (sums[menuId] ??= { total: 0, count: 0 })
      s.total += stars
      s.count += 1
    }
  }
  const out: Record<string, MenuRatingSummary> = {}
  for (const [menuId, s] of Object.entries(sums)) {
    out[menuId] = { average: Math.round((s.total / s.count) * 10) / 10, count: s.count }
  }
  return out
}

/** Ulasan terbaru untuk satu menu (yang tidak tersembunyi). */
export function reviewsForMenu(reviews: Review[], menuId: string, limit = 5): Review[] {
  return reviews
    .filter((r) => !r.hidden && r.ratings[menuId] !== undefined)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

/** Format "4,8" gaya Indonesia. */
export const formatAverage = (n: number) => n.toFixed(1).replace('.', ',')
