import React from 'react'
import { ChevronRight, ReceiptText } from 'lucide-react'
import { Order } from '../../types'
import { getCustomerStatus, STATUS_TONE_CLASS } from '../../data/orderStatus'

interface MyOrdersBannerProps {
  orders: Order[]
  onOpenOrder: (orderId: string) => void
}

export const MyOrdersBanner: React.FC<MyOrdersBannerProps> = ({ orders, onOpenOrder }) => {
  if (orders.length === 0) return null

  return (
    <section aria-labelledby="my-orders-title" className="mb-5 space-y-2">
      <h2
        id="my-orders-title"
        className="text-xs font-extrabold text-ink-600 uppercase tracking-wider flex items-center gap-1.5"
      >
        <ReceiptText className="w-3.5 h-3.5" /> Pesanan Saya
      </h2>
      {orders.map((order) => {
        const status = getCustomerStatus(order)
        return (
          <button
            key={order.id}
            onClick={() => onOpenOrder(order.id)}
            className="w-full min-h-[56px] bg-white border border-paper-200 rounded-lg p-3 flex items-center justify-between gap-3 text-left hover:border-ink-500 transition-colors shadow-sm"
          >
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-ink-900">
                #{order.id}{' '}
                <span className="text-xs font-semibold text-ink-500">
                  • Rp{order.total.toLocaleString('id-ID')}
                </span>
              </div>
              <span
                className={`inline-block mt-1 text-xs font-bold px-2 py-0.5 rounded border ${STATUS_TONE_CLASS[status.tone]}`}
              >
                {status.label}
              </span>
            </div>
            <span className="text-xs font-bold text-brand-700 flex items-center gap-0.5 shrink-0">
              Lihat <ChevronRight className="w-4 h-4" />
            </span>
          </button>
        )
      })}
    </section>
  )
}
