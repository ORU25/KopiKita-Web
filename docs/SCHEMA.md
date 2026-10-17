# Kontrak Data Firestore

Project Firebase: **`kopikita-dev`**. Dipakai bersama aplikasi Android pelanggan (`../kopikita`).
Sumber kebenaran: model Dart di `../kopikita/lib/models/` — dokumen ini dan `src/types.ts` harus selalu sama dengannya.

## Koleksi

```
users/{uid}
  nama: string
  email: string
  role: "pelanggan" | "staf" | "admin"     // default "pelanggan" saat daftar di app
  favorit: string[]                         // productId
  voucher: string[]                         // kode voucher yang dimiliki (diatur admin). Hapus voucher → kode dicabut dari semua user
  notifikasi: boolean
  fotoUrl: string                           // opsional, URL Cloudinary foto profil (diisi app)
  createdAt: Timestamp

products/{id}                               // id = slug nama, mis. "kopi-susu-kita"
  nama: string
  deskripsi: string
  harga: number                             // harga dasar, rupiah, integer
  kategori: "Kopi" | "Non-Kopi" | "Makanan"
  gambarUrl: string                         // URL Cloudinary, "" = belum ada foto
  habis: boolean
  rekomendasi: boolean                      // tampil di Rekomendasi / Paling laris
  urutan: number                            // urutan tampil
  // Kustomisasi per produk (opsional; dokumen lama tanpa field ini = perilaku lama)
  suhu: ("Panas" | "Es")[]                  // pilihan suhu; [] untuk makanan. Default: minuman ["Panas","Es"], makanan []
  bisaLarge: boolean                        // ada pilihan Large. Default: minuman true, makanan false
  addOn: string[] | null                    // nama add-on dari katalog config/menu yang boleh dipilih (minuman saja).
                                            // null/tidak ada = semua katalog. Makanan selalu tanpa add-on

config/menu                                 // satu dokumen — KATALOG kustomisasi (harga diatur di satu tempat)
  hargaLarge: number                        // 4000
  addOn: { [nama: string]: number }         // katalog add-on minuman, mis. { "Extra shot": 5000, "Oat milk": 6000 }
  pajak: number                             // 0.10

vouchers/{kode}                             // id = kode, mis. "KOPIKITA20"
  info: string                              // "Diskon 20% · min. Rp50.000"
  tipe: "persen" | "potongan"
  nilai: number                             // 20 (persen) atau 5000 (rupiah)
  minBelanja: number
  berlakuSampai: Timestamp | null
  aktif: boolean

orders/{id}                                 // id otomatis
  uid: string                               // pemesan (users/{uid})
  nomor: string                             // nomor antrean, mis. "A-014" (reset tiap hari)
  makanDiTempat: boolean                    // false = Ambil Sendiri
  nomorMeja: number | null                  // hanya bila makanDiTempat
  items: OrderItem[]
  subtotal: number
  diskon: number
  pajak: number
  total: number
  voucher: string | null
  status: "menunggu_bayar" | "dibayar" | "diproses" | "siap" | "selesai" | "batal"
  createdAt: Timestamp                      // serverTimestamp()
  updatedAt: Timestamp                      // serverTimestamp() setiap ganti status

OrderItem                                   // = CartItem.toMap() di Dart
  productId: string
  gambarUrl: string
  nama: string
  harga: number                             // harga satuan SETELAH kustomisasi
  jumlah: number
  makanan: boolean                          // true = tanpa opsi minuman
  ukuran: "Regular" | "Large"
  suhu: "Panas" | "Es"
  gula: "Tanpa" | "Sedikit" | "Normal" | "Manis"
  es: "Sedikit" | "Normal" | "Banyak"       // hanya bermakna bila suhu = "Es"
  addOn: string[]
  catatan: string

counters/antrean                            // dinaikkan app pelanggan via transaction saat checkout
  tanggal: string                           // "2026-10-14"
  nomor: number
```

**Kustomisasi:** hanya untuk minuman — makanan tidak punya opsi (suhu `[]`, `bisaLarge: false`, tanpa add-on), pelanggan cukup menulis catatan. Gula (Tanpa/Sedikit/Normal/Manis) berlaku untuk semua minuman, level es hanya bila suhu = Es; keduanya tidak diatur per produk. Harga satuan di `OrderItem.harga` = harga produk + `hargaLarge` (bila Large) + harga add-on dari katalog. `orders` tidak berubah oleh fitur ini.

Pesanan **dibuat oleh aplikasi pelanggan**; dasbor hanya membaca dan mengubah `status`.

## Alur status pesanan

```
menunggu_bayar ──Konfirmasi bayar──▶ dibayar ──Proses──▶ diproses ──Siap──▶ siap ──Selesai──▶ selesai
      │                                 │                    │                │
      └──────────────────────── Batalkan ────────────────────┴────────────────┘──▶ batal
```

