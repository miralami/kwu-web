import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Order } from '../../types'
import { isCountedOrder, type DailySeries } from '../../services/analytics'

/*
  Grafik rekap finansial untuk investor. Digambar dengan SVG/HTML biasa (tanpa library).
  Aturan visual:
  - Satu seri = satu warna (merah brand). Dua kategori (QRIS/Tunai) = merah + biru,
    pasangan yang lolos validator buta warna & kontras di mode terang dan gelap.
  - Teks/angka selalu memakai warna teks (ink), bukan warna seri.
  - Batang tipis berujung bulat 4px, menempel ke garis dasar; garis bantu tipis & samar.
*/

// ---------- Format angka ----------
const rp = (n: number) => `Rp${Math.round(n).toLocaleString('id-ID')}`
const rpShort = (n: number) => {
  if (n >= 1_000_000) return `Rp${(n / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`
  if (n >= 1_000) return `Rp${Math.round(n / 1_000).toLocaleString('id-ID')} rb`
  return `Rp${n}`
}
const pct = (part: number, whole: number) => (whole > 0 ? Math.round((part / whole) * 100) : 0)

// Persentase bulat yang jumlahnya selalu tepat 100 (sisa terbesar), supaya daftar
// porsi tidak pernah tampak 99% atau 101%.
function pctShares(values: number[], whole?: number): number[] {
  const total = whole ?? values.reduce((s, v) => s + v, 0)
  if (total <= 0) return values.map(() => 0)
  const raw = values.map((v) => (v / total) * 100)
  const out = raw.map(Math.floor)
  let left = 100 - out.reduce((s, v) => s + v, 0)
  const order = raw
    .map((r, i) => ({ i, f: r - Math.floor(r) }))
    .sort((a, b) => b.f - a.f || a.i - b.i)
  for (let k = 0; k < order.length && left > 0; k++, left--) out[order[k].i] += 1
  return out
}

// Kelipatan "rapi" untuk sumbu Y (1, 2, 2.5, 5 × 10^n)
function niceStep(raw: number) {
  const pow = 10 ** Math.floor(Math.log10(raw))
  const n = raw / pow
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * pow
}

function useElementWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return { ref, width }
}

// ---------- Data ----------
// DailyPoint, DailySeries, dan buildDailySeries ada di services/analytics.ts
// (pengelompokan hari memakai kalender Asia/Jakarta, bukan zona waktu perangkat).

// ---------- Kartu pembungkus ----------
const ChartCard: React.FC<{ title: string; subtitle?: string; children: React.ReactNode }> = ({
  title,
  subtitle,
  children,
}) => (
  <section className="bg-surface border-t-4 border-royal-600 shadow-[0_6px_12px_-6px_rgb(8_16_48/0.4)] p-4 space-y-3">
    <div>
      <h3 className="font-extrabold text-sm text-ink-900">{title}</h3>
      {subtitle && <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </section>
)

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <p className="text-xs text-ink-500 bg-paper-50 border border-dashed border-paper-300 rounded-lg p-4 text-center">
    {text}
  </p>
)

// ---------- 1. Meter progres target ----------
export const TargetMeters: React.FC<{
  revenue: number
  revenueTarget: number
  pieces: number
  piecesTarget: number
}> = ({ revenue, revenueTarget, pieces, piecesTarget }) => {
  const rows = [
    { name: 'Omzet', value: rp(revenue), target: rp(revenueTarget), share: pct(revenue, revenueTarget) },
    { name: 'Pcs terjual', value: `${pieces} pcs`, target: `${piecesTarget} pcs`, share: pct(pieces, piecesTarget) },
  ]
  return (
    <ChartCard title="Progres Menuju Target" subtitle="Target Business Plan, Minggu 10–12">
      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.name}>
            <div className="flex items-baseline justify-between gap-3 text-xs">
              <span className="font-bold text-ink-800">{r.name}</span>
              <span className="text-ink-600">
                <span className="font-extrabold text-ink-900">{r.value}</span> / {r.target}
              </span>
            </div>
            <div
              className="mt-1.5 h-2.5 rounded-full bg-paper-100 overflow-hidden"
              role="meter"
              aria-label={`${r.name}: ${r.share}% dari target`}
              aria-valuenow={r.share}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-brand-600 transition-[width] duration-700 ease-out"
                style={{ width: `${Math.min(100, r.share)}%` }}
              />
            </div>
            <div className="mt-1 text-xs font-bold text-ink-700">{r.share}% tercapai</div>
          </div>
        ))}
      </div>
    </ChartCard>
  )
}

