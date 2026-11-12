import { Order } from '../types'
import { ADMIN_CONTACT } from './menu'

export type StatusTone = 'waiting' | 'cooking' | 'ready' | 'done' | 'problem'

export interface CustomerStatus {
  label: string
  message: string
  tone: StatusTone
}

// Status pesanan dari sudut pandang pelanggan (bahasa sederhana, bukan istilah admin)
export function getCustomerStatus(order: Order): CustomerStatus {
  if (order.orderStatus === 'dibatalkan') {
    return {
      label: 'Dibatalkan',
      message: 'Pesanan ini dibatalkan. Hubungi admin via WhatsApp jika ada pertanyaan.',
      tone: 'problem',
    }
  }
  if (order.paymentStatus === 'rejected') {
    return {
      label: 'Pembayaran ditolak',
      message: 'Bukti pembayaran belum sesuai. Hubungi admin via WhatsApp untuk dicek ulang.',
      tone: 'problem',
    }
  }
  if (order.orderStatus === 'selesai') {
    return {
      label: 'Selesai',
      message: 'Pesanan sudah diambil. Terima kasih sudah jajan di Laris Manis!',
      tone: 'done',
    }
  }
  if (order.orderStatus === 'siap_diambil') {
    return {
      label: 'Siap diambil',
      message: `Pesananmu sudah siap! Ambil di ${ADMIN_CONTACT.pickupPoint}.`,
      tone: 'ready',
    }
  }
  if (order.orderStatus === 'sedang_diproses') {
    return {
      label: 'Sedang dimasak',
      message: 'Pembayaran sudah diterima dan pesananmu sedang dimasak.',
      tone: 'cooking',
    }
  }
  if (order.paymentMethod === 'qris' && order.paymentStatus === 'pending') {
    return {
      label: 'Menunggu verifikasi',
      message: 'Admin sedang mengecek pembayaran QRIS kamu. Status akan berubah otomatis.',
      tone: 'waiting',
    }
  }
  return {
    label: 'Pesanan diterima',
    message: 'Pesanan sudah masuk dan segera dimasak.',
    tone: 'waiting',
  }
}

export const STATUS_TONE_CLASS: Record<StatusTone, string> = {
  waiting: 'bg-accent-100 text-ink-900 border-accent-200',
  cooking: 'bg-brand-50 text-brand-800 border-brand-200',
  ready: 'bg-green-50 text-green-900 border-green-200',
  done: 'bg-paper-100 text-ink-700 border-paper-200',
  problem: 'bg-red-50 text-red-800 border-red-200',
}

export function isOrderActive(order: Order): boolean {
  return order.orderStatus !== 'selesai' && order.orderStatus !== 'dibatalkan'
}
