import { supabase, isMissingFunction } from './storage'
import { PoSettings, defaultSettings, normalizeSettings } from './schedule'

// Jadwal PO. Dengan Supabase: tabel po_settings (satu baris, id = 1); publik membaca lewat
// get_po_settings, hanya admin yang boleh menulis. Tanpa Supabase (mode demo): localStorage.
// Bila belum pernah diatur atau gagal dimuat, dipakai jadwal terakhir yang tersimpan di HP,
// lalu jadwal bawaan (Selasa dan Rabu terdekat).

const LOCAL_KEY = 'laris_manis_po_settings_v1'

type Listener = (s: PoSettings) => void
const listeners = new Set<Listener>()

export function subscribePoSettings(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function readLocal(): unknown {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function writeLocal(s: PoSettings) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(s))
  } catch {
    // Penyimpanan diblokir: jadwal hanya berlaku selama tab terbuka
  }
}

/** Jadwal terakhir yang tersimpan di HP ini (sinkron), untuk tampilan awal sebelum server menjawab. */
export function getCachedPoSettings(): PoSettings {
  return normalizeSettings(readLocal(), defaultSettings())
}

export async function getPoSettings(): Promise<PoSettings> {
  return (await getPoSettingsInfo()).settings
}

/** Seperti getPoSettings, plus penanda apakah jadwal ini sungguh sudah tersimpan (bukan bawaan). */
export async function getPoSettingsInfo(): Promise<{ settings: PoSettings; persisted: boolean }> {
  const fallback = normalizeSettings(readLocal(), defaultSettings())
  if (!supabase) return { settings: fallback, persisted: readLocal() !== null }

  try {
    const { data, error } = await supabase.rpc('get_po_settings')
    if (!error && data && typeof data === 'object') {
      const s = normalizeSettings(data, fallback)
      writeLocal(s) // cadangan bila sinyal putus saat dibuka lagi
      return { settings: s, persisted: true }
    }
    if (!error) return { settings: fallback, persisted: false } // server belum punya jadwal
    if (error && !isMissingFunction(error)) console.warn('get_po_settings gagal:', error)
  } catch (e) {
    console.warn('Supabase fetch po_settings failed:', e)
  }
  return { settings: fallback, persisted: true }
}

/** Admin menyimpan jadwal. Melempar Error berpesan jelas bila gagal. */
export async function savePoSettings(settings: PoSettings): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('po_settings').upsert({ id: 1, data: settings })
    if (error) {
      console.error('Failed to save po_settings:', error)
      throw new Error('Jadwal gagal disimpan di server. Periksa koneksi lalu coba lagi.')
    }
  }
  writeLocal(settings)
  listeners.forEach((l) => l(settings))
}
