// Cek default kustomisasi (harus sama dengan Produk di ../kopikita/lib/models/produk.dart):
// `node scripts/cek-opsi.ts`
import assert from 'node:assert/strict';
import { opsiProduk } from '../src/types.ts';

const katalog = ['Extra shot', 'Oat milk', 'Extra keju'];

// Data lama (tanpa field): minuman dapat semua opsi, makanan tidak dapat apa-apa
assert.deepEqual(opsiProduk({ kategori: 'Kopi' }, katalog), { suhu: ['Panas', 'Es'], bisaLarge: true, addOn: katalog });
assert.deepEqual(opsiProduk({ kategori: 'Makanan' }, katalog), { suhu: [], bisaLarge: false, addOn: [] });
assert.deepEqual(opsiProduk({ kategori: 'Kopi', addOn: null }, katalog).addOn, katalog);

// Field eksplisit dihormati; add-on yang sudah tidak ada di katalog diabaikan; urutan ikut katalog
const p = opsiProduk({ kategori: 'Kopi', suhu: ['Es'], bisaLarge: false, addOn: ['Oat milk', 'Hilang', 'Extra shot'] }, katalog);
assert.deepEqual(p, { suhu: ['Es'], bisaLarge: false, addOn: ['Extra shot', 'Oat milk'] });
// Makanan tidak pernah punya add-on, walau field-nya terisi
assert.deepEqual(opsiProduk({ kategori: 'Makanan', addOn: ['Extra keju'] }, katalog).addOn, []);
assert.deepEqual(opsiProduk({ kategori: 'Kopi', addOn: [] }, katalog).addOn, []);

console.log('cek-opsi: OK');