// ---------- 2. Omzet harian (batang vertikal + tooltip) ----------
export const DailyRevenueChart: React.FC<{ data: DailySeries }> = ({ data }) => {
  const points = data.points
  const { ref, width } = useElementWidth<HTMLDivElement>()
  const [active, setActive] = useState<number | null>(null)
  const [showTable, setShowTable] = useState(false)

  const total = data.totalRevenue
  const activeDays = points.filter((d) => d.revenue > 0).length
  const avg = activeDays ? total / activeDays : 0
  const bestIdx = points.length
    ? points.reduce((bi, d, i, arr) => (d.revenue > arr[bi].revenue ? i : bi), 0)
    : -1

  // Tata letak
  const H = 200
  const pad = { top: 22, right: 4, bottom: 24, left: 52 }
  const innerW = Math.max(0, width - pad.left - pad.right)
  const innerH = H - pad.top - pad.bottom
  const maxVal = Math.max(...points.map((d) => d.revenue), 1)
  const step = niceStep(maxVal / 3)
  const yMax = Math.ceil(maxVal / step) * step
  const ticks = Array.from({ length: Math.round(yMax / step) + 1 }, (_, i) => i * step)
  const band = points.length ? innerW / points.length : 0
  const barW = Math.max(4, Math.min(28, band - 2)) // jarak antarbatang minimal 2px
  const y = (v: number) => pad.top + innerH - (v / yMax) * innerH
  const labelEvery = Math.max(1, Math.ceil(46 / Math.max(band, 1))) // label tanggal tidak bertabrakan

  const barPath = (x: number, top: number, w: number, base: number) => {
    const h = base - top
    if (h <= 0) return ''
    const r = Math.min(4, w / 2, h)
    return `M${x},${base} V${top + r} Q${x},${top} ${x + r},${top} H${x + w - r} Q${x + w},${top} ${x + w},${top + r} V${base} Z`
  }

  const activePoint = active !== null ? points[active] : null
  const tooltipLeft =
    active !== null
      ? Math.min(Math.max(pad.left + band * active + band / 2, 80), Math.max(80, width - 80))
      : 0
  // Tooltip menempel di puncak batang aktif (atau di bawahnya bila batang terlalu tinggi),
  // bukan di langit-langit grafik, supaya label "hari terbaik" tidak pernah tertimpa.
  const tooltipTop = activePoint ? y(activePoint.revenue) : 0
  const tooltipAbove = tooltipTop > pad.top + 48

  return (
    <ChartCard
      title="Omzet Harian"
      subtitle={
        points.length
          ? `${data.rangeLabel} • total ${rp(total)} • rata-rata ${rp(avg)} per hari berjualan`
          : undefined
      }
    >
      {points.length === 0 ? (
        <EmptyState text="Belum ada transaksi yang terverifikasi untuk digambarkan." />
      ) : (
        <>
          <div ref={ref} className="relative select-none" onMouseLeave={() => setActive(null)}>
            {width > 0 && (
              <svg
                width={width}
                height={H}
                role="img"
                aria-label={`Grafik omzet harian, ${points.length} hari`}
              >
                {/* Garis bantu & label sumbu Y */}
                {ticks.map((t) => (
                  <g key={t}>
                    <line
                      x1={pad.left}
                      x2={width - pad.right}
                      y1={y(t)}
                      y2={y(t)}
                      className={t === 0 ? 'stroke-paper-300' : 'stroke-paper-200'}
                      strokeWidth={1}
                    />
                    <text
                      x={pad.left - 8}
                      y={y(t)}
                      dy="0.32em"
                      textAnchor="end"
                      className="fill-ink-500 text-xs"
                    >
                      {rpShort(t)}
                    </text>
                  </g>
                ))}

                {points.map((d, i) => {
                  const x = pad.left + band * i + (band - barW) / 2
                  const isActive = active === i
                  return (
                    <g key={d.key}>
                      <path
                        d={barPath(x, y(d.revenue), barW, y(0))}
                        className={`fill-brand-600 transition-opacity ${
                          active !== null && !isActive ? 'opacity-40' : ''
                        }`}
                      />
                      {/* Label langsung hanya untuk hari terbaik */}
                      {i === bestIdx && d.revenue > 0 && (
                        <text
                          x={
                            x + barW / 2 > width - 34
                              ? x + barW
                              : x + barW / 2 < pad.left + 34
                                ? x
                                : x + barW / 2
                          }
                          y={y(d.revenue) - 6}
                          textAnchor={
                            x + barW / 2 > width - 34
                              ? 'end'
                              : x + barW / 2 < pad.left + 34
                                ? 'start'
                                : 'middle'
                          }
                          className="fill-ink-800 text-xs font-bold"
                        >
                          {rpShort(d.revenue)}
                        </text>
                      )}
                      {i % labelEvery === 0 && (
                        <text
                          x={x + barW / 2}
                          y={H - 6}
                          textAnchor="middle"
                          className="fill-ink-500 text-xs"
                        >
                          {d.label}
                        </text>
                      )}
                      {/* Area sentuh: satu kolom penuh, lebih besar dari batangnya */}
                      <rect
                        x={pad.left + band * i}
                        y={pad.top}
                        width={band}
                        height={innerH}
                        fill="transparent"
                        tabIndex={0}
                        aria-label={`${d.label}: ${rp(d.revenue)}, ${d.orders} transaksi`}
                        onMouseEnter={() => setActive(i)}
                        onFocus={() => setActive(i)}
                        onBlur={() => setActive(null)}
                        onClick={() => setActive(i)} // di HP, ketukan juga memicu hover; jangan di-toggle
                        className="cursor-pointer focus:outline-none"
                      />
                    </g>
                  )
                })}
              </svg>
            )}

            {activePoint && (
              <div
                className="pointer-events-none absolute bg-inverse text-white rounded-lg shadow-lg ring-1 ring-white/10 px-3 py-2 text-xs whitespace-nowrap"
                style={{
                  left: tooltipLeft,
                  top: tooltipAbove ? tooltipTop - 8 : tooltipTop + 8,
                  transform: `translate(-50%, ${tooltipAbove ? '-100%' : '0'})`,
                }}
              >
                <div className="font-bold">{activePoint.label}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-sm bg-brand-600" />
                  <span>{rp(activePoint.revenue)}</span>
                </div>
                <div className="text-stone-300">
                  {activePoint.orders} transaksi • {activePoint.pieces} pcs
                </div>
              </div>
            )}
          </div>

          {data.truncated && (
            <p className="text-xs text-ink-500">
              Grafik menampilkan {data.windowDays} hari terakhir. {data.omittedDays} hari transaksi
              sebelumnya tidak digambarkan; kartu omzet di atas tetap menghitung semua waktu.
            </p>
          )}

          <button
            onClick={() => setShowTable((v) => !v)}
            className="min-h-[44px] text-sm font-bold text-royal-700 hover:text-royal-900 underline underline-offset-2"
            aria-expanded={showTable}
          >
            {showTable ? 'Sembunyikan tabel' : 'Lihat sebagai tabel'}
          </button>
          {showTable && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-ink-500 border-b border-paper-200">
                    <th className="py-1.5 font-bold">Tanggal</th>
                    <th className="py-1.5 font-bold text-right">Transaksi</th>
                    <th className="py-1.5 font-bold text-right">Pcs</th>
                    <th className="py-1.5 font-bold text-right">Omzet</th>
                  </tr>
                </thead>
                <tbody className="tabular-nums">
                  {points.map((d) => (
                    <tr key={d.key} className="border-b border-paper-100 text-ink-800">
                      <td className="py-1.5">{d.label}</td>
                      <td className="py-1.5 text-right">{d.orders}</td>
                      <td className="py-1.5 text-right">{d.pieces}</td>
                      <td className="py-1.5 text-right font-bold">{rp(d.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </ChartCard>
  )
}


// ---------- 3. Omzet per menu (batang horizontal berurutan) ----------
export const MenuRevenueBars: React.FC<{ items: { name: string; pieces: number; revenue: number }[] }> = ({
  items,
}) => {
  const sorted = useMemo(() => [...items].sort((a, b) => b.revenue - a.revenue), [items])
  const shares = pctShares(sorted.map((i) => i.revenue))
  const max = sorted[0]?.revenue ?? 0
  return (
    <ChartCard
      title="Kontribusi Omzet per Menu"
      subtitle="Setelah diskon/promo, diurutkan dari penyumbang omzet terbesar"
    >
      {sorted.length === 0 ? (
        <EmptyState text="Belum ada menu yang terjual." />
      ) : (
        <ul className="space-y-3">
          {sorted.map((item, idx) => (
            <li key={item.name}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 text-xs">
                <span className="font-bold text-ink-800">{item.name}</span>
                <span className="text-ink-600 tabular-nums">
                  <span className="font-extrabold text-ink-900">{rp(item.revenue)}</span> • {shares[idx]}% •{' '}
                  {item.pieces} pcs
                </span>
              </div>
              <div className="mt-1.5 h-2.5 rounded-full bg-paper-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand-600 transition-[width] duration-700 ease-out"
                  style={{ width: `${max ? (item.revenue / max) * 100 : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  )
}

// ---------- 4. Metode pembayaran (bar tersegmen) ----------
export const PaymentSplitBar: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const counted = orders.filter(isCountedOrder)
  const parts = [
    { key: 'qris', name: 'Qris', fill: 'bg-chart-blue', swatch: 'bg-chart-blue' },
    { key: 'tunai', name: 'Tunai', fill: 'bg-brand-600', swatch: 'bg-brand-600' },
  ].map((p) => {
    const list = counted.filter((o) => o.paymentMethod === p.key)
    return { ...p, revenue: list.reduce((s, o) => s + o.total, 0), orders: list.length }
  })
  const total = parts.reduce((s, p) => s + p.revenue, 0)
  const shares = pctShares(parts.map((p) => p.revenue))
  const shareOf = (key: string) => shares[parts.findIndex((p) => p.key === key)] ?? 0

  return (
    <ChartCard title="Metode Pembayaran" subtitle="Porsi omzet lunas berdasarkan cara bayar">
      {total === 0 ? (
        <EmptyState text="Belum ada pembayaran yang tercatat." />
      ) : (
        <>
          {/* Celah 2px antarsegmen (gap) agar batas tetap jelas */}
          <div className="flex gap-0.5 h-9 rounded-md overflow-hidden" role="img"
            aria-label={parts.map((p) => `${p.name} ${shareOf(p.key)}%`).join(', ')}>
            {parts
              .filter((p) => p.revenue > 0)
              .map((p) => {
                const share = shareOf(p.key)
                return (
                  <div
                    key={p.key}
                    className={`${p.fill} flex items-center justify-center text-white text-xs font-extrabold min-w-[2rem]`}
                    style={{ flexGrow: p.revenue }}
                  >
                    {share >= 12 ? `${share}%` : ''}
                  </div>
                )
              })}
          </div>
          <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
            {parts.map((p) => (
              <li key={p.key} className="flex items-center gap-1.5 text-ink-700">
                <span className={`w-2.5 h-2.5 rounded-sm ${p.swatch}`} aria-hidden="true" />
                <span className="font-bold text-ink-900">{p.name}</span>
                <span className="tabular-nums">
                  {rp(p.revenue)} • {p.orders} transaksi
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </ChartCard>
  )
}
