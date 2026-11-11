# Dokumentasi Teknis & Panduan Lengkap: Laris Manis

Dokumen ini berisi seluruh ringkasan teknis, arsitektur sistem, aturan desain, data finansial, dan keputusan penting proyek **Laris Manis** (Web Pre-Order & Kasir POS Kampus Telkom University Jakarta).

---

## 1. Identitas & Konteks Proyek

- **Nama Usaha:** Laris Manis
- **Tagline:** Jajanan Sunda ✕ Korea & Dessert Segar Kampus
- **Kelompok:** Kelompok 1, Kelas S1SI-KJ-23-002, Telkom University Jakarta
- **Mata Kuliah:** Kewirausahaan (Dosen: Pak Ardi / DIS)
- **Target Penjualan (Minggu 10–12):** 738 pcs (Target Omzet: Rp4.786.000, Margin Kotor: ~40.5%)
- **Lokasi Penjualan & Pickup:** Lantai 3 Gedung B, Kampus Telkom University Jakarta
- **Kontak WhatsApp Admin / Kasir:** `6285717600986` (Willyansyah / Tim Operasional)

---

## 2. Struktur Tim (11 Mahasiswa)

| Divisi | Anggota | Tanggung Jawab Utama |
|---|---|---|
| **Ketua Tim** | Muhammad Rayfan Pashya (102042300174) | Koordinasi tim, jadwal jualan, presentasi pitching |
| **Produksi & R&D** | Afif Nur Sena, Qalam Raydathul Sabani, Fajar Maulana, Rachmat Akbar | SOP resep, uji rasa, persiapan bahan baku Cibay & Roll |
| **Pemasaran & Kreatif** | Vio Salman Kafiyan, Rayfan | Instagram Stories, poster PO, kampanye promo kampus |
| **Keuangan** | Rayhan Arya Ardani, Adam Priyatna | HPP, pencatatan kas, invoice bahan, laporan laba rugi |
| **Penjualan & POS** | Yudi Hokiana, Willyansyah, Muhammad Fahmi Yusuf | Kasir booth, verifikasi mutasi QRIS, delivery kampus |

---

## 3. Spesifikasi Menu & Skema Harga

| Menu | Kategori | Varian / Porsi | Harga | Keterangan / HPP |
|---|---|---|---|---|
| **Cibay Gurih Lumer** | Gurih & Pedas | 1 Pcs (Isi 1) | Rp3.000 | Camilan aci ayam daun bawang kulit lumpia renyah |
| | | 2 Pcs (Isi 2) | Rp5.000 | Hemat Rp1.000 (Best Value) |
| **Spicy Ramyeon Roll** | Gurih & Pedas | 1 Pcs (Isi 1) | Rp5.000 | Ramyeon Korea pedas dibalut Rice Paper kenyal |
| | | 2 Pcs (Isi 2) | Rp9.000 | Hemat Rp1.000 (Best Value) |
| **Puding Karamel & Buah** | Dessert Manis | Single Cup | Rp10.000 | Puding lembut saus karamel & buah segar |
| | | Double Cup | Rp12.000 | Porsi sharing hemat Rp8.000 |
| **Paket Combo Juara** | Paket Hemat | 2 Cibay + 2 Ramyeon Roll | Rp13.000 | Bundle terlaris (normal Rp14.000, hemat Rp1.000) |

### Voucher Promo Aktif
- `RAWONSETO`: Potongan Rp1.000
- `LARISMANIS`: Potongan Rp1.000

---

## 4. Alur Transaksi & Sistem Pembayaran

### A. Pre-Order (PO Online Mahasiswa)
1. Pembeli membuka web melalui browser HP (link WhatsApp / QR code meja).
2. Memilih porsi makanan langsung di kartu katalog atau melalui modal detail.
3. Mengisi data pemesanan: Nama, Nomor WhatsApp, dan Kelas/Lokasi jemput (quick chips tersedia: `S1SI-02`, `Lantai 3 Gedung B`, dll).
4. Memilih metode bayar:
   - **QRIS Statis UMKM:** Menampilkan QRIS resmi, timer bayar 15 menit, tombol unduh QRIS ke galeri HP, tombol salin nominal, dan tombol konfirmasi 1-klik ke WhatsApp Admin.
   - **Tunai (Cash):** Bayar langsung saat serah terima pesanan di booth.

### B. Kasir Offline (Walk-in POS)
- Terletak di panel Admin (Akses via PIN: `1234`, `002`, `2026`).
- Fitur walk-in order langsung menambahkan transaksi ke pencatatan omzet dan progres 738 pcs.
- Dilengkapi live search menu dan tombol stepper cepat `+ / -`.

### C. Verifikasi & Rekap Otomatis
- Filter antrean pesanan: *Semua*, *Cek QRIS*, *Dimasak*, *Siap Ambil*, *Selesai*.
- Fitur salin format pesan laporan harian WhatsApp siap kirim ke dosen.
- Fitur ekspor seluruh riwayat transaksi ke format CSV untuk analisis spreadsheet.

---

## 5. Arsitektur Teknis & Standar Kode

### Tech Stack
- **Framework:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS (skema kustom `paper`, `ink`, `terracotta`)
- **Icons:** Lucide React (stroke 2px terpadu)
- **Data Layer:** Dual-mode storage (`src/services/storage.ts`) — otomatis menggunakan `localStorage` dengan pub-sub event listener untuk realtime tab sync, siap integrasi Supabase.

### Kiosk UX & Impeccable Standards
- **Area Sentuh (Touch Targets):** Minimal 44×44 CSS px pada seluruh tombol, stepper kuantitas, pill filter, dan kontrol aksi.
- **Thumb-Zone Optimization:** Sticky bottom bar selalu terlihat saat ada item di keranjang pada layar ponsel.
- **Bebas AI Slop:** Tidak ada gradien pelangi, tidak ada kicker eyebrow dekoratif, teks solid kontras tinggi (≥4.5:1 WCAG AA), nuansa taktil warm deli & street food packaging.
- **Aksesibilitas:** Atribut ARIA modal dialog (`aria-modal`, `aria-labelledby`), keyboard navigation kartu menu (`role="button"`, `tabIndex={0}`, handler `Enter`/`Space`), serta validasi inline bebas `window.alert()`.

---

## 6. Arsip Dokumen Pendukung

File spesifikasi teknis dan audit tersimpan di folder `docs/`:
- `docs/PRODUCT.md`: Dokumen kontrak produk Impeccable (Schema 1).
- `docs/DESIGN.md`: Token sistem desain (warna, tipografi, radius, elevasi).
- `docs/AUDIT_NOTES.md`: Catatan audit Kiosk UX Checklist & perbaikan anti-AI slop.
