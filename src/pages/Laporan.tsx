import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';
import { useState } from 'react';
import { Button, Chip, Galat, Header, Kosong, Memuat, Skeleton, SkeletonTabel, tabelCls, tdCls, thCls, trCls } from '../components/ui';
import { db } from '../firebase';
import { awalHari, rupiah, tanggal } from '../lib/format';
import { ringkas } from '../lib/laporan';
import type { Pesanan } from '../types';

const RENTANG: [hari: number, label: string][] = [
  [1, 'Hari ini'],
  [7, '7 hari'],
  [30, '30 hari'],
];

type Hasil = ReturnType<typeof ringkas>;

export default function Laporan() {
  const [hari, setHari] = useState(1);
  const [hasil, setHasil] = useState<Hasil | null>(null);
  const [status, setStatus] = useState<'awal' | 'memuat' | 'galat' | 'siap'>('awal');

  // Tidak realtime: getDocs sekali per klik "Muat" (hemat kuota).
  async function muat() {
    setStatus('memuat');
    const dari = awalHari();
    dari.setDate(dari.getDate() - (hari - 1));
    const sampai = awalHari();
    sampai.setDate(sampai.getDate() + 1);
    try {
      const snap = await getDocs(
        query(
          collection(db, 'orders'),
          where('createdAt', '>=', Timestamp.fromDate(dari)),
          where('createdAt', '<', Timestamp.fromDate(sampai)),
        ),
      );
      setHasil(ringkas(snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Pesanan), dari, hari));
      setStatus('siap');
    } catch {
      setStatus('galat');
    }
  }

  const tglBaris = (iso: string) => tanggal(new Date(`${iso}T00:00`));

  return (
    <div className="flex flex-col gap-6">
      <Header judul="Laporan">
        <div className="flex gap-2">
          {RENTANG.map(([h, l]) => (
            <Chip key={h} aktif={hari === h} onClick={() => setHari(h)}>
              {l}
            </Chip>
          ))}
        </div>
        <Button disabled={status === 'memuat'} onClick={muat}>
          {status === 'memuat' ? 'Memuat…' : 'Muat'}
        </Button>
      </Header>

      {status === 'awal' ? (
        <Kosong pesan='Pilih rentang lalu klik "Muat"' />
      ) : status === 'memuat' && !hasil ? (
        <SkeletonLaporan />
      ) : status === 'galat' ? (
        <Galat onUlang={muat} />
      ) : (
        hasil && (
          // Saat memuat ulang, data lama tetap tampil tapi diredupkan.
          <div className={`flex flex-col gap-6 transition-opacity ${status === 'memuat' ? 'pointer-events-none opacity-50' : ''}`}>
            <div className="grid gap-4 sm:grid-cols-3">
              <KartuRingkas label="Omzet" nilai={rupiah(hasil.total.omzet)} />
              <KartuRingkas label="Pesanan selesai" nilai={String(hasil.total.selesai)} />
              <KartuRingkas label="Dibatalkan" nilai={String(hasil.total.batal)} />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold">Per hari</h2>
                <div className={tabelCls}>
                  <table className="w-full">
                    <thead>
                      <tr>
                        <th className={thCls}>Tanggal</th>
                        <th className={`${thCls} text-right`}>Selesai</th>
                        <th className={`${thCls} text-right`}>Dibatalkan</th>
                        <th className={`${thCls} text-right`}>Omzet</th>
                      </tr>
                    </thead>
                    <tbody>
                      {hasil.baris.toReversed().map((b) => (
                        <tr key={b.tanggal} className={trCls}>
                          <td className={tdCls}>{tglBaris(b.tanggal)}</td>
                          <td className={`${tdCls} text-right`}>{b.selesai}</td>
                          <td className={`${tdCls} text-right`}>{b.batal}</td>
                          <td className={`${tdCls} text-right`}>{rupiah(b.omzet)}</td>
                        </tr>
                      ))}
                      <tr className="border-t border-outline">
                        <td className={`${tdCls} font-extrabold`}>Total</td>
                        <td className={`${tdCls} text-right font-extrabold`}>{hasil.total.selesai}</td>
                        <td className={`${tdCls} text-right font-extrabold`}>{hasil.total.batal}</td>
                        <td className={`${tdCls} text-right font-extrabold text-primary`}>{rupiah(hasil.total.omzet)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="flex flex-col gap-3">
                <h2 className="text-base font-extrabold">Menu terlaris</h2>
                {hasil.terlaris.length === 0 ? (
                  <Kosong pesan="Belum ada pesanan selesai" />
                ) : (
                  <div className={tabelCls}>
                    <table className="w-full">
                      <thead>
                        <tr>
                          <th className={thCls}>Menu</th>
                          <th className={`${thCls} text-right`}>Terjual</th>
                          <th className={`${thCls} text-right`}>Pendapatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {hasil.terlaris.map((m) => (
                          <tr key={m.nama} className={trCls}>
                            <td className={`${tdCls} font-bold`}>{m.nama}</td>
                            <td className={`${tdCls} text-right`}>{m.jumlah}</td>
                            <td className={`${tdCls} text-right font-extrabold text-primary`}>{rupiah(m.pendapatan)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>
          </div>
        )
      )}
    </div>
  );
}

const KartuRingkas = ({ label, nilai }: { label: string; nilai: string }) => (
  <div className="flex flex-col gap-1 rounded-card border border-divider bg-bg p-5">
    <p className="text-base font-extrabold text-primary">{label}</p>
    <p className="text-2xl font-extrabold">{nilai}</p>
  </div>
);

const SkeletonLaporan = () => (
  <Memuat className="flex flex-col gap-6">
    <div className="grid gap-4 sm:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="flex flex-col gap-2 rounded-card border border-divider p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-7 w-32" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-extrabold">Per hari</h2>
        <SkeletonTabel kolom={['Tanggal', 'Selesai', 'Dibatalkan', 'Omzet']} kanan={[1, 2, 3]} baris={4} />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-extrabold">Menu terlaris</h2>
        <SkeletonTabel kolom={['Menu', 'Terjual', 'Pendapatan']} kanan={[1, 2]} baris={5} />
      </section>
    </div>
  </Memuat>
);
