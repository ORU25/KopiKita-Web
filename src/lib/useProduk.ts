import { collection, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from '../firebase';
import type { Produk } from '../types';

// Daftar produk realtime (dipakai Stok & Menu). null = masih memuat.
export function useProduk() {
  const [produk, setProduk] = useState<Produk[] | null>(null);
  const [galat, setGalat] = useState(false);
  const [ulang, setUlang] = useState(0);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'products'), orderBy('urutan')),
      (snap) => setProduk(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Produk)),
      () => setGalat(true),
    );
  }, [ulang]);

  return { produk, galat, muatUlang: () => (setGalat(false), setUlang((x) => x + 1)) };
}
