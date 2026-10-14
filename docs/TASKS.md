# Rencana Kerja Web Staf & Admin

Bagian dari pembagian tugas tim (`../kopikita/PEMBAGIAN_TUGAS.md`) — semua pekerjaan web dipegang **P1**. Fondasi Firebase (project `kopikita-dev`, Auth email/kata sandi, Firestore test mode, data awal + akun uji) sudah dikerjakan di repo mobile.

Centang `[x]` setiap item yang selesai agar progres terlihat di sesi berikutnya.

---

## A. Setup awal (sekali, Hari 2)

Prasyarat: Node ≥ 20, `firebase-tools` sudah terpasang & login (dipakai saat setup mobile).

- [x] **A1. Scaffold Vite di folder ini**
  ```bash
  npm create vite@latest . -- --template react-ts
  ```
  ⚠️ Folder ini sudah berisi `CLAUDE.md` dan `docs/`. Saat ditanya "Current directory is not empty", **pilih "Ignore files and continue"** — JANGAN "Remove existing files". Jawab "No" bila ditanya langsung install & start.
- [x] **A2. Dependency**
  ```bash
  npm install
  npm install firebase react-router lucide-react
  npm install -D tailwindcss @tailwindcss/vite
  ```
- [x] **A3. Tailwind** — tambahkan `tailwindcss()` ke `plugins` di `vite.config.ts` (`import tailwindcss from '@tailwindcss/vite'`). Ganti isi `src/index.css` dengan blok token di `docs/DESIGN.md` bagian 1. Hapus `src/App.css` dan isi demo bawaan Vite (`App.tsx` counter, `src/assets/react.svg`, `public/vite.svg`).
- [x] **A4. `index.html`** — `lang="id"`, `<title>KopiKita Dasbor</title>`, link Google Fonts dari `docs/DESIGN.md`.
- [x] **A5. Logo** — salin `../kopikita/assets/images/logo-app.png` ke `public/logo-app.png`, pakai juga sebagai favicon.
- [x] **A6. `src/firebase.ts`** — `initializeApp` dengan nilai dari blok `web` di `../kopikita/lib/firebase_options.dart` (`apiKey`, `appId`, `messagingSenderId`, `projectId`, `authDomain`, `storageBucket`), lalu `export const auth = getAuth(app)` dan `export const db = getFirestore(app)`. Config web Firebase memang publik (keamanan ada di rules), boleh di-commit.
- [x] **A7. `src/types.ts`** — salin dari `docs/SCHEMA.md`.
- [ ] **A8. Cloudinary** — di dashboard Cloudinary: Settings → Upload → Upload presets → **Add**, *Signing mode* **Unsigned**, folder `kopikita/menu`. Buat `.env.local` (jangan di-commit) dan `.env.example` (di-commit, nilai kosong): *(`.env.example` sudah ada; preset & `.env.local` belum dibuat)*
  ```
  VITE_CLOUDINARY_CLOUD_NAME=
  VITE_CLOUDINARY_UPLOAD_PRESET=
  ```
- [x] **A9. Firebase Hosting** *(`firebase.json` + `.firebaserc` ditulis manual)*
  ```bash
  firebase init hosting
  ```
  Pilih *Use an existing project* → `kopikita-dev`; public directory `dist`; single-page app **Yes**; GitHub deploys **No**; jangan timpa `index.html` bila ditanya.
- [ ] **A10. Git** — `git init`, pastikan `.gitignore` berisi `node_modules`, `dist`, `.env.local`, `.firebase/`. Buat repo GitHub **private** `kopikita-web`, push `main`, aktifkan proteksi branch `main` (wajib PR).
  *(Baru `git init` + `.gitignore`; repo GitHub belum dibuat.)*
- [x] **A11. Cek** — `npm run dev` tampil tanpa error, `npm run build` & `npx tsc -b` lulus.

---

## B. Fitur

### Hari 2 — Login & kerangka
- [x] `lib/useAuth.tsx`: `onAuthStateChanged` → baca `users/{uid}` (sekali, `getDoc`) → `{ user, profil, loading }`. Role `pelanggan` → `signOut` + pesan error.
- [x] Halaman **Login** (`docs/DESIGN.md` 3.1) dengan pesan error Bahasa Indonesia.
- [x] **Layout** sidebar + guard route: belum login → `/login`; staf membuka halaman admin → alihkan ke `/antrean`.
- [x] `lib/format.ts`: `rupiah(n)` → "Rp22.000", `jam(ts)`, `tanggal(ts)`, `sejak(ts)` → "5 mnt".
- [x] Komponen dasar: Button, Input, Modal, Toggle, StatusBadge, Toast.

