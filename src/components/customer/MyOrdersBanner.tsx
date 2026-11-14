import React from 'react'
import { ChevronRight, ReceiptText } from 'lucide-react'
import { Order } from '../../types'
import {
  getCustomerStatus,
  isAwaitingPayment,
  isOrderActive,
  STATUS_TONE_CLASS,
} from '../../data/orderStatus'

interface MyOrdersBannerProps {
  orders: Order[]
  onOpenOrder: (orderId: string) => void
}

export const MyOrdersBanner: React.FC<MyOrdersBannerProps> = ({ orders, onOpenOrder }) => {
  if (orders.length === 0) return null

  return (
    <section aria-labelledby="my-orders-title" className="mb-4 space-y-2">
      <h2
        id="my-orders-title"
        className="text-sm font-extrabold text-ink-800 flex items-center gap-1.5"
      >
        <ReceiptText className="w-4 h-4" /> Pesanan Saya
      </h2>
      {orders.map((order) => {
        const status = getCustomerStatus(order)
        return (
          <button
            key={order.id}
            onClick={() => onOpenOrder(order.id)}
            className="btn-card w-full min-h-[64px] bg-surface border border-paper-300 px-3.5 py-3 flex items-center justify-between gap-3 text-left hover:border-ink-500 active:bg-paper-100 transition-colors"
          >
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-ink-900 tabular-nums">
                #{order.id}{' '}
                <span className="text-xs font-semibold text-ink-600">
                  • Rp{order.total.toLocaleString('id-ID')}
                </span>
              </div>
              <span
                key={status.label}
                className={`inline-flex items-center gap-1.5 mt-1 text-xs font-bold px-2.5 py-0.5 rounded-full border motion-safe:animate-status-in ${STATUS_TONE_CLASS[status.tone]}`}
              >
                {isOrderActive(order) && status.tone !== 'problem' && (
                  // Titik berdenyut: tanda pesanan masih berjalan
                  <span className="relative flex w-2 h-2" aria-hidden="true">
                    <span className="absolute inset-0 rounded-full bg-current opacity-50 motion-safe:animate-ping" />
                    <span className="relative w-2 h-2 rounded-full bg-current" />
                  </span>
                )}
                {status.label}
              </span>
            </div>
            <span className="text-sm font-bold text-brand-700 flex items-center gap-0.5 shrink-0">
              {isAwaitingPayment(order) && order.paymentMethod === 'qris' ? 'Bayar' : 'Lihat'}{' '}
              <ChevronRight className="w-4 h-4" />
            </span>
          </button>
        )
      })}
    </section>
  )
}
