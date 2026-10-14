import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '../components/Toast';
import { Badge, Galat, Header, Kosong, SkeletonTabel, tabelCls, tdCls, thCls, Thumb, Toggle, trCls } from '../components/ui';
import { db } from '../firebase';
import { rupiah } from '../lib/format';
import { useProduk } from '../lib/useProduk';
import { KATEGORI, type Produk } from '../types';

export default function Stok() {
  const toast = useToast();
  const { produk, galat, muatUlang } = useProduk();

  // Hanya field `habis` (staf diizinkan rules hanya untuk field ini).
  async function ubahHabis(p: Produk, tersedia: boolean) {
    try {
      await updateDoc(doc(db, 'products', p.id), { habis: !tersedia });
      toast(`${p.nama} ${tersedia ? 'tersedia' : 'habis'}`);
    } catch {
      toast('Gagal menyimpan. Coba lagi.');
    }
  }

  return (
    <div>
      <Header judul="Stok" sub="Tandai menu yang habis agar tidak bisa dipesan." />
      {galat ? (
        <Galat onUlang={muatUlang} />
      ) : !produk ? (
        <SkeletonTabel kolom={['Menu', 'Harga', 'Tersedia']} kanan={[1, 2]} awal="thumbNama" baris={8} />
      ) : produk.length === 0 ? (
        <Kosong pesan="Belum ada menu" />
      ) : (
        <div className={tabelCls}>
          <table className="w-full">
            <thead>
              <tr>
                <th className={thCls}>Menu</th>
                <th className={`${thCls} text-right`}>Harga</th>
                <th className={`${thCls} w-40 text-right`}>Tersedia</th>
              </tr>
            </thead>
            {KATEGORI.map((k) => {
              const isi = produk.filter((p) => p.kategori === k);
              if (!isi.length) return null;
              return (
                <tbody key={k}>
                  <tr className="border-b border-divider">
                    <td colSpan={3} className="bg-bg px-4 pt-4 pb-2 text-base font-extrabold">
                      {k}
                    </td>
                  </tr>
                  {isi.map((p) => (
                    <tr key={p.id} className={trCls}>
                      <td className={tdCls}>
                        <div className={`flex items-center gap-3 ${p.habis ? 'opacity-60' : ''}`}>
                          <Thumb url={p.gambarUrl} />
                          <span className="font-bold">{p.nama}</span>
                          {p.habis && <Badge className="bg-ink text-white">Habis</Badge>}
                        </div>
                      </td>
                      <td className={`${tdCls} text-right font-extrabold text-primary ${p.habis ? 'opacity-60' : ''}`}>
                        {rupiah(p.harga)}
                      </td>
                      <td className={`${tdCls} text-right`}>
                        <Toggle aktif={!p.habis} label={`${p.nama} tersedia`} onChange={(v) => ubahHabis(p, v)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              );
            })}
          </table>
        </div>
      )}
    </div>
  );
}