### Hari 3 — Antrean realtime (paling penting)
- [x] Hook `useAntreanHariIni()`: satu `onSnapshot` pesanan hari ini (query di `docs/SCHEMA.md`), unsubscribe saat unmount.
- [x] Papan 4 kolom + kartu pesanan (`docs/DESIGN.md` 3.2).
- [x] Tombol aksi status + Batalkan (modal konfirmasi), tulis `updatedAt: serverTimestamp()`.
- [x] Ringkasan "Selesai hari ini / Dibatalkan".
- [x] Sorot pesanan baru (border `caramel` 10 detik).
- [x] **Alat uji khusus dev**: tombol "+ Pesanan contoh" hanya bila `import.meta.env.DEV`, menulis pesanan `menunggu_bayar` dengan `uid` = user yang login, nomor "T-xxx", 2 item contoh. Dipakai sampai checkout aplikasi mobile (P4) selesai Hari 4.

### Hari 4 — Stok & Menu
- [x] Halaman **Stok**: toggle `habis` (staf & admin).
- [x] `lib/cloudinary.ts`: `uploadFoto(file)` → `fetch('https://api.cloudinary.com/v1_1/<cloud>/image/upload', { method: 'POST', body: FormData{file, upload_preset} })` → `secure_url`. Validasi tipe (jpg/png/webp) & ukuran ≤ 2 MB sebelum upload.
- [x] Halaman **Menu**: tabel + filter kategori + modal tambah/edit + hapus.
- [ ] Isi foto untuk semua produk hasil seed (unggah dari `../kopikita/assets/images/`). Peta nama → file ada di `gambarMenu` (`../kopikita/lib/data/dummy_data.dart`); "Roti Bakar Cokelat" belum punya foto.
- [ ] Uji dengan aplikasi mobile: pesanan dari HP muncul di Antrean, ubah status terlihat di HP.

### Hari 5 — Voucher, Pengguna, Laporan, Rules
- [x] Panel **Pengaturan kustomisasi** (`config/menu`) di halaman Menu.
- [x] Halaman **Voucher**: CRUD.
- [x] Halaman **Pengguna**: ubah role (konfirmasi; tidak bisa menurunkan diri sendiri), atur voucher milik pelanggan.
- [x] Halaman **Laporan**: `getDocs` per rentang, ringkasan, tabel per hari, menu terlaris.
- [ ] **`firestore.rules` final**: `firebase init firestore` (pakai project yang sama), ganti isi `firestore.rules` dengan draf di `docs/SCHEMA.md`, uji di Rules Playground (pelanggan tidak bisa baca pesanan orang lain, staf tidak bisa ubah harga, pelanggan tidak bisa ubah role), lalu `firebase deploy --only firestore:rules`. **Umumkan ke tim mobile** — semua uji ulang fiturnya.

### Hari 6 — Deploy & integrasi
- [ ] `npm run build && firebase deploy --only hosting` → `https://kopikita-dev.web.app`.
- [ ] Uji alur lengkap bersama P5: daftar di app → pesan → Konfirmasi bayar → Proses → Siap (notifikasi di HP) → Selesai → muncul di Riwayat app & Laporan.
- [ ] Uji akun staf: menu admin tidak tampil, dan menulis ke `products.harga` ditolak rules.
- [ ] Perbaiki bug dari uji integrasi.

### Hari 7 — Demo
- [ ] Reset data demo (seed ulang dari repo mobile **sebelum** rules final, atau isi lewat dasbor admin).
- [ ] Cek kuota di Firebase Console → Firestore → Usage.
- [ ] Siapkan 2 perangkat: tablet/laptop "kasir" (Antrean) dan laptop "admin".
- [ ] Rencana cadangan: `npm run dev` di laptop bila hosting bermasalah; hotspot cadangan.

---

## Definisi selesai

- `npm run build` dan `npx tsc -b` lulus, `npm run lint` tanpa error.
- Diuji di Chrome lebar 1280 dan 1024.
- Tidak ada `onSnapshot` tanpa unsubscribe; tidak ada hex di komponen.
- `docs/DESIGN.md` diperbarui bila UI berubah; `docs/SCHEMA.md` + `src/types.ts` + model Dart diperbarui bila skema berubah.
- PR sudah di-merge ke `main`.

## Contoh perintah untuk Claude Code

- "Kerjakan setup bagian A di docs/TASKS.md."
- "Kerjakan Hari 3 di docs/TASKS.md: halaman Antrean realtime sesuai docs/DESIGN.md 3.2."
- "Buat halaman Menu sesuai docs/DESIGN.md 3.4, termasuk upload foto ke Cloudinary."
