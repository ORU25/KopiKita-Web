import { collection, doc, getDocs, limit, orderBy, query, updateDoc, where } from 'firebase/firestore';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useToast } from '../components/Toast';
import {
  Avatar,
  Button,
  Galat,
  Header,
  inputCls,
  Konfirmasi,
  Kosong,
  Memuat,
  Skeleton,
  SkeletonTabel,
  Modal,
  tabelCls,
  tdCls,
  thCls,
  trCls,
} from '../components/ui';
import { db } from '../firebase';
import { useAuth } from '../lib/useAuth';
import type { Role, UserDoc, Voucher } from '../types';

const ROLE_LABEL: Record<Role, string> = { pelanggan: 'Pelanggan', staf: 'Staf', admin: 'Admin' };

export default function Pengguna() {
  const toast = useToast();
  const { profil } = useAuth();
  const [pengguna, setPengguna] = useState<UserDoc[] | null>(null);
  const [galat, setGalat] = useState(false);
  const [ulang, setUlang] = useState(0);
  const [cari, setCari] = useState('');
  const [ubahRole, setUbahRole] = useState<{ u: UserDoc; role: Role } | null>(null);
  const [aturVoucher, setAturVoucher] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(false);

  // Tidak perlu realtime: getDocs sekali, ubah state lokal setelah menulis.
  useEffect(() => {
    getDocs(query(collection(db, 'users'), orderBy('nama'), limit(200)))
      .then((s) => setPengguna(s.docs.map((d) => ({ id: d.id, ...d.data() }) as UserDoc)))
      .catch(() => setGalat(true));
  }, [ulang]);

  const perbarui = (id: string, data: Partial<UserDoc>) =>
    setPengguna((ps) => ps?.map((p) => (p.id === id ? { ...p, ...data } : p)) ?? ps);

  async function simpanRole() {
    if (!ubahRole) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', ubahRole.u.id), { role: ubahRole.role });
      perbarui(ubahRole.u.id, { role: ubahRole.role });
      toast(`${ubahRole.u.nama} sekarang ${ROLE_LABEL[ubahRole.role]}`);
      setUbahRole(null);
    } catch {
      toast('Gagal mengubah role. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  const k = cari.trim().toLowerCase();
  const tampil = pengguna?.filter((u) => !k || u.nama.toLowerCase().includes(k) || u.email.toLowerCase().includes(k)) ?? [];

  return (
    <div>
      <Header judul="Pengguna">
        <div className="relative w-72 max-w-full">
          <Search size={18} className="absolute top-3 left-4 text-muted" />
          <input
            type="search"
            aria-label="Cari pengguna"
            placeholder="Cari nama atau email"
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            className={`${inputCls} pl-11`}
          />
        </div>
      </Header>

      {galat ? (
        <Galat onUlang={() => (setGalat(false), setUlang((x) => x + 1))} />
      ) : !pengguna ? (
        <SkeletonTabel kolom={['Pengguna', 'Role', 'Voucher', 'Aksi']} kanan={[2, 3]} sembunyi={[2]} awal="avatar" baris={5} />
      ) : tampil.length === 0 ? (
        <Kosong pesan={k ? 'Tidak ada pengguna yang cocok' : 'Belum ada pengguna'} />
      ) : (
        <div className={tabelCls}>
          <table className="w-full">
            <thead>
              <tr>
                <th className={thCls}>Pengguna</th>
                <th className={thCls}>Role</th>
                <th className={`${thCls} text-right max-md:hidden`}>Voucher</th>
                <th className={`${thCls} text-right`}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tampil.map((u) => (
                <tr key={u.id} className={trCls}>
                  <td className={tdCls}>
                    <div className="flex items-center gap-3">
                      <Avatar nama={u.nama} size={32} />
                      <div className="min-w-0">
                        <p className="font-bold">{u.nama}</p>
                        <p className="text-xs font-medium text-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className={tdCls}>
                    <select
                      aria-label={`Role ${u.nama}`}
                      value={u.role}
                      // Admin tidak bisa menurunkan dirinya sendiri.
                      disabled={u.id === profil?.id}
                      onChange={(e) => setUbahRole({ u, role: e.target.value as Role })}
                      className={`${inputCls} w-40 min-w-36`}
                    >
                      {Object.entries(ROLE_LABEL).map(([r, l]) => (
                        <option key={r} value={r}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className={`${tdCls} text-right max-md:hidden`}>{u.voucher?.length ?? 0}</td>
                  <td className={`${tdCls} text-right`}>
                    <Button varian="sekunder" onClick={() => setAturVoucher(u)}>
                      Atur voucher
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ubahRole && (
        <Konfirmasi
          judul={`Jadikan ${ubahRole.u.nama} sebagai ${ROLE_LABEL[ubahRole.role]}?`}
          pesan={
            ubahRole.role === 'pelanggan'
              ? 'Pengguna ini tidak akan bisa masuk ke dasbor lagi.'
              : ubahRole.role === 'admin'
                ? 'Admin bisa mengubah menu, voucher, dan role pengguna lain.'
                : 'Staf bisa mengelola antrean dan stok.'
          }
          label="Ya, ubah"
          loading={loading}
          onYa={simpanRole}
          onClose={() => setUbahRole(null)}
        />
      )}
      {aturVoucher && (
        <ModalVoucher
          u={aturVoucher}
          onClose={() => setAturVoucher(null)}
          onSimpan={(voucher) => perbarui(aturVoucher.id, { voucher })}
        />
      )}
    </div>
  );
}

function ModalVoucher({ u, onClose, onSimpan }: { u: UserDoc; onClose: () => void; onSimpan: (v: string[]) => void }) {
  const toast = useToast();
  const [daftar, setDaftar] = useState<Voucher[] | null>(null);
  const [dipilih, setDipilih] = useState<Set<string>>(new Set(u.voucher ?? []));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getDocs(query(collection(db, 'vouchers'), where('aktif', '==', true)))
      .then((s) => setDaftar(s.docs.map((d) => ({ id: d.id, ...d.data() }) as Voucher)))
      .catch(() => setDaftar([]));
  }, []);

  function pilih(kode: string, ya: boolean) {
    const n = new Set(dipilih);
    if (ya) n.add(kode);
    else n.delete(kode);
    setDipilih(n);
  }

  async function simpan() {
    setLoading(true);
    try {
      const voucher = [...dipilih];
      await updateDoc(doc(db, 'users', u.id), { voucher });
      onSimpan(voucher);
      toast('Tersimpan');
      onClose();
    } catch {
      toast('Gagal menyimpan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      judul={`Voucher ${u.nama}`}
      onClose={onClose}
      footer={
        <>
          <Button varian="sekunder" onClick={onClose}>
            Batal
          </Button>
          <Button loading={loading} disabled={!daftar} onClick={simpan}>
            Simpan
          </Button>
        </>
      }
    >
      {!daftar ? (
        <Memuat className="flex flex-col">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex min-h-11 items-center gap-3 px-2 py-2">
              <Skeleton className="size-5 shrink-0 rounded" />
              <div className="flex flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </Memuat>
      ) : daftar.length === 0 ? (
        <Kosong pesan="Belum ada voucher aktif" />
      ) : (
        <div className="flex flex-col">
          {daftar.map((v) => (
            <label key={v.id} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-input px-2 py-2 hover:bg-ink/4">
              <input
                type="checkbox"
                checked={dipilih.has(v.id)}
                onChange={(e) => pilih(v.id, e.target.checked)}
                className="size-5 shrink-0 accent-primary"
              />
              <span>
                <span className="block text-sm font-extrabold text-primary">{v.id}</span>
                <span className="block text-xs text-muted">{v.info}</span>
              </span>
            </label>
          ))}
        </div>
      )}
    </Modal>
  );
}
