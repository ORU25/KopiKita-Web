import type { Pesanan } from '../types.ts';
import { isoTanggal } from './format.ts';

export interface BarisHari {
  tanggal: string; // "2026-10-14"
  selesai: number;
  batal: number;
  omzet: number;
}

export interface Terlaris {
  nama: string;
  jumlah: number;
  pendapatan: number;
}

// Ringkas pesanan untuk `hari` hari mulai `dari` (00.00 lokal).
// Omzet = jumlah `total` pesanan berstatus `selesai`.
export function ringkas(pesanan: Pesanan[], dari: Date, hari: number) {
  const perHari = new Map<string, BarisHari>();
  for (let i = 0; i < hari; i++) {
    const d = new Date(dari);
    d.setDate(d.getDate() + i);
    const t = isoTanggal(d);
    perHari.set(t, { tanggal: t, selesai: 0, batal: 0, omzet: 0 });
  }

  const menu = new Map<string, Terlaris>();
  for (const p of pesanan) {
    if (!p.createdAt) continue;
    const baris = perHari.get(isoTanggal(p.createdAt.toDate()));
    if (!baris) continue;
    if (p.status === 'batal') baris.batal++;
    if (p.status !== 'selesai') continue;
    baris.selesai++;
    baris.omzet += p.total;
    for (const i of p.items) {
      const m = menu.get(i.nama) ?? { nama: i.nama, jumlah: 0, pendapatan: 0 };
      m.jumlah += i.jumlah;
      m.pendapatan += i.harga * i.jumlah;
      menu.set(i.nama, m);
    }
  }

  const baris = [...perHari.values()];
  return {
    baris,
    total: {
      selesai: baris.reduce((s, b) => s + b.selesai, 0),
      batal: baris.reduce((s, b) => s + b.batal, 0),
      omzet: baris.reduce((s, b) => s + b.omzet, 0),
    },
    terlaris: [...menu.values()].sort((a, b) => b.jumlah - a.jumlah || b.pendapatan - a.pendapatan).slice(0, 5),
  };
}
