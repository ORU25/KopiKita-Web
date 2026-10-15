# KopiKita Web — Spesifikasi Desain Dasbor Staf & Admin

Sumber kebenaran untuk tampilan dasbor. Token warna, font, dan bayangan **sama dengan aplikasi pelanggan** (`../kopikita/kopikita-design/design/DESIGN.md`) agar terasa satu merek. **Radius web lebih kecil** daripada mobile (permintaan user: tampilan tidak terlalu melengkung), dan **card/tabel/modal/input berlatar putih (`bg`)** dengan garis `divider`/`outline` — bukan krem. Dasbor belum punya gambar desain — spesifikasi di bawah adalah acuannya. Setiap perubahan UI wajib diperbarui di sini.

- Target layar: **laptop 1280×800** (admin) dan **tablet 1024×768 landscape** (kasir/barista). Masih bisa dipakai di 768 lebar. **HP (< 768)** juga didukung — lihat aturan "HP" di tiap bagian.
- Gaya: bersih, hangat, minimalis. Daftar panjang memakai **tabel/baris datar**, bukan tumpukan card. Card hanya untuk kartu pesanan di Antrean dan panel ringkasan.
- Bahasa UI: Bahasa Indonesia. Teks minimal **12px**. Target klik minimal **44×44**.

---

## 1. Token

### Warna (`src/index.css`)

```css
@import "tailwindcss";

@theme {
  --font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;

  --color-primary: #6B3216;      /* tombol utama, harga, link, item aktif */
  --color-caramel: #C47A3A;      /* aksen, status berjalan */
  --color-promo: #9A5A1C;        /* link sekunder */
  --color-ink: #2B1810;          /* teks utama, latar halaman Login */
  --color-secondary: #5A4436;    /* label sekunder */
  --color-muted: #7A6355;        /* teks meta, ikon tidak aktif */
  --color-disabled: #B9A89B;     /* tombol nonaktif */
  --color-bg: #FFFFFF;           /* latar konten */
  --color-surface: #FCF9F5;      /* sidebar saja */
  --color-fill: #F3EADF;         /* badge "Menunggu bayar", badge jumlah kolom */
  --color-tint: #F1E4D4;         /* avatar, badge metode & "Dibayar" */
  --color-cream: #FBEFE0;        /* teks terang di atas cokelat tua */
  --color-divider: #EDE3D8;      /* garis umum, border tabel */
  --color-outline: #E6D9CB;      /* border tombol sekunder, input */
  --color-pending: #D9CABB;      /* status belum tercapai */
  --color-danger: #B3261E;       /* khusus aksi Batalkan/Hapus (tambahan web) */

  --radius-thumb: 6px;
  --radius-input: 8px;
  --radius-btn: 8px;
  --radius-card: 10px;
  --radius-panel: 12px;

  --shadow-card: 0 2px 10px rgba(60, 30, 10, 0.05);
  --shadow-float: 0 6px 20px rgba(43, 24, 16, 0.07);
}
```

Hover baris/tombol netral memakai `bg-ink/4` (ink opacity 4%); placeholder foto `bg-ink/5`. Pakai lewat kelas: `bg-primary`, `text-muted`, `border-divider`, `rounded-card`, `shadow-card`, dst. **Jangan menulis hex di komponen.** `danger` adalah satu-satunya warna tambahan khusus web (aplikasi mobile tidak punya aksi destruktif).

### Font

