import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
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
  Select,
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
const PER_HALAMAN = 50;

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
  const [vouchers, setVouchers] = useState<Voucher[] | null>(null);
  // Kursor pagination: dokumen terakhir yang sudah dimuat; null = tidak ada halaman berikutnya.
  const [kursor, setKursor] = useState<QueryDocumentSnapshot | null>(null);
  const [memuatLagi, setMemuatLagi] = useState(false);

  // Ambil PER_HALAMAN + 1 dokumen: kelebihan satu menandakan masih ada halaman berikutnya.
  async function ambil(setelah?: QueryDocumentSnapshot) {
    const q = query(collection(db, 'users'), orderBy('nama'), ...(setelah ? [startAfter(setelah)] : []), limit(PER_HALAMAN + 1));
    const docs = (await getDocs(q)).docs;
    const halaman = docs.slice(0, PER_HALAMAN);
    return {
      users: halaman.map((d) => ({ id: d.id, ...d.data() }) as UserDoc),
      kursor: docs.length > PER_HALAMAN ? halaman[halaman.length - 1] : null,
    };
  }

  // Tidak perlu realtime: getDocs sekali, ubah state lokal setelah menulis.
  useEffect(() => {
    Promise.all([ambil(), getDocs(collection(db, 'vouchers'))])
      .then(([u, v]) => {
        setPengguna(u.users);
        setKursor(u.kursor);
        setVouchers(v.docs.map((d) => ({ id: d.id, ...d.data() }) as Voucher));
      })
      .catch(() => setGalat(true));
  }, [ulang]);

  async function muatLagi() {
    if (!kursor) return;
    setMemuatLagi(true);
    try {
      const baru = await ambil(kursor);
      setPengguna((ps) => [...(ps ?? []), ...baru.users]);
      setKursor(baru.kursor);
    } catch {
      toast('Gagal memuat pengguna. Coba lagi.');
    } finally {
      setMemuatLagi(false);
    }
  }

  // Kode yang vouchernya sudah dihapus tidak dihitung (data lama sebelum hapus ikut mencabut).
  const ada = new Set(vouchers?.map((v) => v.id));
  const jumlahVoucher = (u: UserDoc) => (u.voucher ?? []).filter((k) => ada.has(k)).length;

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
                <th className={`${thCls} w-44`}>Role</th>
                <th className={`${thCls} w-24 text-right max-md:hidden`}>Voucher</th>
                <th className={`${thCls} w-36 text-right`}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tampil.map((u) => (
                <tr key={u.id} className={trCls}>
                  <td className={`${tdCls} py-2`}>
                    <div className="flex items-center gap-3">
                      <Avatar nama={u.nama} foto={u.fotoUrl} size={40} />
                      <div className="min-w-0">
                        <p className="truncate font-bold">
                          {u.nama}
                          {u.id === profil?.id && <span className="ml-2 text-xs font-semibold text-muted">(Anda)</span>}
                        </p>
                        <p className="max-w-64 truncate text-xs font-medium text-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className={tdCls}>
                    <Select
                      aria-label={`Role ${u.nama}`}
                      value={u.role}
                      // Admin tidak bisa menurunkan dirinya sendiri.
                      disabled={u.id === profil?.id}
                      onChange={(e) => setUbahRole({ u, role: e.target.value as Role })}
                      className="w-36"
                    >
                      {Object.entries(ROLE_LABEL).map(([r, l]) => (
                        <option key={r} value={r}>
                          {l}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className={`${tdCls} text-right tabular-nums max-md:hidden`}>{jumlahVoucher(u)}</td>
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

      {pengguna && kursor && (
        <div className="mt-4 flex flex-col items-center gap-2">
          {k && <p className="text-xs text-muted">Pencarian hanya di {pengguna.length} pengguna yang sudah dimuat.</p>}
          <Button varian="sekunder" disabled={memuatLagi} onClick={muatLagi}>
            {memuatLagi ? 'Memuat…' : 'Muat lebih banyak'}
          </Button>
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
          daftar={vouchers ?? []}
          onClose={() => setAturVoucher(null)}
          onSimpan={(voucher) => perbarui(aturVoucher.id, { voucher })}
        />
      )}
    </div>
  );
}

function ModalVoucher({
  u,
  daftar: semua,
  onClose,
  onSimpan,
}: {
  u: UserDoc;
  daftar: Voucher[];
  onClose: () => void;
  onSimpan: (v: string[]) => void;
}) {
  const toast = useToast();
  // Voucher aktif + voucher nonaktif yang masih dimiliki (agar bisa dicabut).
  const daftar = semua.filter((v) => v.aktif || u.voucher?.includes(v.id));
  // Hanya kode yang vouchernya masih ada: kode yatim terbuang saat disimpan.
  const [dipilih, setDipilih] = useState<Set<string>>(new Set(u.voucher?.filter((k) => semua.some((v) => v.id === k))));
  const [loading, setLoading] = useState(false);

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
          <Button loading={loading} onClick={simpan}>
            Simpan
          </Button>
        </>
      }
    >
      {daftar.length === 0 ? (
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
                <span className="block text-sm font-extrabold text-primary">
                  {v.id}
                  {!v.aktif && <span className="ml-2 text-xs font-semibold text-muted">Nonaktif</span>}
                </span>
                <span className="block text-xs text-muted">{v.info}</span>
              </span>
            </label>
          ))}
        </div>
      )}
    </Modal>
  );
}
