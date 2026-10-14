// Cek cepat logika laporan: `node scripts/cek-laporan.ts`
import assert from 'node:assert/strict';
import { ringkas } from '../src/lib/laporan.ts';

const ts = (iso: string) => ({ toDate: () => new Date(iso) });
const item = (nama: string, harga: number, jumlah: number) => ({ nama, harga, jumlah });
const p = (iso: string, status: string, total: number, items: object[] = []) =>
  ({ createdAt: ts(iso), status, total, items }) as never;

const r = ringkas(
  [
    p('2026-10-13T09:00', 'selesai', 50000, [item('Kopi Susu Kita', 22000, 2)]),
    p('2026-10-14T10:00', 'selesai', 30000, [item('Americano', 18000, 1), item('Kopi Susu Kita', 22000, 1)]),
    p('2026-10-14T11:00', 'batal', 99000, [item('Americano', 18000, 5)]),
    p('2026-10-14T12:00', 'diproses', 10000),
    p('2026-10-20T12:00', 'selesai', 10000), // di luar rentang
  ],
  new Date('2026-10-13T00:00'),
  2,
);

assert.deepEqual(r.baris.map((b) => b.tanggal), ['2026-10-13', '2026-10-14']);
assert.deepEqual(r.total, { selesai: 2, batal: 1, omzet: 80000 });
assert.deepEqual(r.terlaris[0], { nama: 'Kopi Susu Kita', jumlah: 3, pendapatan: 66000 });
assert.equal(r.terlaris.length, 2); // pesanan batal tidak dihitung
console.log('cek-laporan: OK');
