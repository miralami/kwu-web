import React from 'react'
import { Star } from 'lucide-react'

// Bintang tampilan saja (rata-rata / ulasan orang lain)
export const StarsRow: React.FC<{ value: number; className?: string }> = ({ value, className = 'w-3.5 h-3.5' }) => (
  <span className="inline-flex" role="img" aria-label={`${value} dari 5 bintang`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <Star
        key={n}
        aria-hidden="true"
        className={`${className} ${
          value >= n - 0.25 ? 'fill-brand-600 text-brand-600' : 'fill-transparent text-royal-600/40'
        }`}
        strokeWidth={2.5}
      />
    ))}
  </span>
)

// Bintang yang bisa dipilih pembeli; target sentuh 44px
export const StarInput: React.FC<{
  value: number
  onChange: (n: number) => void
  label: string
}> = ({ value, onChange, label }) => (
  <div role="radiogroup" aria-label={label} className="flex -ml-1.5">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        role="radio"
        aria-checked={value === n}
        aria-label={`${n} bintang`}
        onClick={() => onChange(n)}
        className="min-h-[44px] min-w-[44px] flex items-center justify-center active:scale-90 transition-transform"
      >
        <Star
          className={`w-8 h-8 ${
            value >= n ? 'fill-brand-600 text-brand-600' : 'fill-transparent text-royal-600/40'
          }`}
          strokeWidth={2.5}
        />
      </button>
    ))}
  </div>
)
