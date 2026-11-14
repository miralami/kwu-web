# Laris Manis — Web PO & POS Kampus Telkom University

Aplikasi web pemesanan mandiri (*Pre-Order*) dan kasir POS jajanan kampus untuk **Kelompok 1 Kewirausahaan (S1SI-KJ-23-002, Telkom University Jakarta)**.

Dibangun dengan pendekatan mobile-first, zero third-party gateway fee (QRIS Statis UMKM), standar sentuh ramah jempol (Kiosk UX Master Checklist), dan desain bebas AI slop.

---

## 📖 Dokumentasi Lengkap

Seluruh detail spesifikasi produk, resep/menu, struktur 11 anggota tim, catatan finansial, alur verifikasi QRIS, hingga standar UX diarsipkan di:

👉 **[Buka Dokumentasi Lengkap (docs/MANUAL.md)](docs/MANUAL.md)**

Arsip pendukung lainnya di dalam folder `docs/`:
- [`docs/PRODUCT.md`](docs/PRODUCT.md) — Kontrak & kapabilitas produk
- [`docs/DESIGN.md`](docs/DESIGN.md) — Token desain & panduan visual (*Warm Deli & Street Food Editorial*)
- [`docs/AUDIT_NOTES.md`](docs/AUDIT_NOTES.md) — Hasil audit Kiosk UX & checklist anti-AI slop

---

## 🚀 Fitur Unggulan

1. **Katalog & Checkout Kilat (≤30 Detik)**
   - Tombol + langsung di tiap baris menu, jumlah bisa diketik di keranjang.
   - Quick chips lokasi kampus (`S1SI-02`, `Lantai 3 Gedung B`, dll).
   - Sticky bottom bar permanen di area jempol layar HP.
2. **QRIS Statis & WhatsApp Handoff**
   - Checkout online hanya QRIS; pesanan baru dihitung omzet setelah admin memverifikasi pembayaran.
   - Pembeli bisa membatalkan sendiri pesanan yang belum dibayar.
   - Tombol unduh QRIS instan ke galeri HP.
   - Format pesan konfirmasi 1-klik terhubung langsung ke WhatsApp kasir tim.
3. **Panel Admin & Kasir Walk-in (kata sandi tim)**
   - Filter live antrean: *Cek QRIS*, *Dimasak*, *Siap Ambil*, *Selesai*.
   - Kasir offline untuk mencatat transaksi langsung mahasiswa/dosen yang mampir di booth.
   - Pelacak target 738 pcs & estimasi laba kotor 40.5% secara real-time.
   - Salin laporan siap kirim ke WhatsApp dosen dan ekspor data CSV.

---

## 🛠️ Menjalankan Proyek

### Prasyarat
- Node.js 18+
- npm / pnpm / yarn

### Instalasi & Dev Server
```bash
npm install
npm run dev
```

### Production Build & Type Check
```bash
npm run build
```
