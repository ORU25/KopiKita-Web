import {
  arrayRemove,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { useToast } from '../components/Toast';
import {
  Button,
  Galat,
  Header,
  Input,
  Konfirmasi,
  Kosong,
  SkeletonTabel,
  Modal,
  tabelCls,
  tdCls,
  thCls,
  Toggle,
  trCls,
} from '../components/ui';
import { db } from '../firebase';
import { isoTanggal, rupiah, tanggal } from '../lib/format';
import type { Voucher as VoucherDoc } from '../types';

const ikonBtn = 'inline-flex size-11 cursor-pointer items-center justify-center rounded-btn hover:bg-ink/4';

const nilaiVoucher = (v: Pick<VoucherDoc, 'tipe' | 'nilai'>) => (v.tipe === 'persen' ? `${v.nilai}%` : rupiah(v.nilai));

export default function Voucher() {
  const toast = useToast();
  const [voucher, setVoucher] = useState<VoucherDoc[] | null>(null);
  const [galat, setGalat] = useState(false);
  const [ulang, setUlang] = useState(0);
  const [form, setForm] = useState<VoucherDoc | 'baru' | null>(null);
  const [hapus, setHapus] = useState<VoucherDoc | null>(null);
  const [menghapus, setMenghapus] = useState(false);

  useEffect(() => {
    return onSnapshot(
      collection(db, 'vouchers'),
      (snap) => setVoucher(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as VoucherDoc)),
      () => setGalat(true),
    );
  }, [ulang]);

  async function ubahAktif(v: VoucherDoc, aktif: boolean) {
    try {
      await updateDoc(doc(db, 'vouchers', v.id), { aktif });
      toast(`${v.id} ${aktif ? 'diaktifkan' : 'dinonaktifkan'}`);
    } catch {
      toast('Gagal menyimpan. Coba lagi.');
    }
  }

  async function hapusVoucher(v: VoucherDoc) {
    setMenghapus(true);
    try {
      // Hapus voucher + cabut kodenya dari semua user dalam satu batch (atomik).
      // ponytail: batch maks 500 tulisan, cukup untuk skala demo; pecah per 500 bila pemilik bisa > 499.
      const pemilik = await getDocs(query(collection(db, 'users'), where('voucher', 'array-contains', v.id)));
      const batch = writeBatch(db);
      pemilik.forEach((u) => batch.update(u.ref, { voucher: arrayRemove(v.id) }));
      batch.delete(doc(db, 'vouchers', v.id));
      await batch.commit();
      toast(`${v.id} dihapus${pemilik.size ? ` dan dicabut dari ${pemilik.size} pengguna` : ''}`);
      setHapus(null);
    } catch {
      toast('Gagal menghapus. Coba lagi.');
    } finally {
      setMenghapus(false);
    }
  }

  return (
    <div>
      <Header judul="Voucher">
        <Button onClick={() => setForm('baru')}>
          <Plus size={18} /> Tambah voucher
        </Button>
      </Header>

      {galat ? (
        <Galat onUlang={() => (setGalat(false), setUlang((x) => x + 1))} />
      ) : !voucher ? (
        <SkeletonTabel kolom={['Kode', 'Info', 'Nilai', 'Min. belanja', 'Berlaku sampai', 'Aktif', 'Aksi']} kanan={[2, 3, 6]} sembunyi={[1]} baris={3} />
      ) : voucher.length === 0 ? (
        <Kosong pesan="Belum ada voucher" />
      ) : (
        <div className={tabelCls}>
          <table className="w-full">
            <thead>
              <tr>
                <th className={thCls}>Kode</th>
                <th className={`${thCls} max-md:hidden`}>Info</th>
                <th className={`${thCls} text-right`}>Nilai</th>
                <th className={`${thCls} text-right`}>Min. belanja</th>
                <th className={thCls}>Berlaku sampai</th>
                <th className={`${thCls} text-center`}>Aktif</th>
                <th className={`${thCls} text-right`}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {voucher.map((v) => {
                const lewat = v.berlakuSampai && v.berlakuSampai.toMillis() < Date.now();
                return (
                  <tr key={v.id} className={trCls}>
                    <td className={`${tdCls} font-extrabold text-primary`}>{v.id}</td>
                    <td className={`${tdCls} max-md:hidden`}>{v.info}</td>
                    <td className={`${tdCls} text-right`}>{nilaiVoucher(v)}</td>
                    <td className={`${tdCls} text-right`}>{rupiah(v.minBelanja)}</td>
                    <td className={`${tdCls} whitespace-nowrap ${lewat ? 'text-danger' : ''}`}>
                      {v.berlakuSampai ? tanggal(v.berlakuSampai) : 'Tanpa batas'}
                    </td>
                    <td className={`${tdCls} text-center`}>
                      <Toggle aktif={v.aktif} label={`${v.id} aktif`} onChange={(a) => ubahAktif(v, a)} />
                    </td>
                    <td className={`${tdCls} text-right whitespace-nowrap`}>
                      <button type="button" className={`${ikonBtn} text-secondary`} title="Edit" aria-label={`Edit ${v.id}`} onClick={() => setForm(v)}>
                        <Pencil size={18} strokeWidth={1.8} />
                      </button>
                      <button type="button" className={`${ikonBtn} text-danger`} title="Hapus" aria-label={`Hapus ${v.id}`} onClick={() => setHapus(v)}>
                        <Trash2 size={18} strokeWidth={1.8} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {form && <FormVoucher awal={form === 'baru' ? null : form} onClose={() => setForm(null)} />}
      {hapus && (
        <Konfirmasi
          judul={`Hapus voucher ${hapus.id}?`}
          pesan="Voucher ini juga dicabut dari semua pelanggan yang memilikinya."
          label="Hapus"
          bahaya
          loading={menghapus}
          onYa={() => hapusVoucher(hapus)}
          onClose={() => setHapus(null)}
        />
      )}
    </div>
  );
}

function FormVoucher({ awal, onClose }: { awal: VoucherDoc | null; onClose: () => void }) {
  const toast = useToast();
  const [kode, setKode] = useState(awal?.id ?? '');
  const [info, setInfo] = useState(awal?.info ?? '');
  const [tipe, setTipe] = useState<VoucherDoc['tipe']>(awal?.tipe ?? 'persen');
  const [nilai, setNilai] = useState(String(awal?.nilai ?? ''));
  const [minBelanja, setMinBelanja] = useState(String(awal?.minBelanja ?? 0));
  const [sampai, setSampai] = useState(awal?.berlakuSampai ? isoTanggal(awal.berlakuSampai.toDate()) : '');
  const [aktif, setAktif] = useState(awal?.aktif ?? true);
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function simpan(e: FormEvent) {
    e.preventDefault();
    const g: Record<string, string> = {};
    const nNilai = Number(nilai);
    const nMin = Number(minBelanja);
    if (!/^[A-Z0-9_-]+$/.test(kode)) g.kode = 'Kode wajib diisi: huruf besar/angka tanpa spasi.';
    if (!info.trim()) g.info = 'Info wajib diisi.';
    if (!Number.isInteger(nNilai) || nNilai <= 0 || (tipe === 'persen' && nNilai > 100))
      g.nilai = tipe === 'persen' ? 'Persen 1–100.' : 'Potongan harus angka bulat lebih dari 0.';
    if (!Number.isInteger(nMin) || nMin < 0) g.minBelanja = 'Min. belanja harus angka bulat ≥ 0.';
    setGalat(g);
    if (Object.keys(g).length) return;

    setLoading(true);
    try {
      const ref = doc(db, 'vouchers', kode);
      if (!awal && (await getDoc(ref)).exists()) {
        setGalat({ kode: 'Kode ini sudah dipakai.' });
        return;
      }
      await setDoc(ref, {
        info: info.trim(),
        tipe,
        nilai: nNilai,
        minBelanja: nMin,
        // Berlaku sampai akhir hari yang dipilih (waktu lokal).
        berlakuSampai: sampai ? Timestamp.fromDate(new Date(`${sampai}T23:59:59`)) : null,
        aktif,
      });
      toast('Tersimpan');
      onClose();
    } catch {
      toast('Gagal menyimpan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  const segmen = (t: VoucherDoc['tipe'], label: string) => (
    <button
      type="button"
      aria-pressed={tipe === t}
      onClick={() => setTipe(t)}
      className={`h-11 flex-1 cursor-pointer text-sm font-bold ${tipe === t ? 'bg-primary text-white' : 'text-secondary'}`}
    >
      {label}
    </button>
  );

  return (
    <Modal
      judul={awal ? 'Edit voucher' : 'Tambah voucher'}
      onClose={onClose}
      footer={
        <>
          <Button varian="sekunder" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form="form-voucher" loading={loading}>
            Simpan
          </Button>
        </>
      }
    >
      <form id="form-voucher" onSubmit={simpan} className="flex flex-col gap-4">
        <Input
          label="Kode"
          value={kode}
          disabled={!!awal}
          error={galat.kode}
          placeholder="KOPIKITA20"
          onChange={(e) => setKode(e.target.value.toUpperCase().replace(/\s/g, ''))}
        />
        <Input label="Info" value={info} error={galat.info} placeholder="Diskon 20% · min. Rp50.000" onChange={(e) => setInfo(e.target.value)} />
        <div className="flex flex-col gap-2">
          <p className="text-xs font-bold text-secondary">Tipe</p>
          <div className="flex overflow-hidden rounded-input border border-outline">
            {segmen('persen', 'Persen')}
            {segmen('potongan', 'Potongan')}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label={tipe === 'persen' ? 'Nilai (%)' : 'Nilai (Rp)'} type="number" min={0} value={nilai} error={galat.nilai} onChange={(e) => setNilai(e.target.value)} />
          <Input label="Min. belanja (Rp)" type="number" min={0} value={minBelanja} error={galat.minBelanja} onChange={(e) => setMinBelanja(e.target.value)} />
        </div>
        <Input label="Berlaku sampai (kosong = tanpa batas)" type="date" value={sampai} onChange={(e) => setSampai(e.target.value)} />
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
          <input type="checkbox" checked={aktif} onChange={(e) => setAktif(e.target.checked)} className="size-5 accent-primary" />
          Aktif
        </label>
      </form>
    </Modal>
  );
}