| Status | Label (sama dengan app) | Tombol aksi di dasbor | Status berikutnya |
|---|---|---|---|
| `menunggu_bayar` | Menunggu bayar | **Konfirmasi bayar** | `dibayar` |
| `dibayar` | Dibayar | **Proses** | `diproses` |
| `diproses` | Diproses | **Siap** | `siap` |
| `siap` | Siap diambil | **Selesai** | `selesai` |
| `selesai` | Selesai | — | — |
| `batal` | Dibatalkan | — | — |

- Staf & admin boleh **Batalkan** di status mana pun selain `selesai`/`batal` (minta konfirmasi dulu).
- Pelanggan (dari app) hanya boleh `menunggu_bayar → batal`.

## Tipe TypeScript (`src/types.ts`)

```ts
import type { Timestamp } from 'firebase/firestore';

export type Role = 'pelanggan' | 'staf' | 'admin';
export type Kategori = 'Kopi' | 'Non-Kopi' | 'Makanan';
export type Status = 'menunggu_bayar' | 'dibayar' | 'diproses' | 'siap' | 'selesai' | 'batal';

export const KATEGORI: Kategori[] = ['Kopi', 'Non-Kopi', 'Makanan'];

export const STATUS_LABEL: Record<Status, string> = {
  menunggu_bayar: 'Menunggu bayar',
  dibayar: 'Dibayar',
  diproses: 'Diproses',
  siap: 'Siap diambil',
  selesai: 'Selesai',
  batal: 'Dibatalkan',
};

// Tombol aksi utama per status: [label, status berikutnya]
export const AKSI_BERIKUT: Partial<Record<Status, [string, Status]>> = {
  menunggu_bayar: ['Konfirmasi bayar', 'dibayar'],
  dibayar: ['Proses', 'diproses'],
  diproses: ['Siap', 'siap'],
  siap: ['Selesai', 'selesai'],
};

export interface UserDoc {
  id: string; // uid
  nama: string;
  email: string;
  role: Role;
  favorit: string[];
  voucher: string[];
  notifikasi: boolean;
  fotoUrl?: string; // URL Cloudinary foto profil, diisi app; opsional
  createdAt?: Timestamp;
}

export interface Produk {
  id: string;
  nama: string;
  deskripsi: string;
  harga: number;
  kategori: Kategori;
  gambarUrl: string;
  habis: boolean;
  rekomendasi: boolean;
  urutan: number;
  // Kustomisasi per produk. Opsional: dokumen lama belum punya field ini.
  suhu?: Suhu[]; // [] untuk makanan
  bisaLarge?: boolean;
  addOn?: string[] | null; // nama add-on minuman dari config/menu; null/kosong field = semua (data lama)
}

export type Suhu = 'Panas' | 'Es';
export const SUHU: Suhu[] = ['Panas', 'Es'];

export interface ConfigMenu {
  hargaLarge: number;
  addOn: Record<string, number>; // katalog add-on minuman: nama → harga
  pajak: number; // 0.10 = 10%
}

// opsiProduk: nilai efektif kustomisasi, sama dengan default di Produk (Dart).
// Makanan tidak punya kustomisasi (hanya catatan). Field kosong = perilaku lama:
// minuman Panas/Es + Large + semua add-on.
export function opsiProduk(p: Pick<Produk, 'kategori' | 'suhu' | 'bisaLarge' | 'addOn'>, katalog: string[]) {
  const makanan = p.kategori === 'Makanan';
  return {
    suhu: p.suhu ?? (makanan ? [] : SUHU),
    bisaLarge: p.bisaLarge ?? !makanan,
    addOn: makanan ? [] : katalog.filter((a) => !p.addOn || p.addOn.includes(a)),
  };
}

export interface Voucher {
  id: string; // = kode
  info: string;
  tipe: 'persen' | 'potongan';
  nilai: number;
  minBelanja: number;
  berlakuSampai: Timestamp | null;
  aktif: boolean;
}

export interface OrderItem {
  productId: string;
  gambarUrl: string;
  nama: string;
  harga: number;
  jumlah: number;
  makanan: boolean;
  ukuran: 'Regular' | 'Large';
  suhu: 'Panas' | 'Es';
  gula: 'Tanpa' | 'Sedikit' | 'Normal' | 'Manis';
  es: 'Sedikit' | 'Normal' | 'Banyak';
  addOn: string[];
  catatan: string;
}

export interface Pesanan {
  id: string;
  uid: string;
  nomor: string;
  makanDiTempat: boolean;
  nomorMeja: number | null;
  items: OrderItem[];
  subtotal: number;
  diskon: number;
  pajak: number;
  total: number;
  voucher: string | null;
  status: Status;
  createdAt: Timestamp | null; // null sesaat sebelum server mengisi
  updatedAt?: Timestamp;
}

// labelOpsi: sama dengan CartItem.labelOpsi di Dart
// "Large · Es · Gula normal · Es normal · + Extra shot"
export function labelOpsi(i: OrderItem): string {
  if (i.makanan) return i.catatan;
  return [
    i.ukuran,
    i.suhu,
    `Gula ${i.gula.toLowerCase()}`,
    ...(i.suhu === 'Es' ? [`Es ${i.es.toLowerCase()}`] : []),
    ...i.addOn.map((a) => `+ ${a}`),
  ].join(' · ');
}
```

