# Audit Notes: Kiosk UX & Anti-AI Slop Review
**Project:** Laris Manis — Web PO & POS Kampus (Tel-U Jakarta)  
**Date:** November 2026  
**Auditor:** Afif (@Afif) / OpenCode Engine  
**Standards Applied:** Kiosk UX Master Checklist (Expanded Ed.), WCAG 2.2 AA, Impeccable Craft Floor.

---

## 1. Relevant Findings from Master Checklist

| Section | Code | Requirement | Current Status | Audit Remedy |
|---|---|---|---|---|
| **1.1 Touch Targets** | 1.1.1, 1.1.5 | Primary controls ≥ 20×20 mm (min 44×44 CSS px). Secondary controls ≥ 15×15 mm. | **FAIL** — Beberapa tombol (+/-, badge, tag filter) terlalu kecil (28–32px), rawan mis-tap saat terburu-buru. | Naikkan semua tombol interaktif, quantity stepper, dan selector ke minimum `min-h-[44px]` dan `min-w-[44px]` dengan padding sentuh lega. |
| **1.2 Reach & Ergonomics** | 1.2.6, 1.2.8 | Primary action loop (pilih, modifikasi, checkout, pay) berada di zona jangkauan jempol bawah (lower 60%). | **FAIL** — Keranjang & floating trigger tersebar, checkout button tergantung scroll panjang. | Tambahkan **Sticky Bottom Summary Bar** permanen di layar mobile (total harga & tombol pesan langsung bisa dijangkau satu tangan). |
| **1.4 Gestures & Idempotency** | 1.4.1, 6.3.1 | Single tap core flow. Tombol "Bayar / Buat Pesanan" wajib lock state (mencegah double submission/double charge). | **FAIL** — Belum ada proteksi debounce/idempotency saat submit form PO & POS. | Tambahkan `isSubmitting` state, disable tombol seketika saat klik pertama dengan loading indicator jelas. |
| **3.1 Cognitive Load** | 3.1.2, 3.2.1 | Keputusan ringkas (maks 4–5 pilihan), ringkasan harga & item selalu terlihat, jangan bikin user mikir keras. | **PASS with polish** — Menu sudah ringkas (4 item), tapi opsi porsi (1 pcs vs 2 pcs) lebih baik inline dan transparan langsung di kartu. | Tampilkan radio pill porsi langsung di kartu atau sheet sederhana tanpa modal berlapis. |
| **4.1 Contrast & Legibility** | 4.1.1, 4.3.1 | Kontras teks body ≥ 4.5:1 (WCAG AA). Angka harga wajib tabular dan paling mencolok. Hindari pure white glare. | **FAIL** — Text `stone-400` dan `orange-100` di atas oranye gagal kontras 4.5:1 saat di bawah lampu kampus/outdoor. | Ganti ke warm background stone `#fbfaf8`, teks gelap `#1c1917` (kontras 14:1), badge harga dengan dark slate badge kontras tinggi. |
| **5.1 Plain Microcopy** | 5.1.2, 5.3.1 | Label tombol adalah kata kerja lugas ("Pesan Sekarang", "Simpan QRIS", "Kirim Bukti WA"). | **PASS** — Bahasa Indonesia santai khas mahasiswa sudah pas, perjelas instruksi batas waktu QRIS. | Instruksi bayar dibuat to-the-point: 1) Scan QRIS 2) Simpan bukti 3) Klik Konfirmasi WA. |
| **9.1 Payment & Receipt** | 9.1.1, 9.3.3 | Rincian harga transparan sebelum bayar, invoice digital jelas, dapat difoto/diunduh, bukti instan. | **PASS** — Fitur download canvas QRIS dan direct WA sudah sesuai rencana WhatsApp tim. | Pertahankan dan rapikan tata letak receipt agar menyerupai struk fisik kasir yang rapi dan terpercaya. |

---

## 2. Anti "AI Slop" Directives (Impeccable Craft Floor)

Identifikasi pola klise AI (*AI Slop*) pada implementasi sebelumnya dan tindakan pembersihannya:

1. **Banned: Eyebrow / Kicker Teks Kecil di Atas Judul**
   - *Slop:* Tag kecil mengambang seperti `"SENSASI JAJANAN SUNDA ✕ KOREA"` di atas H1.
   - *Fix:* Hapus total kicker. Biarkan judul utama berbicara lugas dengan tipografi kuat.

2. **Banned: Generic Gradient Soup & Glassmorphism Berlebihan**
   - *Slop:* `bg-gradient-to-r from-orange-500 via-amber-500 to-red-600` dengan blur lingkaran acak di background.
   - *Fix:* Ganti dengan **Warm Editorial Street Food Palette**:
     - Background: Warm off-white / unbleached paper `#fcfbf9` & `#f4f1ea`
     - Brand Accent: Terracotta chili `#c2410c` & warm charcoal `#1c1917`
     - Border halus 1px `#e7e2d9` bertema kertas kemasan take-away.

3. **Banned: Gradient Text**
   - *Slop:* `bg-clip-text text-transparent bg-gradient-to-r...`
   - *Fix:* Teks solid dengan bobot font tegas (`font-bold`, `tracking-tight`), ukuran hierarki jelas.

4. **Banned: Emoji Berceceran sebagai Pengganti Sistem Ikon**
   - *Slop:* Emoji `🥟`, `🍮`, `⭐`, `🛒` berserakan di tab dan tombol.
   - *Fix:* Gunakan icon system Lucide yang konsisten (stroke 2px, warna terpadu) atau label teks murni.

5. **Banned: Lazy Card Nesting**
   - *Slop:* Kartu di dalam kartu di dalam modal.
   - *Fix:* Tata letak flat, garis pemisah bersih (`divide-stone-200`), tabular rows yang mudah discan mata.

6. **Banned: Zero-Offset Soft Halos**
   - *Slop:* `shadow-xl shadow-orange-500/10` mengambang kabur.
   - *Fix:* Subtle physical elevation dengan shadow terarah (`shadow-sm` natural) atau border-only layout yang bersih.

---

## 3. Product & Design Specification (For Impeccable)

- **Product Name:** Laris Manis (Kewirausahaan Telkom University Jakarta)
- **Menu:** Cibay Gurih Lumer, Spicy Ramyeon Roll, Puding Karamel Dingin, Paket Combo Juara.
- **Audience:** Mahasiswa & Dosen Tel-U (terburu-buru, mobile, akses via WA link / QR meja).
- **Mode:** **Operate** (pemesanan makanan cepat tanpa hambatan) berpadu **Persuade** (menggugah selera jajan).
- **Core Aesthetic:** *Warm Campus Deli & Street Food Editorial* — bersih, percaya diri, taktil, fungsional, nol basa-basi.
