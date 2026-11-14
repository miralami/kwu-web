import React from 'react'
import { Check, CookingPot, Clock, PackageCheck, X, LucideIcon } from 'lucide-react'
import { Order } from '../../types'
import { CookingPotAnimated } from './CookingPotAnimated'

type StepState = 'complete' | 'current' | 'upcoming' | 'problem'

interface StepDef {
  label: string
  icon: LucideIcon
  currentClass: string // warna lingkaran saat langkah ini sedang berjalan
  motionClass: string // gerakan ikon saat langkah ini sedang berjalan
  currentIcon?: React.ReactNode // ikon animasi khusus, menggantikan icon + motionClass
}

const STEPS: StepDef[] = [
  {
    label: 'Bayar',
    icon: Clock,
    currentClass: 'bg-accent-500 text-stone-900',
    motionClass: 'motion-safe:animate-spin-tick',
  },
  {
    label: 'Dimasak',
    icon: CookingPot,
    currentClass: 'bg-brand-600 text-white',
    motionClass: '',
    currentIcon: <CookingPotAnimated className="w-7 h-7" />,
  },
  {
    label: 'Siap Ambil',
    icon: PackageCheck,
    currentClass: 'bg-green-700 text-white',
    motionClass: 'motion-safe:animate-bob',
  },
]

// Langkah yang sedang berjalan (0-2), atau 3 jika semua selesai
function getStage(order: Order): number {
  // Belum diverifikasi admin: tetap di langkah Bayar
  if (order.paymentStatus !== 'verified') return 0
  if (order.orderStatus === 'selesai') return 3
  if (order.orderStatus === 'siap_diambil') return 2
  if (order.orderStatus === 'sedang_diproses') return 1
  // Sudah lunas tapi belum mulai dimasak: antre di langkah masak
  if (order.paymentStatus === 'verified') return 1
  return 0
}

export const OrderStatusStepper: React.FC<{ order: Order }> = ({ order }) => {
  const stage = getStage(order)
  const isProblem = order.orderStatus === 'dibatalkan' || order.paymentStatus === 'rejected'

  const stateOf = (i: number): StepState => {
    if (i < stage) return 'complete'
    if (i === stage) return isProblem ? 'problem' : 'current'
    return 'upcoming'
  }

  return (
    <div className="flex items-start" aria-hidden="true">
      {STEPS.map((step, i) => {
        const state = stateOf(i)
        const Icon = state === 'complete' ? Check : state === 'problem' ? X : step.icon

        return (
          <React.Fragment key={step.label}>
            <div className="flex flex-col items-center w-16 shrink-0">
              <div className="relative w-9 h-9">
                <div
                  // key berganti saat status berubah, sehingga animasi muncul diputar ulang
                  key={state}
                  className={`relative w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition-colors duration-500 motion-safe:animate-pop-in ${
                    state === 'complete'
                      ? 'bg-green-700 text-white'
                      : state === 'current'
                      ? step.currentClass
                      : state === 'problem'
                      ? 'bg-red-600 text-white'
                      : 'bg-paper-200 text-ink-400'
                  }`}
                >
                  {state === 'current' && step.currentIcon ? (
                    step.currentIcon
                  ) : (
                    <Icon className={`w-4 h-4 ${state === 'current' ? step.motionClass : ''}`} />
                  )}
                </div>
              </div>
              <span
                className={`text-xs mt-1.5 text-center leading-tight ${
                  state === 'current' || state === 'problem'
                    ? 'font-extrabold text-ink-900'
                    : state === 'complete'
                    ? 'font-bold text-green-800'
                    : 'font-semibold text-ink-400'
                }`}
              >
                {step.label}
              </span>
            </div>

            {i < STEPS.length - 1 && (
              <div className="flex-1 h-1.5 mt-[15px] mx-0.5 rounded-full bg-paper-200 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ease-out ${
                    i < stage
                      ? 'w-full bg-green-700'
                      : i === stage && !isProblem
                      ? 'w-1/2 bg-brand-500 progress-stripes motion-safe:animate-stripes'
                      : 'w-0'
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}
