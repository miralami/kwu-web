# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + React 18 + TypeScript + Tailwind CSS

## Users

1. **Mahasiswa & Dosen Telkom University Jakarta (Pembeli / Customer):** Membeli jajanan di sela jam kuliah atau istirahat kampus. Akses lewat link WhatsApp / bio Instagram atau scan QR di meja kampus. Terburu-buru, mobile, mengutamakan kecepatan pemesanan tanpa antre lama.
2. **Tim KWU Kelompok 1 (11 Mahasiswa SI Tel-U / Admin & Kasir):** Bertugas mencatat pesanan, memverifikasi transfer QRIS statis, memantau antrean masak di dapur kampus, melayani walk-in POS offline, dan merekap omzet untuk laporan dosen (Pak Ardi / DIS).

## Product Purpose

Platform pemesanan mandiri (Pre-Order) dan POS kasir kampus terintegrasi yang menggantikan formulir kertas dan Google Form manual. Menghilangkan antrean fisik, mengotomatisasi pencatatan omzet dan laba kotor, serta menyediakan alur pembayaran QRIS statis yang transparan dengan konfirmasi instan.

## Positioning

Satu-satunya sistem pemesanan jajanan khas kampus Tel-U (Cibay & Spicy Ramyeon Roll) yang dirancang khusus untuk ritme mahasiswa: mobile-first, tanpa download aplikasi, alur checkout satu layar dalam 30 detik, disertai verifikasi QRIS statis anti-fee pihak ketiga dan rekap instan ke WhatsApp dosen/kelompok.

## Operating Context

- Digunakan di lingkungan kampus Telkom University Jakarta (Lantai 3 Gedung B, selasar kelas, gazebo).
- Layar diakses di smartphone pembeli (pencahayaan bervariasi: outdoor terang hingga lorong kelas redup).
- Waktu jeda antar kelas pendek (10–15 menit), membutuhkan keputusan pembelian yang sangat cepat dan minim friksi.

## Capabilities and Constraints

- **Capabilities:**
  - Katalog menu dinamis dengan pilihan porsi (1 pcs / 2 pcs) dan harga hemat otomatis.
  - Alur keranjang belanja dengan input data ringkas (Nama, WA, Kelas/Lokasi jemput).
  - Layar QRIS Statis interaktif dengan countdown bayar 15 menit, fitur salin nominal presisi, unduh gambar QRIS ke galeri HP, dan tombol 1-klik kirim rekap ke WhatsApp admin.
  - Panel Admin/Kasir offline dengan PIN keamanan tim (`1234`), filter live antrean (Perlu Cek QRIS, Dimasak, Siap Ambil, Selesai), dan input cepat walk-in.
  - Laporan finansial otomatis: Real-time Omzet, Target Pcs (738 pcs), Estimasi Laba Kotor (40.5%), Ekspor CSV dan format teks WhatsApp siap kirim.
  - Widget asisten info produk virtual (draft feature).
- **Constraints:**
  - Menggunakan QRIS Statis UMKM (tanpa gateway berbayar) untuk melindungi margin keuntungan mahasiswa.
  - Dual-mode data layer: otomatis berjalan offline di localStorage bila Supabase belum dihubungkan.

## Brand Commitments

- **Brand Name:** Laris Manis
- **Sub-tagline:** Jajanan Sunda ✕ Korea & Dessert Segar Kampus
- **Kelompok:** Kelompok 1, Kelas S1SI-KJ-23-002, Telkom University Jakarta
- **Color Identity:** Warm Terracotta Chili (`#c2410c`), Charcoal Black (`#1c1917`), Unbleached Paper Warm Neutral (`#fcfbf9` & `#f4f1ea`)
- **Tone of Voice:** Ramah, sigap, lugas khas anak muda kampus, tanpa istilah korporat kaku.

## Evidence on Hand

- Business Plan Resmi Kelompok 1 (Revised) & Pitch Deck V2 Tel-U Jakarta (`KWU CONTEXT/`).
- WhatsApp Chat Export per 11 November 2026 (`chat.md`).
- Logo resmi Laris Manis (`public/logo.png`, `public/1.png`).
- Kiosk UX Audit Master Checklist (`AUDIT_NOTES.md`).

## Product Principles

1. **Kecepatan Satu Tangan (Thumb-Zone Ergonomics):** Seluruh aksi utama (pilih menu, atur porsi, checkout) dapat diselesaikan dengan satu tangan di layar HP dalam waktu kurang dari 30 detik.
2. **Keterbukaan Finansial & Transaksi:** Harga selalu jujur, breakdown item jelas, kode bayar persis, dan bukti invoice tersimpan rapi untuk pembeli maupun audit dosen.
3. **Anti-AI Slop & Autentisitas Kuliner:** Menggunakan tipografi tegas, layout taktil kertas kuliner, kontras tinggi, dan menghilangkan semua ornamen grafis generik yang tidak fungsional.
4. **Resiliensi Lapangan:** Sistem harus tetap bekerja saat sinyal kampus lambat; pesanan selalu memiliki cadangan pesan WhatsApp langsung ke pengurus.

## Accessibility & Inclusion

- Standar WCAG 2.2 AA: Kontras teks minimal 4.5:1 untuk body dan 3:1 untuk kontrol besar.
- Area sentuh minimal 44 × 44 CSS px pada semua tombol interaktif dan quantity steppers.
- Tidak mengandalkan warna semata untuk menandai status (selalu sertakan label teks dan ikon penjelas).
