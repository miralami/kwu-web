import { MenuItem } from '../types'

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'cibay-pedas',
    name: 'Mozzarella Sunda', // id tetap 'cibay-pedas' agar rekap pesanan lama tetap tergabung
    category: 'gurih',
    tagline: 'Aci ngambay kenyal berbalut kulit lumpia renyah',
    description:
      'Jajanan khas Sunda dengan isian aci gurih lumer berbumbu ayam & daun bawang, dibungkus kulit lumpia garing digoreng fresh saat pemesanan. Disajikan dengan taburan bumbu cabai pedas gurih!',
    image: '/menu/cibay.webp',
    isPopular: true,
    options: [
      { id: 'cibay-porsi', label: '1 Porsi (Isi 3 Pcs)', pieces: 3, price: 10000 },
    ],
  },
  {
    id: 'ramyeon-roll',
    name: 'Spicy Ramyeon Roll',
    category: 'gurih',
    tagline: 'Sensasi Ramyeon Korea digulung Rice Paper viral',
    description:
      'Perpaduan mie instan pedas Korea racikan gurih dibungkus lembaran rice paper kenyal transparan. Tekstur kenyal luar, meledak pedas gurih di dalam! Cocok disantap hangat.',
    image: '/menu/samyang.webp',
    isPopular: true,
    options: [
      { id: 'roll-porsi', label: '1 Porsi (Isi 4 Pcs)', pieces: 4, price: 10000 },
    ],
  },
  {
    id: 'puding-karamel',
    name: 'Puding Buah',
    category: 'manis',
    tagline: 'Dessert cup segar pelepas dahaga & pereda pedas',
    description:
      'Puding susu sutra lembut dengan potongan buah segar (mangga / stroberi) dingin. Menjaga mood kuliah tetap segar setelah cemil yang pedas!',
    image: '/menu/jelly.webp',
    isPopular: true,
    options: [
      { id: 'puding-cup', label: '1 Cup', pieces: 1, price: 15000 },
    ],
  },
]

export const REFERRAL_CODES: Record<string, { discount: number; label: string }> = {
  RAWONSETO: { discount: 1000, label: 'Diskon Spesial Rawon Seto (Rp1.000)' },
  LARISMANIS: { discount: 1000, label: 'Promo Teman Kampus (Rp1.000)' },
  TELKOM26: { discount: 1000, label: 'Diskon Mahasiswa Tel-U (Rp1.000)' },
}

export const ADMIN_CONTACT = {
  name: 'Admin PO Laris Manis (Yudi / Willy)',
  phone: '6285717600986', // WhatsApp number from group chat
  qrisName: 'LARIS MANIS KWU TELKOM',
  qrisNmid: 'ID1025439257516',
  qrisImage: '/qris.png', // QRIS statis GoPay Merchant
  pickupPoint: 'Lantai 3 Gedung C / Gazebo Kampus Telkom University Jakarta',
}
