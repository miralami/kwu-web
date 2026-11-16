import { Order } from '../types'
import { supabase, isMissingFunction, getMyOrderRefs } from './storage'
import { MAX_COMMENT_LENGTH, Review, maskName, sanitizeRatings } from './reviews'

// Review pembeli. Dengan Supabase: lewat fungsi database (create_review / get_public_reviews),
// token pesanan yang membuktikan pembeli. Tanpa Supabase (mode demo): disimpan di localStorage.

const REVIEWS_KEY = 'laris_manis_reviews_v1'
const REVIEWED_KEY = 'laris_manis_reviewed_orders_v1' // id pesanan yang sudah diulas di HP ini

type Listener = (reviews: Review[]) => void
const listeners = new Set<Listener>()

function readLocal(): Review[] {
  try {
    const list = JSON.parse(localStorage.getItem(REVIEWS_KEY) || '[]')
    return Array.isArray(list) ? (list as Review[]) : []
  } catch {
    return []
  }
}

function writeLocal(list: Review[]) {
  try {
    localStorage.setItem(REVIEWS_KEY, JSON.stringify(list))
  } catch {
    // Penyimpanan diblokir: ulasan hanya bertahan selama tab terbuka
  }
}

export function subscribeReviews(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function notify(list: Review[]) {
  listeners.forEach((l) => l(list))
}

export function getReviewedOrderIds(): Set<string> {
  try {
    const list = JSON.parse(localStorage.getItem(REVIEWED_KEY) || '[]')
    return new Set(Array.isArray(list) ? list : [])
  } catch {
    return new Set()
  }
}

function rememberReviewed(orderId: string) {
  try {
    localStorage.setItem(REVIEWED_KEY, JSON.stringify([...getReviewedOrderIds(), orderId]))
  } catch {
    // diabaikan
  }
}

let lastServerReviews: Review[] = []

/** Ulasan yang terlihat publik (tidak tersembunyi), untuk katalog pembeli. */
export async function getPublicReviews(): Promise<Review[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc('get_public_reviews')
      if (!error && Array.isArray(data)) {
        lastServerReviews = data as Review[]
      } else if (error && !isMissingFunction(error)) {
        console.warn('get_public_reviews gagal:', error)
      }
    } catch (e) {
      console.warn('Supabase fetch reviews failed:', e)
    }
    return lastServerReviews
  }
  return readLocal().filter((r) => !r.hidden)
}

export interface NewReview {
  order: Order
  ratings: Record<string, number>
  comment: string
  anonymous: boolean
}

/** Pembeli mengirim ulasan untuk pesanannya yang sudah selesai. Satu ulasan per pesanan. */
export async function createReview(input: NewReview): Promise<void> {
  const { order } = input
  const menuIds = [...new Set(order.items.map((i) => i.menuItemId))]
  const ratings = sanitizeRatings(input.ratings, menuIds)
  if (Object.keys(ratings).length === 0) throw new Error('Beri bintang dulu untuk minimal satu menu.')
  const comment = input.comment.trim().slice(0, MAX_COMMENT_LENGTH)

  if (supabase) {
    const token = getMyOrderRefs().find((r) => r.id === order.id)?.token ?? ''
    const { error } = await supabase.rpc('create_review', {
      p_order_id: order.id,
      p_token: token,
      p_ratings: ratings,
      p_comment: comment,
      p_anonymous: input.anonymous,
    })
    if (error) {
      if (isMissingFunction(error)) {
        throw new Error('Fitur ulasan belum aktif di server. Hubungi admin.')
      }
      if (/sudah/i.test(error.message ?? '')) {
        rememberReviewed(order.id)
        throw new Error('Pesanan ini sudah pernah diulas. Terima kasih!')
      }
      console.error('Failed to create review:', error)
      throw new Error('Ulasan gagal terkirim. Periksa koneksi internet lalu coba lagi.')
    }
    rememberReviewed(order.id)
    getPublicReviews().then(notify)
    return
  }

  const current = readLocal()
  if (current.some((r) => r.orderId === order.id)) {
    rememberReviewed(order.id)
    throw new Error('Pesanan ini sudah pernah diulas. Terima kasih!')
  }
  const review: Review = {
    id: `rv-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    orderId: order.id,
    displayName: maskName(order.customerName, input.anonymous),
    ratings,
    comment,
    hidden: false,
    createdAt: new Date().toISOString(),
  }
  const updated = [review, ...current]
  writeLocal(updated)
  rememberReviewed(order.id)
  notify(updated.filter((r) => !r.hidden))
}

// --- Admin ---

/** Semua ulasan termasuk yang disembunyikan. Di Supabase hanya admin yang boleh membaca tabelnya. */
export async function getAllReviews(): Promise<Review[]> {
  if (supabase) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('createdAt', { ascending: false })
    if (error) {
      console.warn('Gagal memuat ulasan (admin):', error)
      return []
    }
    return data as Review[]
  }
  return readLocal().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function setReviewHidden(id: string, hidden: boolean): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('reviews').update({ hidden }).eq('id', id)
    if (error) throw new Error('Gagal mengubah ulasan di server. Periksa koneksi lalu coba lagi.')
  } else {
    writeLocal(readLocal().map((r) => (r.id === id ? { ...r, hidden } : r)))
  }
  getPublicReviews().then(notify)
}

export async function deleteReview(id: string): Promise<void> {
  if (supabase) {
    const { error } = await supabase.from('reviews').delete().eq('id', id)
    if (error) throw new Error('Gagal menghapus ulasan di server. Periksa koneksi lalu coba lagi.')
  } else {
    writeLocal(readLocal().filter((r) => r.id !== id))
  }
  getPublicReviews().then(notify)
}