Konversi dokumen: `{ id: d.id, ...d.data() } as Produk`. Saat **menulis**, jangan sertakan `id` (id = nama dokumen).

## Pola query yang dipakai

| Kebutuhan | Query | Realtime? | Index komposit? |
|---|---|---|---|
| Antrean hari ini | `query(collection(db,'orders'), where('createdAt','>=', Timestamp.fromDate(awalHariIni)), orderBy('createdAt'))` — filter status di klien | `onSnapshot` | Tidak (satu field) |
| Stok / produk | `query(collection(db,'products'), orderBy('urutan'))` | `onSnapshot` | Tidak |
| Voucher | `collection(db,'vouchers')` | `onSnapshot` | Tidak |
| Pengguna | `query(collection(db,'users'), orderBy('nama'), startAfter(kursor), limit(51))` (50 per muat, +1 penanda halaman berikut) + `collection(db,'vouchers')` | `getDocs` | Tidak |
| Laporan | `query(collection(db,'orders'), where('createdAt','>=',dari), where('createdAt','<',sampai))` — filter `status === 'selesai'` di klien | `getDocs` | Tidak |
| Ubah status | `updateDoc(doc(db,'orders',id), { status, updatedAt: serverTimestamp() })` | — | — |

Menggabungkan `where('status','==',…)` dengan rentang `createdAt` butuh index komposit — hindari dengan memfilter status di klien (data per hari kecil).

## Draf `firestore.rules` (dipasang Hari 5)

Sebelum Hari 5 database memakai **test mode**. Rules di bawah menggantikannya. Uji dulu di Firebase Console → Firestore → Rules → **Rules Playground**, lalu deploy dengan `firebase deploy --only firestore:rules`. Setelah dipasang, `../kopikita/lib/seed.dart` tidak bisa lagi membuat akun admin/staf (role hanya bisa diubah admin).

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function masuk() { return request.auth != null; }
    function role() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role;
    }
    function staf() { return masuk() && role() in ['staf', 'admin']; }
    function admin() { return masuk() && role() == 'admin'; }
    function hanyaUbah(fields) {
      return request.resource.data.diff(resource.data).affectedKeys().hasOnly(fields);
    }

    match /users/{uid} {
      allow read: if masuk() && (request.auth.uid == uid || staf());
      // Daftar dari app: hanya boleh membuat dirinya sendiri sebagai pelanggan
      allow create: if masuk() && request.auth.uid == uid
                    && request.resource.data.role == 'pelanggan';
      // Pelanggan hanya boleh ubah nama/favorit/notifikasi; role & voucher diatur admin
      allow update: if admin()
                    || (request.auth.uid == uid && hanyaUbah(['nama', 'favorit', 'notifikasi']));
      allow delete: if admin();
    }

    match /products/{id} {
      allow read: if true;
      allow update: if admin() || (staf() && hanyaUbah(['habis']));
      allow create, delete: if admin();
    }

    match /config/{id} {
      allow read: if true;
      allow write: if admin();
    }

    match /vouchers/{kode} {
      allow read: if masuk();
      allow write: if admin();
    }

    match /orders/{id} {
      allow read: if masuk() && (resource.data.uid == request.auth.uid || staf());
      allow create: if masuk() && request.resource.data.uid == request.auth.uid
                    && request.resource.data.status == 'menunggu_bayar';
      allow update: if staf()
                    || (masuk() && resource.data.uid == request.auth.uid
                        && resource.data.status == 'menunggu_bayar'
                        && request.resource.data.status == 'batal'
                        && hanyaUbah(['status', 'updatedAt']));
      allow delete: if admin();
    }

    // ponytail: nomor antrean dinaikkan dari app (tanpa Cloud Functions), jadi
    // pengguna yang login bisa menulis counter. Cukup untuk demo; pindah ke
    // Cloud Function bila dipakai sungguhan.
    match /counters/{id} {
      allow read, write: if masuk();
    }
  }
}
```

Catatan kuota: setiap pemeriksaan `role()` menghitung 1 baca dokumen `users` (di-cache per permintaan). Masih jauh di bawah batas untuk skala demo.