Plus Jakarta Sans (variabel). Tambahkan di `index.html`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap" rel="stylesheet" />
```

| Peran | Ukuran / tebal | Contoh |
|---|---|---|
| Nomor antrean di kartu | 28 / 800, tracking −0.5 | "A-014" |
| Judul halaman | 24 / 800, tracking −0.4 | "Antrean", "Menu" |
| Judul modal / panel | 20 / 800 | "Tambah menu" |
| Judul kolom / seksi | 16 / 800 | "Diproses" |
| Tombol | 14 / 700 | "Konfirmasi bayar" |
| Isi tabel / item | 14 / 600 (nama 700) | "Kopi Susu Kita" |
| Teks sekunder | 13 / 500–600 | opsi item, waktu |
| Label, header tabel, badge | 12 / 700 | "HARGA", "Makan di tempat" |

Harga: 14 / 800 `primary`. Total: 16 / 800 `primary`.

### Radius & ukuran

- Thumbnail produk **6** · input 8 · tombol 8 · item sidebar 8 · chip 8 · badge 6 · card/tabel 10 · panel/modal/kartu login 12 · toggle & avatar penuh.
- Tinggi: tombol 44, input 44, baris tabel 56, item sidebar 44, header halaman 72.
- Padding konten halaman 24; jarak antar-blok 16–24.

### Ikon

Ikon garis (outline) 20–24, stroke ~1.8, gaya Lucide. Boleh pakai `lucide-react` (satu-satunya library UI yang diizinkan), atau SVG inline.

---

## 2. Komponen bersama

### Layout (setelah login)
- **Sidebar** kiri lebar 240, latar `surface`, border kanan `divider`, padding 16. Atas: logo (`public/logo-app.png`, 40, bulat latar `bg`) + "KopiKita" 18/800 + "Dasbor" 12/600 muted.
- Item menu: tinggi 44, radius 8, ikon 20 + label 14/600 `secondary`; hover latar `ink/4`; **aktif** latar `primary`, teks & ikon putih 700.
- Urutan menu: **Antrean**, **Stok** (staf & admin) · garis · **Menu**, **Voucher**, **Pengguna**, **Laporan** (admin saja — jangan dirender untuk staf).
- Bawah sidebar: avatar inisial 36 (latar `tint`, teks `primary` 800) + nama 13/700 + role 12 muted + tombol **Keluar** (sekunder kecil).
- **Konten** di kanan: latar `bg`, padding 24. Header halaman tinggi 72: judul 24/800 di kiri, aksi utama (mis. "+ Tambah menu") di kanan.
- Di bawah lebar 1280 (tablet 1024) sidebar menyempit jadi 72 (ikon saja + tooltip `title`); mulai 1280 lebar 240. Tidak perlu hamburger.
- **HP (< 768)**: sidebar pindah jadi **bilah navigasi bawah** (latar `surface`, border atas `divider`, padding 4): ikon saja, item sama lebar (tinggi 44), urutan sama + tombol Keluar (ikon, tanpa border) paling kanan. Logo, garis pemisah, dan profil disembunyikan. Padding konten 16.

### Tombol
- Utama: tinggi 44, radius 8, latar `primary`, teks putih 14/700, padding x 20. Nonaktif: latar `disabled`.
- Sekunder: tinggi 44, radius 8, border 1 `outline`, teks `ink` 14/700, latar `bg`, hover `ink/4`.
- Bahaya: teks `danger` 14/700 tanpa latar (Batalkan, Hapus) — selalu dengan konfirmasi. Tombol aksi di modal konfirmasi bahaya: latar `danger`, teks putih.
- Aksi ikon di baris tabel (Edit/Hapus): tombol 44×44, ikon 18, radius 8, hover latar `ink/4`; Hapus berwarna `danger`.
- Loading: label diganti "Menyimpan…" dan tombol nonaktif (cegah klik ganda).

### Input
Tinggi 44, radius 8, latar `bg`, border 1 `outline`; fokus: border + ring 1 `primary`; nonaktif: latar `ink/4`. Awalan/akhiran satuan ("Rp", "%") 14/600 `muted` di dalam input. Label di atas 12/700 `secondary`, jarak 8. Pesan error 12/600 `danger` di bawah input.

### Tabel
Wadah `bg` (putih) radius 10 border `divider` (overflow hidden). Header 12/700 uppercase `muted`, tinggi 44, latar `bg` + border bawah `divider`. Baris tinggi 56, border bawah `divider`, hover latar `ink/4`. Kolom angka rata kanan. Thumbnail 40 radius 6.
- **HP (< 768)**: tabel tetap tabel dan digeser ke samping (wadah `overflow-x-auto`). Kolom sekunder disembunyikan (`max-md:hidden`, skeleton ikut lewat prop `sembunyi`): Menu → Kategori & Urutan · Voucher → Info · Pengguna → jumlah Voucher.

### Toggle (Habis, Aktif, Rekomendasi)
Track 44×24 radius penuh; aktif latar `primary`, nonaktif `pending`; knob putih 20. Area klik ≥ 44. Simpan langsung saat diklik (tanpa tombol Simpan), tampilkan toast singkat.

### Badge status
Tinggi 24, padding x 10, radius 6, 12/700:
| Status | Latar | Teks |
|---|---|---|
| Menunggu bayar | `fill` | `secondary` |
| Dibayar | `tint` | `primary` |
| Diproses | `caramel` | putih |
| Siap diambil | `primary` | putih |
| Selesai | `divider` | `muted` |
| Dibatalkan | `bg` + border `danger` | `danger` |

Badge metode: ikon 13 (tas belanja / alat makan) + "Ambil sendiri" / "Makan di tempat · Meja 7" — latar `tint`, teks `primary` 12/700.

### Modal
Overlay `ink` opacity 40%. Panel `bg` radius 12, lebar 480 (form) / 400 (konfirmasi), padding 24 (HP: 20), bayangan `float`. Judul 20/800, footer tombol rata kanan (Batal sekunder + aksi utama). Tutup dengan Esc / klik overlay.

### Toast
Pojok kanan bawah (HP: 80 dari bawah, di atas bilah navigasi), latar `ink`, teks `cream` 13/600, radius 8, hilang 3 detik. Untuk "Tersimpan", "Status diubah ke Diproses", dan pesan error.

### Keadaan kosong / loading / error
- Loading: **skeleton** — balok abu netral `ink/6` berdenyut (`animate-pulse`), radius 6, yang meniru bentuk konten aslinya agar tata letak tidak melompat. Wadah `role="status"` dengan teks tersembunyi "Memuat…" untuk pembaca layar.
  - Tabel: header asli + 3–8 baris balok (kolom angka rata kanan; kolom pertama thumbnail 40 / avatar 32 + nama sesuai tabelnya).
  - Antrean: 4 kolom dengan judul asli, garis status redup, 1–2 kartu skeleton (nomor, badge, item, tombol).
  - Laporan: 3 kartu ringkasan + 2 tabel skeleton. Muat ulang saat data sudah ada: data lama diredupkan (opacity 50%) dan tombol berubah "Memuat…".
  - Panel kustomisasi & modal Atur voucher: balok seukuran input/baris checkbox.
  - **Loading awal (splash)**: latar `bg`, di tengah logo 72 bulat · "KopiKita" 20/800 `ink` · bilah progres 160×4 radius penuh (jalur `ink/6`, isi 1/3 `primary` bergerak kiri→kanan 1,1 dtk; diam bila *reduced motion*). Splash yang sama ditulis di `index.html` (tampil sebelum JS selesai diunduh) dan sebagai `<Splash />` di `App.tsx` (selama sesi pertama dicek) — keduanya harus identik agar tidak berkedip.
  - Profil terakhir disimpan di `localStorage`, jadi saat dasbor dibuka lagi splash dilewati dan halaman langsung tampil (role dicek ulang di belakang). Saat tombol **Masuk** ditekan, form Login tetap tampil dan tombol berisi "Masuk…" sampai role selesai dicek.
  - Logo `public/logo-app.png` berukuran 256×256 (±70 KB) — cukup untuk tampilan 72 px di layar 2×; jangan ganti dengan file resolusi penuh.
- Kosong: ikon 40 `pending` + kalimat 14/600 `muted` (mis. "Belum ada pesanan hari ini").
- Error: kalimat 14/600 `danger` + tombol sekunder "Coba lagi".

---

## 3. Halaman

### 3.1 Login (`/login`)
- Latar halaman `ink`. Di tengah: card `bg` lebar 400, radius 12, padding 32 (HP < 640: 24), bayangan `float`.
- Isi: logo 72 (bulat latar `bg`) di tengah → "KopiKita" 24/800 → "Dasbor staf & admin" 13 muted → field **Email** → field **Kata sandi** (tombol mata 44) → tombol utama **Masuk** lebar penuh.
- Error (Bahasa Indonesia): kredensial salah → "Email atau kata sandi salah."; role `pelanggan` → logout otomatis + "Akun ini bukan akun staf/admin."
- Tidak ada Daftar dan tidak ada login Google (akun staf dibuat dengan daftar di app lalu role dinaikkan admin).
- Sudah login → langsung ke `/antrean`.

### 3.2 Antrean (`/antrean`) — staf & admin
Halaman utama kasir/barista, realtime.
- Header: "Antrean" + tanggal hari ini 13 muted. Kanan: 3 kotak angka (tinggi 44, border `divider`, radius 8): label 12/700 uppercase muted + angka 16/800 — **Aktif** (jumlah di papan) · **Selesai** · **Dibatalkan** (hari ini).
- **Papan 4 kolom** sama lebar (gap 16): **Menunggu bayar · Dibayar · Diproses · Siap diambil**. Papan **selalu tampil**, juga saat kosong.
  - Header kolom: nama 16/800 kiri + jumlah kanan (border `divider`, radius 6, 12/700), di bawahnya garis 4px radius penuh berwarna status: Menunggu bayar `disabled` · Dibayar `promo` · Diproses `caramel` · Siap diambil `primary`.
  - Kolom scroll vertikal sendiri; urut `createdAt` terlama di atas (FIFO).
  - Kolom kosong: kotak border putus-putus `outline` radius 10, "Tidak ada pesanan" 13/600 muted.
- **Kartu pesanan** (`bg`, border 1 `divider`, radius 10, bayangan `card`, padding 16, gap 12):
  1. Kiri atas: nomor antrean 28/800 `ink` (+ badge "Baru" latar `caramel` teks putih selama disorot), di bawahnya badge metode. Kanan atas: ikon jam 14 + waktu sejak dibuat "5 mnt" 12/700 `secondary` dan jam pesan "17.23" 12 muted. Bila > 15 mnt di Menunggu bayar/Dibayar/Diproses: ikon peringatan + teks `danger`.
  2. Garis `divider`, lalu daftar item: kotak jumlah "2×" (tinggi 24, radius 6, latar `ink/5`, 12/800) + nama 14/700, opsi (`labelOpsi`) 12 muted, catatan miring 12 `secondary` dalam tanda kutip.
  3. Garis `divider`, lalu "Total · 3 item" 13 muted + total 16/800 `primary`; bila voucher: kode 12/700 `promo`.
  4. Tombol utama lebar penuh sesuai status (Konfirmasi bayar / Proses / Siap / Selesai; saat menyimpan "Menyimpan…") + tombol bahaya "Batalkan" 13/700 di bawahnya (modal konfirmasi: "Batalkan pesanan A-014?").
- Pesanan baru masuk: border kartu `caramel` + ring 1 `caramel` (tampak 2px) + badge "Baru" selama 10 detik.
- Pesanan `selesai`/`batal` hilang dari papan (masuk hitungan ringkasan).
- **HP (< 768)**: papan jadi satu baris kolom selebar 85% layar yang digeser ke samping (*scroll snap* per kolom, scrollbar disembunyikan) — kolom berikutnya mengintip di kanan sebagai petunjuk geser. Kotak angka & tombol header turun ke baris baru.
- Khusus mode dev: tombol sekunder "+ Pesanan contoh" di kanan header (tidak ada di build produksi).

### 3.3 Stok (`/stok`) — staf & admin
- Tabel produk dikelompokkan per kategori (Kopi, Non-Kopi, Makanan; urut `urutan`): thumbnail 40 · nama 14/700 · harga · toggle **Tersedia/Habis** (toggle aktif = tersedia).
- Baris habis: opacity 0.6 + badge "Habis" (latar `ink`, teks putih 12/700).
- Hanya mengubah field `habis`.
- Header: "Stok" + keterangan 13 muted "Tandai menu yang habis agar tidak bisa dipesan."

### 3.4 Menu (`/menu`) — admin
- Header: "Menu" + tombol utama "+ Tambah menu".
- Filter chip kategori di atas tabel (Semua · Kopi · Non-Kopi · Makanan; tinggi 36, radius 8, terpilih latar `primary` teks putih, lainnya latar `bg` + border `outline`).
- Tabel: foto 40 · nama + deskripsi (12 muted, 1 baris ellipsis) · kategori · harga · toggle Rekomendasi · toggle Habis · urutan · aksi (Edit, Hapus).
- **Modal tambah/edit**: foto (area unggah 120×120 radius 6, latar `ink/4`, border putus-putus `outline`, klik untuk pilih; pratinjau; maks 2 MB, jpg/png/webp) · Nama · Deskripsi (textarea 2 baris) · Kategori (select) · Harga (angka, rupiah) · Urutan · checkbox Rekomendasi. Simpan: unggah foto ke Cloudinary dulu (bila diganti) → tulis dokumen. ID dokumen baru = slug nama. Tombol Tambah/Edit nonaktif sampai katalog `config/menu` termuat.
  - Bagian **Kustomisasi** (dipisah garis `divider`, judul 16/800 + "Pilihan yang muncul di aplikasi saat pelanggan memesan menu ini." 12 muted). Semua pilihan berupa checkbox dengan area klik ≥ 44:
    - Hanya minuman (Kopi/Non-Kopi): **Suhu** Panas · Es (minimal satu; error "Pilih minimal satu suhu.") · **Ukuran** "Ada ukuran Large (+Rp4.000)" · **Add-on** · catatan 12 muted "Level gula dan level es (bila Es) selalu tersedia untuk minuman."
    - Makanan: tidak ada pilihan; tampil teks 13 muted "Makanan tidak punya pilihan kustomisasi. Pelanggan tetap bisa menulis catatan." Disimpan sebagai suhu `[]`, tanpa Large, tanpa add-on.
    - Add-on: daftar dari katalog, 2 kolom (HP < 640: 1 kolom), "Extra shot +Rp5.000" (harga 500 muted). Katalog kosong: "Katalog add-on masih kosong. Tambahkan lewat kartu "Katalog add-on minuman"."
    - Produk lama tanpa field kustomisasi: modal membuka dengan nilai default (minuman semua tercentang); saat disimpan nilainya ditulis eksplisit.
- Hapus: modal konfirmasi "Hapus Kopi Susu Kita dari menu?".
- Seksi **Kustomisasi minuman** (`config/menu`) di bawah tabel: judul 16/800 + "Berlaku untuk semua minuman. Pilihan per menu (suhu, Large, add-on) diatur lewat tombol Edit di tabel." 13 muted. Isi 2 kartu (≥1280: 320 | sisa, gap 16, rata atas; di bawahnya bertumpuk). Kartu: `bg`, border `divider`, radius 10; header tinggi min 72 (judul 16/800 + keterangan 13 muted, aksi di kanan) dengan border bawah `divider`.
  - Kartu **Ukuran & pajak**: input "Tambahan harga ukuran Large" (awalan "Rp") dan "Pajak" (akhiran "%"), tombol utama "Simpan" rata kanan, nonaktif bila tidak ada perubahan. Validasi: angka bulat ≥ 0, pajak 0–100.
  - Kartu **Katalog add-on minuman**: aksi header tombol sekunder "+ Tambah add-on". Tabel tanpa wadah tambahan: Add-on 14/700 · Harga "+Rp5.000" 14/800 `primary` (rata kanan) · Dipakai di "7 minuman" / "Belum dipakai" muted (rata kanan; tooltip berisi nama menunya) · aksi Edit/Hapus ikon 44. Urut abjad. Kosong: "Belum ada add-on".
  - Modal **Tambah/Edit add-on** (lebar 400): Nama · Harga (awalan "Rp"). Nama wajib dan tidak boleh kembar (abaikan huruf besar/kecil). Saat menambah: catatan 12 muted "Minuman lama yang belum pernah diatur otomatis mendapat add-on baru. Atur per minuman lewat tombol Edit." Ganti nama ikut memperbarui daftar add-on menu yang memilihnya (satu batch).
  - Hapus add-on: modal konfirmasi "Hapus add-on Oat milk?" yang menyebut jumlah & nama minuman yang memakainya; Ya → katalog disimpan dan add-on dilepas dari menu tersebut (satu batch).

### 3.5 Voucher (`/voucher`) — admin
- Header: "Voucher" + "+ Tambah voucher".
- Tabel: kode 14/800 `primary` · info · tipe & nilai ("20%" / "Rp5.000") · min. belanja · berlaku sampai (tanggal, merah bila lewat) · toggle Aktif · aksi Edit/Hapus.
- Modal: Kode (huruf besar, tanpa spasi; tidak bisa diubah saat edit karena = ID dokumen) · Info · Tipe (segmented Persen | Potongan: wadah border `outline` radius 8, segmen tinggi 44, terpilih `primary` teks putih) · Nilai · Min. belanja · Berlaku sampai (`<input type="date">`) · Aktif.

### 3.6 Pengguna (`/pengguna`) — admin
- Kolom cari (nama/email, filter di klien) di header.
- Tabel: avatar inisial 32 · nama 14/700 + email 12 muted · **role** (select: Pelanggan / Staf / Admin) · jumlah voucher dimiliki · aksi "Atur voucher".
- Admin tidak bisa menurunkan role dirinya sendiri (select nonaktif di barisnya).
- Ubah role → modal konfirmasi "Jadikan Rina sebagai Staf?".
- **Atur voucher**: modal berisi daftar checkbox semua voucher aktif (kode + info) → simpan ke `users/{uid}.voucher`.

### 3.7 Laporan (`/laporan`) — admin
- Pilihan rentang: chip "Hari ini · 7 hari · 30 hari" + tombol "Muat" (pakai `getDocs`, bukan realtime).
- 3 kartu ringkasan (`bg`, border `divider`, radius 10, padding 20; HP < 640 bertumpuk 1 kolom): **Omzet** (16/800 `primary` → angka 24/800) · **Pesanan selesai** · **Dibatalkan**.
- Tabel per hari: tanggal · pesanan selesai · dibatalkan · omzet (jumlah `total` pesanan `selesai`), baris total di bawah (800, border atas `outline`).
- Tabel **Menu terlaris** (top 5 dari `items` pesanan selesai): nama · jumlah terjual · pendapatan.
- Grafik tidak wajib; tambah hanya bila waktu tersisa.
