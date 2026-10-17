import { deleteDoc, doc, getDoc, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { ImagePlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';
import { useToast } from '../components/Toast';
import {
  Button,
  Chip,
  Field,
  Galat,
  Header,
  Input,
  inputCls,
  Konfirmasi,
  Kosong,
  Memuat,
  Modal,
  Select,
  Skeleton,
  SkeletonTabel,
  tabelCls,
  tdCls,
  thCls,
  Thumb,
  Toggle,
  trCls,
} from '../components/ui';
import { db } from '../firebase';
import { cekFoto, TIPE_FOTO, uploadFoto } from '../lib/cloudinary';
import { rupiah } from '../lib/format';
import { useProduk } from '../lib/useProduk';
import { KATEGORI, opsiProduk, SUHU, type ConfigMenu, type Kategori, type Produk, type Suhu } from '../types';

// "Kopi Susu Kita" → "kopi-susu-kita" (sama dengan id hasil seed)
const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const ikonBtn = 'inline-flex size-11 cursor-pointer items-center justify-center rounded-btn hover:bg-ink/4 disabled:cursor-not-allowed disabled:opacity-40';

// Katalog kustomisasi config/menu: dibaca sekali (bukan realtime), dipakai modal menu & panel katalog.
function useConfigMenu() {
  const [config, setConfig] = useState<ConfigMenu | null>(null);
  const [galat, setGalat] = useState(false);
  const [ulang, setUlang] = useState(0);

  useEffect(() => {
    getDoc(doc(db, 'config', 'menu'))
      .then((s) => {
        const d = s.data() ?? {};
        setConfig({ hargaLarge: d.hargaLarge ?? 4000, pajak: d.pajak ?? 0.1, addOn: d.addOn ?? {} });
      })
      .catch(() => setGalat(true));
  }, [ulang]);

  return { config, setConfig, galat, muatUlang: () => (setGalat(false), setUlang((x) => x + 1)) };
}

export default function Menu() {
  const toast = useToast();
  const { produk, galat, muatUlang } = useProduk();
  const cfg = useConfigMenu();
  const [filter, setFilter] = useState<Kategori | null>(null);
  const [form, setForm] = useState<Produk | 'baru' | null>(null);
  const [hapus, setHapus] = useState<Produk | null>(null);
  const [menghapus, setMenghapus] = useState(false);

  async function ubah(p: Produk, data: Partial<Produk>) {
    try {
      await updateDoc(doc(db, 'products', p.id), data);
      toast('Tersimpan');
    } catch {
      toast('Gagal menyimpan. Coba lagi.');
    }
  }

  async function hapusProduk(p: Produk) {
    setMenghapus(true);
    try {
      await deleteDoc(doc(db, 'products', p.id));
      toast(`${p.nama} dihapus`);
      setHapus(null);
    } catch {
      toast('Gagal menghapus. Coba lagi.');
    } finally {
      setMenghapus(false);
    }
  }

  const tampil = produk?.filter((p) => !filter || p.kategori === filter) ?? [];
  // Modal butuh katalog add-on; tunggu config/menu dimuat dulu.
  const bisaForm = !!cfg.config;

  return (
    <div className="flex flex-col gap-6">
      <Header judul="Menu">
        <Button disabled={!bisaForm} onClick={() => setForm('baru')}>
          <Plus size={18} /> Tambah menu
        </Button>
      </Header>

      <div className="-mt-4 flex flex-wrap gap-2">
        <Chip aktif={!filter} onClick={() => setFilter(null)}>
          Semua
        </Chip>
        {KATEGORI.map((k) => (
          <Chip key={k} aktif={filter === k} onClick={() => setFilter(k)}>
            {k}
          </Chip>
        ))}
      </div>

      {galat ? (
        <Galat onUlang={muatUlang} />
      ) : !produk ? (
        <SkeletonTabel kolom={['Foto', 'Nama', 'Kategori', 'Harga', 'Rekomendasi', 'Habis', 'Urutan', 'Aksi']} kanan={[3, 6, 7]} sembunyi={[2, 6]} awal="thumb" baris={8} />
      ) : tampil.length === 0 ? (
        <Kosong pesan="Belum ada menu" />
      ) : (
        <div className={tabelCls}>
          <table className="w-full">
            <thead>
              <tr>
                <th className={thCls}>Foto</th>
                <th className={thCls}>Nama</th>
                <th className={`${thCls} max-md:hidden`}>Kategori</th>
                <th className={`${thCls} text-right`}>Harga</th>
                <th className={`${thCls} text-center`}>Rekomendasi</th>
                <th className={`${thCls} text-center`}>Habis</th>
                <th className={`${thCls} text-right max-md:hidden`}>Urutan</th>
                <th className={`${thCls} text-right`}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {tampil.map((p) => (
                <tr key={p.id} className={trCls}>
                  <td className={tdCls}>
                    <Thumb url={p.gambarUrl} />
                  </td>
                  <td className={`${tdCls} max-w-72 min-w-40`}>
                    <p className="font-bold">{p.nama}</p>
                    <p className="truncate text-xs font-medium text-muted">{p.deskripsi}</p>
                  </td>
                  <td className={`${tdCls} max-md:hidden`}>{p.kategori}</td>
                  <td className={`${tdCls} text-right font-extrabold text-primary`}>{rupiah(p.harga)}</td>
                  <td className={`${tdCls} text-center`}>
                    <Toggle aktif={p.rekomendasi} label={`${p.nama} rekomendasi`} onChange={(v) => ubah(p, { rekomendasi: v })} />
                  </td>
                  <td className={`${tdCls} text-center`}>
                    <Toggle aktif={p.habis} label={`${p.nama} habis`} onChange={(v) => ubah(p, { habis: v })} />
                  </td>
                  <td className={`${tdCls} text-right max-md:hidden`}>{p.urutan}</td>
                  <td className={`${tdCls} text-right whitespace-nowrap`}>
                    <button
                      type="button"
                      className={`${ikonBtn} text-secondary`}
                      title="Edit"
                      aria-label={`Edit ${p.nama}`}
                      disabled={!bisaForm}
                      onClick={() => setForm(p)}
                    >
                      <Pencil size={18} strokeWidth={1.8} />
                    </button>
                    <button type="button" className={`${ikonBtn} text-danger`} title="Hapus" aria-label={`Hapus ${p.nama}`} onClick={() => setHapus(p)}>
                      <Trash2 size={18} strokeWidth={1.8} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <KustomisasiMinuman config={cfg.config} galat={cfg.galat} muatUlang={cfg.muatUlang} produk={produk ?? []} onTersimpan={cfg.setConfig} />

      {form && cfg.config && (
        <FormMenu
          awal={form === 'baru' ? null : form}
          config={cfg.config}
          urutanBaru={Math.max(0, ...(produk ?? []).map((p) => p.urutan)) + 1}
          onClose={() => setForm(null)}
        />
      )}
      {hapus && (
        <Konfirmasi
          judul={`Hapus ${hapus.nama} dari menu?`}
          pesan="Menu ini tidak akan tampil lagi di aplikasi pelanggan."
          label="Hapus"
          bahaya
          loading={menghapus}
          onYa={() => hapusProduk(hapus)}
          onClose={() => setHapus(null)}
        />
      )}
    </div>
  );
}

// Checkbox dengan area klik ≥ 44
function Cek({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: ReactNode }) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm font-semibold">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="size-5 shrink-0 accent-primary" />
      <span>{children}</span>
    </label>
  );
}

interface FormMenuProps {
  awal: Produk | null;
  config: ConfigMenu;
  urutanBaru: number;
  onClose: () => void;
}

function FormMenu({ awal, config, urutanBaru, onClose }: FormMenuProps) {
  const toast = useToast();
  const katalog = daftarAddOn(config);
  const opsi = opsiProduk(awal ?? { kategori: 'Kopi' }, katalog);
  const [nama, setNama] = useState(awal?.nama ?? '');
  const [deskripsi, setDeskripsi] = useState(awal?.deskripsi ?? '');
  const [kategori, setKategori] = useState<Kategori>(awal?.kategori ?? 'Kopi');
  const [harga, setHarga] = useState(String(awal?.harga ?? ''));
  const [urutan, setUrutan] = useState(String(awal?.urutan ?? urutanBaru));
  const [rekomendasi, setRekomendasi] = useState(awal?.rekomendasi ?? false);
  const [suhu, setSuhu] = useState<Suhu[]>(opsi.suhu.length ? opsi.suhu : SUHU);
  const [bisaLarge, setBisaLarge] = useState(awal ? opsi.bisaLarge : true);
  const [addOn, setAddOn] = useState<string[]>(opsi.addOn);
  const [file, setFile] = useState<File | null>(null);
  const [pratinjau, setPratinjau] = useState(awal?.gambarUrl ?? '');
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const makanan = kategori === 'Makanan';

  // Bebaskan object URL pratinjau lama.
  useEffect(() => () => void (pratinjau.startsWith('blob:') && URL.revokeObjectURL(pratinjau)), [pratinjau]);

  function pilihFoto(f: File | undefined) {
    if (!f) return;
    const salah = cekFoto(f);
    setGalat((g) => ({ ...g, foto: salah ?? '' }));
    if (salah) return;
    setFile(f);
    setPratinjau(URL.createObjectURL(f));
  }

  const pilih = <T,>(daftar: T[], x: T, ya: boolean) => (ya ? [...daftar, x] : daftar.filter((d) => d !== x));

  async function simpan(e: FormEvent) {
    e.preventDefault();
    const g: Record<string, string> = {};
    const nHarga = Number(harga);
    const nUrutan = Number(urutan);
    if (!nama.trim()) g.nama = 'Nama wajib diisi.';
    if (!Number.isInteger(nHarga) || nHarga <= 0) g.harga = 'Harga harus angka bulat lebih dari 0.';
    if (!Number.isInteger(nUrutan)) g.urutan = 'Urutan harus angka bulat.';
    if (!makanan && suhu.length === 0) g.suhu = 'Pilih minimal satu suhu.';
    setGalat(g);
    if (Object.keys(g).length) return;

    setLoading(true);
    try {
      const id = awal?.id ?? slug(nama);
      const ref = doc(db, 'products', id);
      if (!awal && (await getDoc(ref)).exists()) {
        setGalat({ nama: 'Menu dengan nama ini sudah ada.' });
        return;
      }
      // Unggah foto dulu (bila diganti), baru tulis dokumen.
      const gambarUrl = file ? await uploadFoto(file) : (awal?.gambarUrl ?? '');
      const data = {
        nama: nama.trim(),
        deskripsi: deskripsi.trim(),
        harga: nHarga,
        kategori,
        gambarUrl,
        rekomendasi,
        urutan: nUrutan,
        // Kustomisasi selalu ditulis eksplisit; urutan mengikuti SUHU & katalog.
        suhu: makanan ? [] : SUHU.filter((s) => suhu.includes(s)),
        bisaLarge: !makanan && bisaLarge,
        addOn: makanan ? [] : katalog.filter((a) => addOn.includes(a)),
      };
      if (awal) await updateDoc(ref, data);
      else await setDoc(ref, { ...data, habis: false });
      toast('Tersimpan');
      onClose();
    } catch (err) {
      toast(err instanceof Error && err.message ? err.message : 'Gagal menyimpan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      judul={awal ? 'Edit menu' : 'Tambah menu'}
      onClose={onClose}
      footer={
        <>
          <Button varian="sekunder" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form="form-menu" loading={loading}>
            Simpan
          </Button>
        </>
      }
    >
      <form id="form-menu" onSubmit={simpan} className="flex flex-col gap-4">
        <Field label="Foto" error={galat.foto}>
          {(id) => (
            <label
              htmlFor={id}
              className="flex size-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-thumb border border-dashed border-outline bg-ink/4 text-muted"
            >
              {pratinjau ? <img src={pratinjau} alt="" className="size-full object-cover" /> : <ImagePlus size={28} strokeWidth={1.8} />}
              <input id={id} type="file" accept={TIPE_FOTO.join(',')} className="sr-only" onChange={(e) => pilihFoto(e.target.files?.[0])} />
            </label>
          )}
        </Field>
        <p className="-mt-2 text-xs text-muted">JPG, PNG, atau WEBP · maks. 2 MB</p>
        <Input label="Nama" value={nama} error={galat.nama} onChange={(e) => setNama(e.target.value)} />
        <Field label="Deskripsi">
          {(id) => (
            <textarea id={id} rows={2} value={deskripsi} onChange={(e) => setDeskripsi(e.target.value)} className={`${inputCls} h-auto py-3`} />
          )}
        </Field>
        <Field label="Kategori">
          {(id) => (
            <Select id={id} value={kategori} onChange={(e) => setKategori(e.target.value as Kategori)}>
              {KATEGORI.map((k) => (
                <option key={k}>{k}</option>
              ))}
            </Select>
          )}
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Harga (Rp)" type="number" min={0} step={500} value={harga} error={galat.harga} onChange={(e) => setHarga(e.target.value)} />
          <Input label="Urutan" type="number" value={urutan} error={galat.urutan} onChange={(e) => setUrutan(e.target.value)} />
        </div>
        <Cek checked={rekomendasi} onChange={setRekomendasi}>
          Rekomendasi
        </Cek>

        <div className="flex flex-col gap-3 border-t border-divider pt-4">
          <div>
            <h3 className="text-base font-extrabold">Kustomisasi</h3>
            <p className="text-xs text-muted">Pilihan yang muncul di aplikasi saat pelanggan memesan menu ini.</p>
          </div>

          {makanan ? (
            <p className="text-[13px] text-muted">Makanan tidak punya pilihan kustomisasi. Pelanggan tetap bisa menulis catatan.</p>
          ) : (
            <>
              <div className="flex flex-col">
                <p className="text-xs font-bold text-secondary">Suhu</p>
                <div className="flex gap-6">
                  {SUHU.map((s) => (
                    <Cek key={s} checked={suhu.includes(s)} onChange={(v) => setSuhu(pilih(suhu, s, v))}>
                      {s}
                    </Cek>
                  ))}
                </div>
                {galat.suhu && <p className="text-xs font-semibold text-danger">{galat.suhu}</p>}
              </div>
              <div className="flex flex-col">
                <p className="text-xs font-bold text-secondary">Ukuran</p>
                <Cek checked={bisaLarge} onChange={setBisaLarge}>
                  Ada ukuran Large <span className="font-medium text-muted">(+{rupiah(config.hargaLarge)})</span>
                </Cek>
              </div>
              <div className="flex flex-col">
                <p className="text-xs font-bold text-secondary">Add-on</p>
                {katalog.length === 0 ? (
                  <p className="py-2 text-[13px] text-muted">Katalog add-on masih kosong. Tambahkan lewat kartu "Katalog add-on minuman".</p>
                ) : (
                  <div className="grid gap-x-4 sm:grid-cols-2">
                    {katalog.map((a) => (
                      <Cek key={a} checked={addOn.includes(a)} onChange={(v) => setAddOn(pilih(addOn, a, v))}>
                        {a} <span className="font-medium text-muted">+{rupiah(config.addOn[a])}</span>
                      </Cek>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted">Level gula dan level es (bila Es) selalu tersedia untuk minuman.</p>
            </>
          )}
        </div>
      </form>
    </Modal>
  );
}

// ---------- Kustomisasi minuman (config/menu) ----------
// Katalog add-on diurutkan abjad supaya tampilannya stabil (urutan field map Firestore tidak dijamin).
const daftarAddOn = (c: ConfigMenu) => Object.keys(c.addOn).sort((a, b) => a.localeCompare(b, 'id'));

// Tulis katalog + daftar add-on menu yang terdampak dalam satu batch.
async function simpanKatalog(c: ConfigMenu, ubahProduk: [Produk, string[]][] = []) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'config', 'menu'), c);
  for (const [p, addOn] of ubahProduk) batch.update(doc(db, 'products', p.id), { addOn });
  await batch.commit();
}

// Input dengan awalan/akhiran ("Rp", "%")
function InputAfiks({ label, awalan, akhiran, ...rest }: InputHTMLAttributes<HTMLInputElement> & { label: string; awalan?: string; akhiran?: string }) {
  const afiks = 'pointer-events-none absolute top-1/2 -translate-y-1/2 text-sm font-semibold text-muted';
  return (
    <div className="relative">
      {awalan && <span className={`${afiks} left-4`}>{awalan}</span>}
      <input aria-label={label} className={`${inputCls} ${awalan ? 'pl-11' : ''} ${akhiran ? 'pr-10' : ''}`} {...rest} />
      {akhiran && <span className={`${afiks} right-4`}>{akhiran}</span>}
    </div>
  );
}

const bulat = (s: string) => s.trim() !== '' && Number.isInteger(Number(s)) && Number(s) >= 0;

function Kartu({ judul, sub, aksi, children }: { judul: string; sub: string; aksi?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col overflow-hidden rounded-card border border-divider bg-bg">
      <header className="flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-divider px-5 py-3">
        <div>
          <h3 className="text-base font-extrabold">{judul}</h3>
          <p className="text-[13px] font-medium text-muted">{sub}</p>
        </div>
        {aksi}
      </header>
      {children}
    </section>
  );
}

interface KustomisasiProps {
  config: ConfigMenu | null;
  galat: boolean;
  muatUlang: () => void;
  produk: Produk[];
  onTersimpan: (c: ConfigMenu) => void;
}

function KustomisasiMinuman({ config, galat, muatUlang, produk, onTersimpan }: KustomisasiProps) {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-extrabold">Kustomisasi minuman</h2>
        <p className="text-[13px] font-medium text-muted">
          Berlaku untuk semua minuman. Pilihan per menu (suhu, Large, add-on) diatur lewat tombol Edit di tabel.
        </p>
      </div>
      {galat ? (
        <Galat onUlang={muatUlang} />
      ) : (
        <div className="grid items-start gap-4 xl:grid-cols-[320px_1fr]">
          {config ? (
            <>
              <KartuHarga key={`${config.hargaLarge}-${config.pajak}`} config={config} onTersimpan={onTersimpan} />
              <KartuAddOn config={config} produk={produk} onTersimpan={onTersimpan} />
            </>
          ) : (
            <>
              <Kartu judul="Ukuran & pajak" sub="Tambahan harga Large dan pajak pesanan.">
                <Memuat className="flex flex-col gap-4 p-5">
                  {[0, 1].map((i) => (
                    <div key={i} className="flex flex-col gap-2">
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-11 rounded-input" />
                    </div>
                  ))}
                </Memuat>
              </Kartu>
              <SkeletonTabel kolom={['Add-on', 'Harga', 'Dipakai di', 'Aksi']} kanan={[1, 2, 3]} baris={3} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function KartuHarga({ config, onTersimpan }: { config: ConfigMenu; onTersimpan: (c: ConfigMenu) => void }) {
  const toast = useToast();
  const [large, setLarge] = useState(String(config.hargaLarge));
  const [pajak, setPajak] = useState(String(Math.round(config.pajak * 100)));
  const [galat, setGalat] = useState('');
  const [loading, setLoading] = useState(false);
  const berubah = Number(large) !== config.hargaLarge || Number(pajak) !== Math.round(config.pajak * 100);

  async function simpan(e: FormEvent) {
    e.preventDefault();
    const salah = !bulat(large) ? 'Harga Large harus angka bulat ≥ 0.' : !bulat(pajak) || Number(pajak) > 100 ? 'Pajak harus 0–100%.' : '';
    setGalat(salah);
    if (salah) return;
    setLoading(true);
    try {
      const c = { ...config, hargaLarge: Number(large), pajak: Number(pajak) / 100 };
      await simpanKatalog(c);
      toast('Tersimpan');
      onTersimpan(c);
    } catch {
      toast('Gagal menyimpan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Kartu judul="Ukuran & pajak" sub="Tambahan harga Large dan pajak pesanan.">
      <form onSubmit={simpan} className="flex flex-col gap-4 p-5">
        <Field label="Tambahan harga ukuran Large">
          {(id) => (
            <InputAfiks id={id} label="Tambahan harga Large" awalan="Rp" type="number" min={0} step={500} value={large} onChange={(e) => (setLarge(e.target.value), setGalat(''))} />
          )}
        </Field>
        <Field label="Pajak" error={galat}>
          {(id) => (
            <InputAfiks id={id} label="Pajak" akhiran="%" type="number" min={0} max={100} value={pajak} onChange={(e) => (setPajak(e.target.value), setGalat(''))} />
          )}
        </Field>
        <Button type="submit" className="self-end" loading={loading} disabled={!berubah}>
          Simpan
        </Button>
      </form>
    </Kartu>
  );
}

function KartuAddOn({ config, produk, onTersimpan }: { config: ConfigMenu; produk: Produk[]; onTersimpan: (c: ConfigMenu) => void }) {
  const toast = useToast();
  const [form, setForm] = useState<string | null>(null); // nama add-on yang diedit, '' = tambah baru
  const [hapus, setHapus] = useState<string | null>(null);
  const [menghapus, setMenghapus] = useState(false);
  const katalog = daftarAddOn(config);
  const minuman = produk.filter((p) => p.kategori !== 'Makanan');
  const pemakai = (nama: string) => minuman.filter((p) => opsiProduk(p, katalog).addOn.includes(nama));

  async function hapusAddOn(nama: string) {
    setMenghapus(true);
    try {
      const c = { ...config, addOn: Object.fromEntries(Object.entries(config.addOn).filter(([a]) => a !== nama)) };
      // Menu yang memilih add-on ini secara eksplisit: lepaskan dari daftarnya.
      const terdampak = produk
        .filter((p) => p.addOn?.includes(nama))
        .map((p): [Produk, string[]] => [p, (p.addOn ?? []).filter((a) => a !== nama)]);
      await simpanKatalog(c, terdampak);
      toast(`${nama} dihapus`);
      setHapus(null);
      onTersimpan(c);
    } catch {
      toast('Gagal menghapus. Coba lagi.');
    } finally {
      setMenghapus(false);
    }
  }

  const dipakaiHapus = hapus ? pemakai(hapus) : [];

  return (
    <Kartu
      judul="Katalog add-on minuman"
      sub="Harga berlaku untuk semua minuman yang memakai add-on ini."
      aksi={
        <Button varian="sekunder" onClick={() => setForm('')}>
          <Plus size={18} /> Tambah add-on
        </Button>
      }
    >
      {katalog.length === 0 ? (
        <Kosong pesan="Belum ada add-on" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className={thCls}>Add-on</th>
                <th className={`${thCls} text-right`}>Harga</th>
                <th className={`${thCls} text-right`}>Dipakai di</th>
                <th className={`${thCls} text-right`}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {katalog.map((a) => {
                const dipakai = pemakai(a);
                return (
                  <tr key={a} className={trCls}>
                    <td className={`${tdCls} font-bold`}>{a}</td>
                    <td className={`${tdCls} text-right font-extrabold text-primary`}>+{rupiah(config.addOn[a])}</td>
                    <td className={`${tdCls} text-right ${dipakai.length ? '' : 'text-muted'}`} title={dipakai.map((p) => p.nama).join(', ')}>
                      {dipakai.length ? `${dipakai.length} minuman` : 'Belum dipakai'}
                    </td>
                    <td className={`${tdCls} text-right whitespace-nowrap`}>
                      <button type="button" className={`${ikonBtn} text-secondary`} title="Edit" aria-label={`Edit ${a}`} onClick={() => setForm(a)}>
                        <Pencil size={18} strokeWidth={1.8} />
                      </button>
                      <button type="button" className={`${ikonBtn} text-danger`} title="Hapus" aria-label={`Hapus ${a}`} onClick={() => setHapus(a)}>
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

      {form !== null && (
        <FormAddOn
          awal={form || null}
          config={config}
          produk={produk}
          onClose={() => setForm(null)}
          onTersimpan={(c) => (setForm(null), onTersimpan(c))}
        />
      )}
      {hapus && (
        <Konfirmasi
          judul={`Hapus add-on ${hapus}?`}
          pesan={
            dipakaiHapus.length
              ? `Add-on ini dipakai ${dipakaiHapus.length} minuman (${dipakaiHapus.map((p) => p.nama).join(', ')}) dan akan hilang dari pilihannya.`
              : 'Add-on ini belum dipakai minuman mana pun.'
          }
          label="Hapus"
          bahaya
          loading={menghapus}
          onYa={() => hapusAddOn(hapus)}
          onClose={() => setHapus(null)}
        />
      )}
    </Kartu>
  );
}

interface FormAddOnProps {
  awal: string | null; // nama add-on yang diedit, null = baru
  config: ConfigMenu;
  produk: Produk[];
  onClose: () => void;
  onTersimpan: (c: ConfigMenu) => void;
}

function FormAddOn({ awal, config, produk, onClose, onTersimpan }: FormAddOnProps) {
  const toast = useToast();
  const [nama, setNama] = useState(awal ?? '');
  const [harga, setHarga] = useState(awal ? String(config.addOn[awal]) : '');
  const [galat, setGalat] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function simpan(e: FormEvent) {
    e.preventDefault();
    const n = nama.trim().replace(/\s+/g, ' ');
    const g: Record<string, string> = {};
    if (!n) g.nama = 'Nama wajib diisi.';
    else if (Object.keys(config.addOn).some((a) => a !== awal && a.toLowerCase() === n.toLowerCase())) g.nama = 'Add-on dengan nama ini sudah ada.';
    if (!bulat(harga)) g.harga = 'Harga harus angka bulat ≥ 0.';
    setGalat(g);
    if (Object.keys(g).length) return;

    setLoading(true);
    try {
      const addOn = Object.fromEntries(Object.entries(config.addOn).filter(([a]) => a !== awal));
      addOn[n] = Number(harga);
      const c = { ...config, addOn };
      // Ganti nama: perbarui juga daftar add-on menu yang memilihnya.
      const terdampak =
        awal && awal !== n
          ? produk.filter((p) => p.addOn?.includes(awal)).map((p): [Produk, string[]] => [p, (p.addOn ?? []).map((a) => (a === awal ? n : a))])
          : [];
      await simpanKatalog(c, terdampak);
      toast('Tersimpan');
      onTersimpan(c);
    } catch {
      toast('Gagal menyimpan. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      judul={awal ? 'Edit add-on' : 'Tambah add-on'}
      lebar="konfirmasi"
      onClose={onClose}
      footer={
        <>
          <Button varian="sekunder" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" form="form-addon" loading={loading}>
            Simpan
          </Button>
        </>
      }
    >
      <form id="form-addon" onSubmit={simpan} className="flex flex-col gap-4">
        <Input label="Nama" placeholder="mis. Extra shot" value={nama} error={galat.nama} onChange={(e) => setNama(e.target.value)} />
        <Field label="Harga" error={galat.harga}>
          {(id) => (
            <InputAfiks id={id} label="Harga add-on" awalan="Rp" type="number" min={0} step={500} value={harga} onChange={(e) => setHarga(e.target.value)} />
          )}
        </Field>
        {!awal && <p className="text-xs text-muted">Minuman lama yang belum pernah diatur otomatis mendapat add-on baru. Atur per minuman lewat tombol Edit.</p>}
      </form>
    </Modal>
  );
}
