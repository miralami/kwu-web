import React, { useEffect, useState } from 'react'
import { CalendarPlus, Trash2 } from 'lucide-react'
import { Order } from '../../types'
import {
  PickupDay,
  PoSettings,
  dayLabel,
  defaultSettings,
  formatPickup,
  generateSlots,
  jakartaToday,
  pickupRecap,
  scheduleSummary,
  validateSettings,
} from '../../services/schedule'
import { getPoSettingsInfo, savePoSettings } from '../../services/poSettingsStorage'

const STEP_OPTIONS = [30, 45, 60, 90, 120]

const fieldClass =
  'mt-1 block w-full min-h-[44px] px-3 bg-paper-50 border-2 border-royal-600/40 rounded-lg text-sm text-ink-900 focus:outline-none focus:border-brand-600'

// Tab Jadwal: admin mengatur kapan PO buka, hari + jam ambil (tanggal spesifik, dipecah jadi slot),
// dan melihat rekap pesanan per slot. Pembeli langsung memakai jadwal ini di checkout.
export const SchedulePanel: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const [saved, setSaved] = useState<PoSettings | null>(null)
  const [draft, setDraft] = useState<PoSettings | null>(null)
  const [persisted, setPersisted] = useState(true) // false = jadwal masih bawaan, belum pernah disimpan
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    getPoSettingsInfo().then(({ settings, persisted }) => {
      setSaved(settings)
      setDraft(settings)
      setPersisted(persisted)
    })
  }, [])

  if (!draft || !saved) return <p className="text-sm text-ink-600">Memuat jadwal...</p>

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved) || !persisted
  const update = (patch: Partial<PoSettings>) => {
    setDraft({ ...draft, ...patch })
    setMessage(null)
  }
  const updateDay = (id: string, patch: Partial<PickupDay>) =>
    update({ days: draft.days.map((d) => (d.id === id ? { ...d, ...patch } : d)) })

  const addDay = () => {
    const last = [...draft.days]
      .filter((d) => d.date)
      .sort((a, b) => a.date.localeCompare(b.date))
      .pop()
    const base = new Date(`${last?.date ?? jakartaToday()}T12:00:00Z`)
    base.setUTCDate(base.getUTCDate() + 1)
    const date = base.toISOString().slice(0, 10)
    update({
      days: [
        ...draft.days,
        { id: `d${Date.now().toString(36)}`, date, start: last?.start ?? '10:00', end: last?.end ?? '13:00', step: last?.step ?? 60, active: true },
      ],
    })
  }

  const handleSave = async () => {
    const problem = validateSettings(draft)
    if (problem) {
      setMessage({ ok: false, text: problem })
      return
    }
    setSaving(true)
    try {
      const clean = { ...draft, days: [...draft.days].sort((a, b) => a.date.localeCompare(b.date)) }
      await savePoSettings(clean)
      setSaved(clean)
      setDraft(clean)
      setPersisted(true)
      setMessage({ ok: true, text: 'Jadwal tersimpan. Pembeli langsung memakainya.' })
    } catch (e) {
      setMessage({ ok: false, text: e instanceof Error ? e.message : 'Gagal menyimpan. Coba lagi.' })
    } finally {
      setSaving(false)
    }
  }

  const summary = scheduleSummary(draft)
  const recap = pickupRecap(orders)

  return (
    <div className="space-y-4">
      {/* Buka / tutup PO */}
      <section className="bg-surface border-t-4 border-royal-600 shadow-[0_6px_12px_-6px_rgb(8_16_48/0.4)] p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="font-extrabold text-base text-ink-900">Status PO</h2>
            <p className="text-xs text-ink-600">Saat tutup, pembeli tidak bisa mengirim pesanan baru.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={draft.open}
            onClick={() => update({ open: !draft.open })}
            className={`shrink-0 min-h-[48px] px-5 font-display uppercase text-xl border-4 border-double leading-none ${
              draft.open ? 'text-green-700 border-green-700' : 'text-red-700 border-red-700'
            }`}
          >
            {draft.open ? 'Buka' : 'Tutup'}
          </button>
        </div>
        <label className="block text-sm font-bold text-ink-800">
          PO tutup pada <span className="font-medium text-ink-600">(teks di header)</span>
          <input
            type="text"
            maxLength={40}
            value={draft.closeLabel}
            onChange={(e) => update({ closeLabel: e.target.value })}
            placeholder="Senin 18.00 WIB"
            className={fieldClass}
          />
        </label>
      </section>

      {/* Hari + jam ambil */}
      <section className="bg-surface border-t-4 border-royal-600 shadow-[0_6px_12px_-6px_rgb(8_16_48/0.4)] p-4 space-y-3">
        <h2 className="font-extrabold text-base text-ink-900">Hari dan jam ambil</h2>
        {!persisted && (
          <p className="text-xs font-bold text-amber-900 bg-amber-50 border border-amber-200 p-2.5">
            Jadwal ini masih bawaan dan belum pernah disimpan. Atur lalu tekan Simpan agar berlaku untuk pembeli.
          </p>
        )}

        {draft.days.length === 0 && <p className="text-sm text-ink-600">Belum ada hari ambil. Tambahkan satu.</p>}

        <ul className="space-y-3">
          {draft.days.map((d) => (
            <li key={d.id} className={`border border-paper-300 p-3 space-y-2 ${d.active ? '' : 'opacity-60'}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-royal-700">{d.date ? dayLabel(d.date) : 'Pilih tanggal'}</span>
                <label className="flex items-center gap-2 text-sm font-bold text-ink-800 min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={d.active}
                    onChange={(e) => updateDay(d.id, { active: e.target.checked })}
                    className="w-5 h-5 accent-brand-600"
                  />
                  Aktif
                </label>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <label className="text-xs font-bold text-ink-800 col-span-2 sm:col-span-1">
                  Tanggal
                  <input type="date" value={d.date} onChange={(e) => updateDay(d.id, { date: e.target.value })} className={fieldClass} />
                </label>
                <label className="text-xs font-bold text-ink-800">
                  Mulai
                  <input type="time" value={d.start} onChange={(e) => updateDay(d.id, { start: e.target.value })} className={fieldClass} />
                </label>
                <label className="text-xs font-bold text-ink-800">
                  Selesai
                  <input type="time" value={d.end} onChange={(e) => updateDay(d.id, { end: e.target.value })} className={fieldClass} />
                </label>
                <label className="text-xs font-bold text-ink-800 col-span-2 sm:col-span-1">
                  Menit per slot
                  <select value={d.step} onChange={(e) => updateDay(d.id, { step: Number(e.target.value) })} className={fieldClass}>
                    {STEP_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {m} menit
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-ink-600 tabular-nums">
                  {generateSlots(d).length} slot
                  {generateSlots(d).length > 0 &&
                    `: ${generateSlots(d)
                      .map((s) => s.start.replace(':', '.'))
                      .join(', ')}`}
                </p>
                <button
                  type="button"
                  onClick={() => update({ days: draft.days.filter((x) => x.id !== d.id) })}
                  aria-label={`Hapus ${d.date ? dayLabel(d.date) : 'hari ambil'}`}
                  className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center border border-paper-300 text-ink-700 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={addDay}
          className="w-full min-h-[48px] border-2 border-dashed border-royal-600/50 text-royal-700 text-sm font-extrabold flex items-center justify-center gap-1.5 hover:border-royal-600"
        >
          <CalendarPlus className="w-4 h-4" /> Tambah hari ambil
        </button>

        <p className="text-xs text-ink-700 bg-paper-100 p-2.5">
          <strong>Tampilan di header:</strong>{' '}
          {draft.open ? (summary ? `Ambil ${summary}` : 'Belum ada hari aktif') : 'PO sedang tutup'}
        </p>

        {message && (
          <p role={message.ok ? 'status' : 'alert'} className={`text-sm font-bold ${message.ok ? 'text-green-700' : 'text-red-700'}`}>
            {message.text}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setDraft(saved)
              setMessage(null)
            }}
            disabled={JSON.stringify(draft) === JSON.stringify(saved) || saving}
            className="min-h-[48px] border border-paper-300 bg-surface text-ink-800 text-sm font-bold disabled:opacity-40"
          >
            Batalkan
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="btn-3d min-h-[48px] bg-brand-600 text-white text-sm font-extrabold disabled:opacity-40"
          >
            {saving ? 'Menyimpan...' : 'Simpan jadwal'}
          </button>
        </div>
        {orders.length > 0 && draft.days.length === 0 && (
          <button
            type="button"
            onClick={() => update({ days: defaultSettings().days })}
            className="w-full min-h-[44px] text-sm font-bold text-royal-700 underline underline-offset-4"
          >
            Isi otomatis Selasa dan Rabu terdekat
          </button>
        )}
      </section>

      {/* Rekap per slot */}
      <section className="bg-surface border-t-4 border-royal-600 shadow-[0_6px_12px_-6px_rgb(8_16_48/0.4)] p-4">
        <h2 className="font-extrabold text-base text-ink-900">Pesanan per slot ambil</h2>
        <p className="text-xs text-ink-600">Tanpa pesanan yang dibatalkan atau ditolak. Berguna untuk menyiapkan produksi.</p>
        {recap.length === 0 ? (
          <p className="mt-2 text-sm text-ink-600">Belum ada pesanan.</p>
        ) : (
          <ul className="mt-2 divide-y divide-paper-200">
            {recap.map((r) => (
              <li key={r.pickup || 'none'} className="py-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-bold text-ink-900">{r.pickup ? formatPickup(r.pickup) : 'Belum diisi (pesanan lama)'}</span>
                <span className="shrink-0 text-ink-700 tabular-nums">
                  {r.orders} pesanan · {r.pieces} pcs
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
