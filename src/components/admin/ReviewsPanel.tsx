import React, { useCallback, useEffect, useState } from 'react'
import { Eye, EyeOff, Trash2 } from 'lucide-react'
import { MENU_ITEMS } from '../../data/menu'
import { Review, formatAverage, summarizeByMenu } from '../../services/reviews'
import { deleteReview, getAllReviews, setReviewHidden } from '../../services/reviewStorage'
import { StarsRow } from '../customer/Stars'

const menuName = (id: string) => MENU_ITEMS.find((m) => m.id === id)?.name ?? id

// Moderasi ulasan: ulasan langsung tampil ke publik; admin bisa menyembunyikan atau menghapus.
export const ReviewsPanel: React.FC = () => {
  const [reviews, setReviews] = useState<Review[] | null>(null)
  const [error, setError] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const load = useCallback(() => getAllReviews().then(setReviews), [])
  useEffect(() => {
    load()
    const t = setInterval(() => document.visibilityState === 'visible' && load(), 30000)
    return () => clearInterval(t)
  }, [load])

  const run = async (fn: () => Promise<void>) => {
    setError('')
    try {
      await fn()
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal. Coba lagi.')
    }
  }

  if (reviews === null) return <p className="text-sm text-ink-600">Memuat ulasan...</p>

  const summary = summarizeByMenu(reviews)

  return (
    <div className="space-y-4">
      <div className="bg-surface border-t-4 border-royal-600 shadow-[0_6px_12px_-6px_rgb(8_16_48/0.4)] p-4">
        <h2 className="font-extrabold text-base text-ink-900">Rata-rata per menu</h2>
        <ul className="mt-2 divide-y divide-paper-200">
          {MENU_ITEMS.map((m) => (
            <li key={m.id} className="py-2 flex items-center justify-between gap-3 text-sm">
              <span className="font-bold text-ink-900">{m.name}</span>
              {summary[m.id] ? (
                <span className="inline-flex items-center gap-1.5 font-bold text-royal-700">
                  <StarsRow value={summary[m.id].average} />
                  <span className="tabular-nums">
                    {formatAverage(summary[m.id].average)} ({summary[m.id].count})
                  </span>
                </span>
              ) : (
                <span className="text-ink-600">Belum ada</span>
              )}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-ink-600">Ulasan yang disembunyikan tidak dihitung.</p>
      </div>

      {error && (
        <p role="alert" className="text-sm font-bold text-red-700">
          {error}
        </p>
      )}

      {reviews.length === 0 ? (
        <div className="py-10 text-center text-ink-600 text-sm">Belum ada ulasan masuk.</div>
      ) : (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li
              key={r.id}
              className={`bg-surface border border-paper-300 p-3.5 space-y-2 ${r.hidden ? 'opacity-60' : ''}`}
            >
              <div className="min-w-0">
                <div className="text-sm font-extrabold text-ink-900">
                  {r.displayName}{' '}
                  <span className="text-xs font-semibold text-ink-600 tabular-nums">• #{r.orderId}</span>
                </div>
                <div className="text-xs text-ink-600">
                  {new Date(r.createdAt).toLocaleString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Jakarta',
                  })}
                  {r.hidden && <strong className="ml-2 text-red-700">Disembunyikan</strong>}
                </div>
              </div>
              <ul className="space-y-0.5 text-sm">
                {Object.entries(r.ratings).map(([menuId, stars]) => (
                  <li key={menuId} className="flex items-center justify-between gap-3">
                    <span className="text-ink-800">{menuName(menuId)}</span>
                    <StarsRow value={stars} />
                  </li>
                ))}
              </ul>
              {r.comment && <p className="text-sm text-ink-800 break-words">{r.comment}</p>}

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => run(() => setReviewHidden(r.id, !r.hidden))}
                  className="min-h-[44px] px-3 border border-paper-300 bg-surface text-sm font-bold text-ink-800 flex items-center gap-1.5"
                >
                  {r.hidden ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {r.hidden ? 'Tampilkan' : 'Sembunyikan'}
                </button>
                {confirmDeleteId === r.id ? (
                  <>
                    <button
                      onClick={() => run(() => deleteReview(r.id)).then(() => setConfirmDeleteId(null))}
                      className="min-h-[44px] px-3 bg-red-700 text-white text-sm font-extrabold"
                    >
                      Ya, hapus
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="min-h-[44px] px-3 border border-paper-300 text-sm font-bold text-ink-800"
                    >
                      Batal
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteId(r.id)}
                    aria-label="Hapus ulasan"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center border border-paper-300 text-ink-700 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
