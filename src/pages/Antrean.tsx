import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { AlertTriangle, Clock, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '../components/Toast';
import { Badge, Button, Galat, Header, Konfirmasi, Memuat, MetodeBadge, Skeleton } from '../components/ui';
import { auth, db } from '../firebase';
import { awalHari, jam, menitSejak, rupiah, sejak, tanggal } from '../lib/format';
import { AKSI_BERIKUT, labelOpsi, STATUS_LABEL, type OrderItem, type Pesanan, type Status } from '../types';

const KOLOM: Status[] = ['menunggu_bayar', 'dibayar', 'diproses', 'siap'];
const SOROT_MS = 10_000;

export default function Antrean() {
  const toast = useToast();
  const [pesanan, setPesanan] = useState<Pesanan[] | null>(null);
  const [galat, setGalat] = useState(false);
  const [ulang, setUlang] = useState(0);
  const [baru, setBaru] = useState<Set<string>>(new Set());
  const [sibuk, setSibuk] = useState<string | null>(null);
  const [batalkan, setBatalkan] = useState<Pesanan | null>(null);
  const [, setTik] = useState(0);

  // Satu listener: pesanan sejak 00.00 hari ini, status difilter di klien (tanpa index komposit).
  // ponytail: awal hari dihitung saat halaman dibuka; muat ulang halaman setelah tengah malam.
  useEffect(() => {
    const q = query(
      collection(db, 'orders'),
      where('createdAt', '>=', Timestamp.fromDate(awalHari())),
      orderBy('createdAt'),
    );
    let pertama = true;
    return onSnapshot(
      q,
      (snap) => {
        setPesanan(snap.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: 'estimate' }) }) as Pesanan));
        if (!pertama) {
          const ids = snap.docChanges().filter((c) => c.type === 'added').map((c) => c.doc.id);
          if (ids.length) {
            setBaru((b) => new Set([...b, ...ids]));
            setTimeout(() => setBaru((b) => new Set([...b].filter((id) => !ids.includes(id)))), SOROT_MS);
          }
        }
        pertama = false;
      },
      () => setGalat(true),
    );
  }, [ulang]);

  // Perbarui label "5 mnt" tiap menit (timer lokal, tidak membaca Firestore).
  useEffect(() => {
    const t = setInterval(() => setTik((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  async function ubahStatus(p: Pesanan, status: Status) {
    setSibuk(p.id);
    try {
      await updateDoc(doc(db, 'orders', p.id), { status, updatedAt: serverTimestamp() });
      toast(`${p.nomor}: status diubah ke ${STATUS_LABEL[status]}`);
    } catch {
      toast('Gagal mengubah status. Coba lagi.');
    } finally {
      setSibuk(null);
      setBatalkan(null);
    }
  }

  const selesai = pesanan?.filter((p) => p.status === 'selesai').length ?? 0;
  const dibatalkan = pesanan?.filter((p) => p.status === 'batal').length ?? 0;
  const aktif = pesanan?.filter((p) => KOLOM.includes(p.status)) ?? [];

  return (
    <div className="flex h-full flex-col">
      <Header judul="Antrean" sub={tanggal(new Date())}>
        <Angka label="Aktif" nilai={aktif.length} />
        <Angka label="Selesai" nilai={selesai} />
        <Angka label="Dibatalkan" nilai={dibatalkan} />
        {import.meta.env.DEV && <PesananContoh />}
      </Header>

      {galat ? (
        <Galat onUlang={() => (setGalat(false), setUlang((x) => x + 1))} />
      ) : !pesanan ? (
        <SkeletonPapan />
      ) : (
        // Papan selalu tampil (juga saat kosong) agar posisi kolom tidak berubah-ubah.
        <div className="grid min-h-0 flex-1 grid-cols-4 gap-4">
          {KOLOM.map((s) => {
            const isi = aktif.filter((p) => p.status === s);
            return (
              <section key={s} className="flex min-h-0 min-w-0 flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <h2 className="flex items-center justify-between gap-2 text-base font-extrabold">
                    {STATUS_LABEL[s]}
                    <span className="rounded-md border border-divider px-2 py-0.5 text-xs font-bold text-secondary">{isi.length}</span>
                  </h2>
                  <div className={`h-1 rounded-full ${WARNA[s]}`} />
                </div>
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pb-2">
                  {isi.length === 0 ? (
                    <p className="rounded-card border border-dashed border-outline py-10 text-center text-[13px] font-semibold text-muted">
                      Tidak ada pesanan
                    </p>
                  ) : (
                    isi.map((p) => (
                      <Kartu
                        key={p.id}
                        p={p}
                        baru={baru.has(p.id)}
                        sibuk={sibuk === p.id}
                        onAksi={(st) => ubahStatus(p, st)}
                        onBatal={() => setBatalkan(p)}
                      />
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {batalkan && (
        <Konfirmasi
          judul={`Batalkan pesanan ${batalkan.nomor}?`}
          pesan="Pelanggan akan melihat pesanan ini sebagai Dibatalkan."
          label="Batalkan pesanan"
          bahaya
          loading={sibuk === batalkan.id}
          onYa={() => ubahStatus(batalkan, 'batal')}
          onClose={() => setBatalkan(null)}
        />
      )}
    </div>
  );
}

// Garis warna di bawah judul kolom, mengikuti urutan status.
const WARNA: Partial<Record<Status, string>> = {
  menunggu_bayar: 'bg-disabled',
  dibayar: 'bg-promo',
  diproses: 'bg-caramel',
  siap: 'bg-primary',
};

// Papan saat data pertama belum datang: 4 kolom, kartu abu berdenyut.
const SkeletonPapan = () => (
  <Memuat className="grid min-h-0 flex-1 grid-cols-4 gap-4">
    {KOLOM.map((s, k) => (
      <div key={s} className="flex flex-col gap-3">
        <div className="flex flex-col gap-2">
          <h2 className="text-base font-extrabold">{STATUS_LABEL[s]}</h2>
          <div className={`h-1 rounded-full opacity-40 ${WARNA[s]}`} />
        </div>
        {Array.from({ length: k < 2 ? 2 - k : 1 }, (_, i) => (
          <div key={i} className="flex flex-col gap-3 rounded-card border border-divider p-4">
            <div className="flex justify-between">
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3.5 w-12" />
            </div>
            <Skeleton className="h-6 w-28" />
            <div className="flex flex-col gap-2 border-t border-divider pt-3">
              <Skeleton className="h-3.5 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3.5 w-2/3" />
            </div>
            <Skeleton className="h-11 rounded-btn" />
          </div>
        ))}
      </div>
    ))}
  </Memuat>
);

const Angka = ({ label, nilai }: { label: string; nilai: number }) => (
  <div className="flex h-11 items-center gap-2 rounded-btn border border-divider px-3">
    <span className="text-xs font-bold text-muted uppercase">{label}</span>
    <span className="text-base font-extrabold">{nilai}</span>
  </div>
);

interface KartuProps {
  p: Pesanan;
  baru: boolean;
  sibuk: boolean;
  onAksi: (s: Status) => void;
  onBatal: () => void;
}

function Kartu({ p, baru, sibuk, onAksi, onBatal }: KartuProps) {
  const aksi = AKSI_BERIKUT[p.status];
  const telat = p.status !== 'siap' && menitSejak(p.createdAt) > 15;
  const jumlahItem = p.items.reduce((s, i) => s + i.jumlah, 0);

  return (
    <article
      className={`flex flex-col gap-3 rounded-card border bg-bg p-4 shadow-card transition-colors ${baru ? 'border-caramel ring-1 ring-caramel' : 'border-divider'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[28px] leading-none font-extrabold tracking-[-0.5px]">{p.nomor}</span>
            {baru && <Badge className="bg-caramel text-white">Baru</Badge>}
          </div>
          <MetodeBadge makanDiTempat={p.makanDiTempat} nomorMeja={p.nomorMeja} />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-0.5" title={telat ? 'Menunggu lebih dari 15 menit' : undefined}>
          <span className={`flex items-center gap-1 text-xs font-bold ${telat ? 'text-danger' : 'text-secondary'}`}>
            {telat ? <AlertTriangle size={14} strokeWidth={2.2} /> : <Clock size={14} strokeWidth={2.2} />}
            {sejak(p.createdAt)}
          </span>
          <span className="text-xs text-muted">{jam(p.createdAt)}</span>
        </div>
      </div>

      <ul className="flex flex-col gap-2.5 border-t border-divider pt-3">
        {p.items.map((i, n) => (
          <li key={n} className="flex gap-2.5">
            <span className="flex h-6 min-w-7 shrink-0 items-center justify-center rounded-md bg-ink/5 px-1 text-xs font-extrabold">
              {i.jumlah}×
            </span>
            <div className="min-w-0">
              <p className="text-sm leading-6 font-bold">{i.nama}</p>
              {!i.makanan && <p className="text-xs text-muted">{labelOpsi(i)}</p>}
              {i.catatan && <p className="text-xs text-secondary italic">“{i.catatan}”</p>}
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-end justify-between border-t border-divider pt-3">
        <div>
          <p className="text-[13px] text-muted">Total · {jumlahItem} item</p>
          {p.voucher && <p className="text-xs font-bold text-promo">{p.voucher}</p>}
        </div>
        <span className="text-base font-extrabold text-primary">{rupiah(p.total)}</span>
      </div>

      <div className="flex flex-col">
        {aksi && (
          <Button className="w-full" loading={sibuk} onClick={() => onAksi(aksi[1])}>
            {aksi[0]}
          </Button>
        )}
        <Button varian="bahaya" className="w-full text-[13px]" disabled={sibuk} onClick={onBatal}>
          Batalkan
        </Button>
      </div>
    </article>
  );
}

// Alat uji khusus dev: membuat pesanan contoh sampai checkout app mobile siap.
function PesananContoh() {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  async function buat() {
    const uid = auth.currentUser?.uid;
    if (!uid) return;
    setLoading(true);
    const items: OrderItem[] = [
      {
        productId: 'kopi-susu-kita', gambarUrl: '', nama: 'Kopi Susu Kita', harga: 31000, jumlah: 2, makanan: false,
        ukuran: 'Large', suhu: 'Es', gula: 'Normal', es: 'Sedikit', addOn: ['Extra shot'], catatan: '',
      },
      {
        productId: 'croissant-butter', gambarUrl: '', nama: 'Croissant Butter', harga: 18000, jumlah: 1, makanan: true,
        ukuran: 'Regular', suhu: 'Panas', gula: 'Normal', es: 'Normal', addOn: [], catatan: 'Tolong dihangatkan',
      },
    ];
    const subtotal = items.reduce((s, i) => s + i.harga * i.jumlah, 0);
    const pajak = Math.round(subtotal * 0.1);
    const makanDiTempat = Math.random() < 0.5;
    try {
      await addDoc(collection(db, 'orders'), {
        uid,
        nomor: `T-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        makanDiTempat,
        nomorMeja: makanDiTempat ? Math.ceil(Math.random() * 12) : null,
        items,
        subtotal,
        diskon: 0,
        pajak,
        total: subtotal + pajak,
        voucher: null,
        status: 'menunggu_bayar',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch {
      toast('Gagal membuat pesanan contoh.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button varian="sekunder" loading={loading} onClick={buat}>
      <Plus size={18} /> Pesanan contoh
    </Button>
  );
}
