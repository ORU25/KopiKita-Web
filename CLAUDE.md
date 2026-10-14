# KopiKita Web — Dasbor Staf & Admin

Dasbor web internal untuk kedai **KopiKita**. Staf mengelola antrean pesanan secara realtime; admin juga mengelola menu, voucher, pengguna, dan melihat laporan. Pesanan dibuat dari aplikasi Android pelanggan (Flutter, repo terpisah di `../kopikita`). Kedua aplikasi **tidak saling memanggil**: keduanya membaca dan menulis ke Firestore yang sama (project Firebase `kopikita-dev`).

## Dokumen wajib baca

| File | Isi |
|---|---|
| `docs/TASKS.md` | Setup awal (mulai dari sini bila `package.json` belum ada), checklist fitur per hari, definisi selesai |
| `docs/SCHEMA.md` | **Kontrak data Firestore**, tipe TypeScript siap pakai, alur status pesanan, draf `firestore.rules` |
| `docs/DESIGN.md` | Token warna/tipografi (sama dengan aplikasi mobile), layout dasbor, spesifikasi tiap halaman |

## Stack

- **Vite + React 19 + TypeScript** (SPA, tanpa SSR)
- **Firebase JS SDK** (API modular): `firebase/auth`, `firebase/firestore`
- **Tailwind CSS v4** via `@tailwindcss/vite`, token di `src/index.css` (`@theme`)
- **react-router** v7+ (import dari `'react-router'`)
- **Cloudinary** untuk foto menu — upload langsung via `fetch` + unsigned preset (tanpa SDK)
- **Firebase Hosting** untuk deploy

- **lucide-react** untuk ikon (satu-satunya library UI)

Jangan menambah dependency lain (UI kit, state manager, library tabel/form/tanggal, axios) tanpa alasan kuat. State cukup `useState`/`useEffect` + hook kecil; tabel cukup `<table>` + Tailwind; format angka/tanggal pakai `Intl`.

## Perintah

```bash
npm run dev          # http://localhost:5173
npm run build        # hasil di dist/
npm run lint
npx tsc -b           # cek tipe
firebase deploy --only hosting          # deploy web
firebase deploy --only firestore:rules  # deploy rules (hanya setelah diuji)
```

## Aturan penting

1. **Skema Firestore adalah kontrak dengan aplikasi mobile.** Sumber kebenarannya model Dart di `../kopikita/lib/models/` (`produk.dart`, `voucher.dart`, `pesanan.dart`, `cart_item.dart`). Tipe di `src/types.ts` harus sama persis (nama field, nilai `status`). Bila skema berubah: ubah model Dart **dan** `src/types.ts` **dan** `docs/SCHEMA.md` di pekerjaan yang sama, lalu umumkan ke tim mobile.
2. **Nilai `status` pesanan** hanya: `menunggu_bayar`, `dibayar`, `diproses`, `siap`, `selesai`, `batal`. Setiap update status juga menulis `updatedAt: serverTimestamp()`.
3. **Hemat kuota Firestore (paket Spark gratis: 50 rb baca/hari).**
   - Setiap `onSnapshot` berada di `useEffect` dan **mengembalikan fungsi unsubscribe**. Query/ref dibuat di dalam effect atau di-`useMemo`, jangan dibuat baru tiap render.
   - Listener selalu berfilter: antrean hanya pesanan **hari ini** (`where('createdAt', '>=', awalHariIni)`), daftar panjang pakai `limit`.
   - Data yang tidak perlu realtime (laporan) pakai `getDocs`, bukan `onSnapshot`. Jangan polling dengan `setInterval`.
4. **Desain:** ikuti `docs/DESIGN.md`. Pakai kelas token Tailwind (`bg-primary`, `text-muted`, …) — **jangan menulis hex langsung di komponen**. Teks minimal 12px, target klik minimal 44×44 (dasbor juga dipakai di tablet kasir). Bahasa UI: Bahasa Indonesia.
5. **Setiap perubahan UI yang diminta/diajukan user WAJIB juga diperbarui di `docs/DESIGN.md`** dalam pekerjaan yang sama, agar dokumen itu tetap jadi sumber kebenaran.
6. **Akses berdasarkan role** dari `users/{uid}.role`: `pelanggan` ditolak masuk dasbor, `staf` hanya Antrean + Stok, `admin` semua halaman (Antrean, Stok, Menu, Voucher, Pengguna, Laporan). Menyembunyikan menu di UI **bukan** pengaman — pengaman sebenarnya ada di `firestore.rules` (lihat `docs/SCHEMA.md`).
7. **Tidak ada fitur poin/loyalty dan tidak ada delivery.** Metode pesanan hanya Ambil Sendiri (`makanDiTempat: false`) dan Makan di Tempat (`makanDiTempat: true` + `nomorMeja`).
8. Format Rupiah sama dengan aplikasi mobile: `"Rp22.000"` → `'Rp' + n.toLocaleString('id-ID')`.

## Struktur yang dituju

```
src/
  firebase.ts          # initializeApp + export auth, db
  types.ts             # salinan tipe dari docs/SCHEMA.md
  lib/format.ts        # rupiah(), jam(), tanggal()
  lib/useAuth.tsx      # user + profil (role) + loading
  lib/cloudinary.ts    # uploadFoto(file) → secure_url
  components/          # Layout (sidebar), Modal, Toggle, StatusBadge, …
  pages/               # Login, Antrean, Stok, Menu, Voucher, Pengguna, Laporan
  App.tsx              # routes + guard role
  index.css            # @import "tailwindcss" + @theme token
```

## Akun uji

Dibuat oleh `../kopikita/lib/seed.dart`; kata sandi semua akun `kopikita123`.
`admin@kopikita.test` (admin), `staf@kopikita.test` (staf), `pelanggan@kopikita.test` (pelanggan — harus ditolak di dasbor).

## Git

Repo terpisah dari aplikasi mobile. Branch pendek `p1/<fitur>` dari `main`, PR ke `main`, *squash and merge*. Jangan commit `node_modules/`, `dist/`, `.env.local`, `.firebase/`.
