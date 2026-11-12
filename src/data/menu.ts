import { MenuItem } from '../types'

export const MENU_ITEMS: MenuItem[] = [
  {
    id: 'cibay-pedas',
    name: 'Cibay Lumer Gurih',
    category: 'gurih',
    tagline: 'Aci ngambay kenyal berbalut kulit lumpia renyah',
    description:
      'Jajanan khas Sunda dengan isian aci gurih lumer berbumbu ayam & daun bawang, dibungkus kulit lumpia garing digoreng fresh saat pemesanan. Disajikan dengan taburan bumbu cabai pedas gurih!',
    image: '/menu/cibay-lumer.png',
    spicyLevel: 2,
    isPopular: true,
    options: [
      { id: 'cibay-1', label: '1 Pcs (Snack Pas)', pieces: 1, price: 3000 },
      { id: 'cibay-2', label: '2 Pcs (Paling Laris)', pieces: 2, price: 5000, savings: 1000 },
    ],
  },
  {
    id: 'ramyeon-roll',
    name: 'Spicy Ramyeon Roll',
    category: 'gurih',
    tagline: 'Sensasi Ramyeon Korea digulung Rice Paper viral',
    description:
      'Perpaduan mie instan pedas Korea racikan gurih dibungkus lembaran rice paper kenyal transparan. Tekstur kenyal luar, meledak pedas gurih di dalam! Cocok disantap hangat.',
    image: '/menu/spicy-ramyeon-roll.png',
    spicyLevel: 3,
    isPopular: true,
    options: [
      { id: 'roll-1', label: '1 Pcs (Coba Dulu)', pieces: 1, price: 5000 },
      { id: 'roll-2', label: '2 Pcs (Puas Nampol)', pieces: 2, price: 9000, savings: 1000 },
    ],
  },
  {
    id: 'puding-karamel',
    name: 'Puding Karamel & Buah Dingin',
    category: 'manis',
    tagline: 'Dessert cup segar pelepas dahaga & pereda pedas',
    description:
      'Puding susu sutra lembut dengan siraman saus karamel legit ditambah potongan buah segar (mangga / stroberi) dingin. Menjaga mood kuliah tetap segar setelah cemil yang pedas!',
    image: '/menu/puding.png',
    spicyLevel: 0,
    isPopular: true,
    options: [
      { id: 'puding-std', label: '1 Cup Reguler (Segar Dingin)', pieces: 1, price: 10000 },
      { id: 'puding-premium', label: '1 Cup Jumbo Extra Buah', pieces: 1, price: 12000 },
    ],
  },
  {
    id: 'paket-combo',
    name: 'Paket Combo Juara (Cibay + Roll)',
    category: 'combo',
    tagline: '2 Cibay + 2 Spicy Ramyeon Roll hemat Rp1.000',
    description:
      'Pilihan terbaik buat nongkrong bareng bestie! Langsung dapat 2 Cibay Lumer + 2 Spicy Ramyeon Roll. Lebih hemat dibanding beli satuan!',
    image: '/menu/paket-combo.png',
    spicyLevel: 2,
    isBestValue: true,
    options: [
      {
        id: 'combo-super',
        label: '1 Paket (2 Cibay + 2 Roll)',
        pieces: 4,
        price: 13000,
        savings: 1000,
      },
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
