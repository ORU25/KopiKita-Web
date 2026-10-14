import type { Timestamp } from 'firebase/firestore';

type Waktu = Timestamp | Date | null | undefined;
const keDate = (t: Waktu) => (t ? ('toDate' in t ? t.toDate() : t) : new Date());

// Sama dengan app mobile: "Rp22.000"
export const rupiah = (n: number) => 'Rp' + n.toLocaleString('id-ID');

// "14.05"
export const jam = (t: Waktu) =>
  keDate(t).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

// "14 Okt 2026"
export const tanggal = (t: Waktu) =>
  keDate(t).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

// Menit penuh sejak t
export const menitSejak = (t: Waktu) => Math.max(0, Math.floor((Date.now() - keDate(t).getTime()) / 60000));

// "5 mnt", "1 j 20 mnt"
export function sejak(t: Waktu) {
  const m = menitSejak(t);
  return m < 60 ? `${m} mnt` : `${Math.floor(m / 60)} j ${m % 60} mnt`;
}

// Awal hari ini (00.00 waktu lokal)
export function awalHari(d = new Date()) {
  const a = new Date(d);
  a.setHours(0, 0, 0, 0);
  return a;
}

// "2026-10-14" waktu lokal (untuk <input type="date"> dan pengelompokan laporan)
export const isoTanggal = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
