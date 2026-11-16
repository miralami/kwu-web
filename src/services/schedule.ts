// Jadwal PO yang bisa diatur admin: hari ambil (tanggal spesifik) dipecah jadi slot per jam.
// Fungsi murni, tanpa Supabase/localStorage, agar bisa dites langsung dengan node --test.
// Aturan validasinya HARUS sama dengan pickup_is_valid() di supabase/schema.sql.

export interface PickupDay {
  id: string
  date: string // YYYY-MM-DD (tanggal kalender Jakarta)
  start: string // HH:MM
  end: string // HH:MM
  step: number // menit per slot
  active: boolean
}

export interface PoSettings {
  open: boolean // false = PO ditutup, pesanan baru tidak diterima
  closeLabel: string // mis. "Senin 18.00 WIB", hanya tampilan di teks berjalan
  days: PickupDay[]
}

export interface PickupSlot {
  start: string
  end: string
}

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}
const fromMinutes = (min: number) =>
  `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

/** "10:00" -> "10.00" (gaya Indonesia). */
export const dotTime = (hhmm: string) => hhmm.replace(':', '.')

/** Tanggal kalender hari ini di Jakarta, "YYYY-MM-DD". */
export function jakartaToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(now)
}

/** "2026-11-17" -> "Selasa 17 Nov". Dihitung dari tanggal kalender, tidak tergantung zona waktu perangkat. */
export function dayLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return `${DAY_NAMES[dow]} ${d} ${MONTH_NAMES[m - 1]}`
}

export function generateSlots(day: Pick<PickupDay, 'start' | 'end' | 'step'>): PickupSlot[] {
  const out: PickupSlot[] = []
  const step = day.step
  if (!Number.isInteger(step) || step < 5 || step > 240) return out
  const end = toMinutes(day.end)
  for (let t = toMinutes(day.start); t + step <= end; t += step) {
    out.push({ start: fromMinutes(t), end: fromMinutes(t + step) })
  }
  return out
}

/** Hari yang masih bisa dipilih pembeli: aktif, belum lewat, punya slot. Urut tanggal. */
export function availableDays(settings: PoSettings, now: Date = new Date()): PickupDay[] {
  if (!settings.open) return []
  const today = jakartaToday(now)
  return settings.days
    .filter((d) => d.active && d.date >= today && generateSlots(d).length > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Nilai yang disimpan di pesanan: "2026-11-17|10:00|11:00". */
export const encodePickup = (date: string, start: string, end: string) => `${date}|${start}|${end}`

/** "Selasa 17 Nov · 10.00–11.00". Nilai lama/bebas (mis. "Selasa") ditampilkan apa adanya. */
export function formatPickup(value: string | null | undefined): string {
  if (!value) return ''
  const m = value.match(/^(\d{4}-\d{2}-\d{2})\|(\d{2}:\d{2})\|(\d{2}:\d{2})$/)
  if (!m) return value
  return `${dayLabel(m[1])} · ${dotTime(m[2])}–${dotTime(m[3])}`
}

/** Cermin pickup_is_valid() di database. */
export function isValidPickup(settings: PoSettings, value: string, now: Date = new Date()): boolean {
  const m = value.match(/^(\d{4}-\d{2}-\d{2})\|(\d{2}:\d{2})\|(\d{2}:\d{2})$/)
  if (!m) return false
  const [, date, start, end] = m
  return availableDays(settings, now).some(
    (d) => d.date === date && generateSlots(d).some((s) => s.start === start && s.end === end)
  )
}

/** Teks ringkas untuk teks berjalan, mis. "Selasa 17 Nov/Rabu 18 Nov 10.00–13.00 WIB". */
export function scheduleSummary(settings: PoSettings, now: Date = new Date()): string {
  const days = availableDays(settings, now)
  if (days.length === 0) return ''
  const ranges = new Set(days.map((d) => `${d.start}-${d.end}`))
  const range = (d: PickupDay) => `${dotTime(d.start)}–${dotTime(d.end)} WIB`
  return ranges.size === 1
    ? `${days.map((d) => dayLabel(d.date)).join('/')} ${range(days[0])}`
    : days.map((d) => `${dayLabel(d.date)} ${range(d)}`).join(' / ')
}

/** Jadwal bawaan (mode demo / sebelum admin mengatur): Selasa dan Rabu terdekat, 10.00–13.00. */
export function defaultSettings(now: Date = new Date()): PoSettings {
  const [y, m, d] = jakartaToday(now).split('-').map(Number)
  const days: PickupDay[] = []
  for (let i = 0; i < 7 && days.length < 2; i++) {
    const dt = new Date(Date.UTC(y, m - 1, d + i))
    const dow = dt.getUTCDay()
    if (dow === 2 || dow === 3) {
      days.push({
        id: `d${dt.toISOString().slice(0, 10)}`,
        date: dt.toISOString().slice(0, 10),
        start: '10:00',
        end: '13:00',
        step: 60,
        active: true,
      })
    }
  }
  return { open: true, closeLabel: 'Senin 18.00 WIB', days }
}

/** Rapikan data dari server/localStorage agar aman dipakai (nilai rusak dibuang). */
export function normalizeSettings(raw: unknown, fallback: PoSettings): PoSettings {
  if (!raw || typeof raw !== 'object') return fallback
  const r = raw as Record<string, unknown>
  const days = Array.isArray(r.days)
    ? (r.days as Record<string, unknown>[])
        .filter(
          (d) =>
            d &&
            typeof d.date === 'string' &&
            /^\d{4}-\d{2}-\d{2}$/.test(d.date) &&
            typeof d.start === 'string' &&
            /^\d{2}:\d{2}$/.test(d.start) &&
            typeof d.end === 'string' &&
            /^\d{2}:\d{2}$/.test(d.end)
        )
        .map((d, i) => ({
          id: typeof d.id === 'string' && d.id ? d.id : `d${i}-${d.date}`,
          date: d.date as string,
          start: d.start as string,
          end: d.end as string,
          step: Number.isInteger(d.step) ? (d.step as number) : 60,
          active: d.active !== false,
        }))
    : []
  return {
    open: r.open !== false,
    closeLabel: typeof r.closeLabel === 'string' ? r.closeLabel.slice(0, 40) : fallback.closeLabel,
    days,
  }
}

/** Pesan kesalahan bila jadwal yang disusun admin tidak masuk akal; null bila valid. */
export function validateSettings(settings: PoSettings): string | null {
  for (const d of settings.days) {
    if (!d.date) return 'Ada hari ambil yang tanggalnya kosong.'
    if (!/^\d{2}:\d{2}$/.test(d.start) || !/^\d{2}:\d{2}$/.test(d.end)) {
      return `Jam pada ${dayLabel(d.date)} belum diisi.`
    }
    if (toMinutes(d.end) <= toMinutes(d.start)) return `Jam selesai harus setelah jam mulai (${dayLabel(d.date)}).`
    if (generateSlots(d).length === 0) return `Rentang jam ${dayLabel(d.date)} terlalu pendek untuk satu slot.`
  }
  const dates = settings.days.map((d) => d.date)
  if (new Set(dates).size !== dates.length) return 'Ada tanggal yang dipakai dua kali.'
  return null
}

export interface PickupRecapRow {
  pickup: string // nilai pickupTime asli ('' = belum diisi)
  orders: number
  pieces: number
}

/** Rekap jumlah pesanan dan porsi per slot ambil, tanpa pesanan batal/ditolak. Urut slot. */
export function pickupRecap(
  orders: { pickupTime?: string | null; orderStatus: string; paymentStatus: string; totalPieces: number }[]
): PickupRecapRow[] {
  const map = new Map<string, PickupRecapRow>()
  for (const o of orders) {
    if (o.orderStatus === 'dibatalkan' || o.paymentStatus === 'rejected') continue
    const key = o.pickupTime ?? ''
    const row = map.get(key) ?? { pickup: key, orders: 0, pieces: 0 }
    row.orders += 1
    row.pieces += o.totalPieces
    map.set(key, row)
  }
  return [...map.values()].sort((a, b) => {
    if (!a.pickup) return 1
    if (!b.pickup) return -1
    return a.pickup.localeCompare(b.pickup)
  })
}
