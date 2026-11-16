import React, { useState } from 'react'
import { X } from 'lucide-react'
import { Order } from '../../types'
import { MAX_COMMENT_LENGTH, maskName } from '../../services/reviews'
import { StarInput } from './Stars'

interface ReviewModalProps {
  order: Order
  onClose: () => void
  onSubmit: (input: { ratings: Record<string, number>; comment: string; anonymous: boolean }) => Promise<void>
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ order, onClose, onSubmit }) => {
  // Satu baris per menu unik di pesanan (nama menu dari item pertamanya)
  const menus = order.items.reduce<{ id: string; name: string }[]>((acc, i) => {
    if (!acc.some((m) => m.id === i.menuItemId)) acc.push({ id: i.menuItemId, name: i.name })
    return acc
  }, [])

  const [ratings, setRatings] = useState<Record<string, number>>({})
  const [comment, setComment] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  const rated = Object.keys(ratings).length

  const handleSubmit = async () => {
    if (sending) return
    if (rated === 0) {
      setError('Beri bintang dulu untuk minimal satu menu.')
      return
    }
    setSending(true)
    setError('')
    try {
      await onSubmit({ ratings, comment, anonymous })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ulasan gagal terkirim. Coba lagi.')
      setSending(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="review-modal-title"
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 sm:backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:max-w-md bg-surface rounded-t-2xl sm:rounded-xl overflow-hidden shadow-xl max-h-[92dvh] flex flex-col border border-paper-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 bg-royal-600 text-white pl-4 pr-2 py-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 id="review-modal-title" className="font-display uppercase text-2xl leading-none">
              Beri ulasan
            </h2>
            <p className="text-xs text-white/80 tabular-nums mt-1">Pesanan #{order.id}</p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center text-white/80 hover:text-white"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-5">
          <ul className="divide-y-2 divide-royal-600/20 border-y-2 border-royal-600/20">
            {menus.map((m) => (
              <li key={m.id} className="py-2">
                <div className="font-extrabold text-royal-700 text-[1.05rem] leading-tight">{m.name}</div>
                <StarInput
                  label={`Bintang untuk ${m.name}`}
                  value={ratings[m.id] ?? 0}
                  onChange={(n) => {
                    setRatings((r) => ({ ...r, [m.id]: n }))
                    setError('')
                  }}
                />
              </li>
            ))}
          </ul>

          <div>
            <label htmlFor="review-comment" className="block text-sm font-bold text-ink-800 mb-1.5">
              Komentar <span className="font-medium text-ink-600">(opsional)</span>
            </label>
            <textarea
              id="review-comment"
              rows={3}
              maxLength={MAX_COMMENT_LENGTH}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Contoh: renyah, bumbunya pas"
              className="w-full px-3.5 py-2.5 border border-paper-300 rounded-lg focus:outline-none focus:border-brand-600 bg-paper-50 text-ink-900 placeholder:text-ink-500 resize-none"
            />
            <div className="text-xs text-ink-600 text-right tabular-nums">
              {comment.length}/{MAX_COMMENT_LENGTH}
            </div>
          </div>

          <label className="flex items-start gap-3 min-h-[44px] cursor-pointer">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="mt-0.5 w-5 h-5 accent-brand-600"
            />
            <span className="text-sm text-ink-800">
              <strong>Tampilkan sebagai anonim</strong>
              <span className="block text-xs text-ink-600">
                Ditampilkan sebagai: {maskName(order.customerName, anonymous)}
              </span>
            </span>
          </label>

          {error && (
            <p role="alert" className="text-sm font-bold text-red-700">
              {error}
            </p>
          )}
        </div>

        <div className="shrink-0 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] border-t border-paper-200 bg-paper-50">
          <button
            onClick={handleSubmit}
            disabled={sending}
            className="btn-3d w-full min-h-[52px] bg-brand-600 text-white text-sm font-extrabold disabled:opacity-60"
          >
            {sending ? 'Mengirim...' : 'Kirim ulasan'}
          </button>
        </div>
      </div>
    </div>
  )
}
