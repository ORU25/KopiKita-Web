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
