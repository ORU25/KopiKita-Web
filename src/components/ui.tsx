import { CircleAlert, Inbox, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { useEffect, useId, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { STATUS_LABEL, type Status } from '../types';

// ---------- Tombol ----------
type Varian = 'utama' | 'sekunder' | 'bahaya' | 'merah';
const VARIAN: Record<Varian, string> = {
  utama: 'bg-primary text-white disabled:bg-disabled',
  sekunder: 'bg-bg text-ink border border-outline hover:bg-ink/4 disabled:text-disabled',
  bahaya: 'text-danger hover:bg-danger/5 disabled:text-disabled',
  merah: 'bg-danger text-white disabled:bg-disabled',
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  varian?: Varian;
  loading?: boolean;
}

export function Button({ varian = 'utama', loading, className = '', children, disabled, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex h-11 min-w-11 cursor-pointer items-center justify-center gap-2 rounded-btn px-5 text-sm font-bold whitespace-nowrap transition-colors disabled:cursor-not-allowed ${VARIAN[varian]} ${className}`}
      {...rest}
    >
      {loading ? 'Menyimpan…' : children}
    </button>
  );
}

// ---------- Input ----------
export const inputCls =
  'h-11 w-full rounded-input border border-outline bg-bg px-4 text-sm font-semibold text-ink outline-none placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary disabled:bg-ink/4 disabled:text-muted';

interface FieldProps {
  label: string;
  error?: string;
  children: (id: string) => ReactNode;
}

export function Field({ label, error, children }: FieldProps) {
  const id = useId();
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs font-bold text-secondary">
        {label}
      </label>
      {children(id)}
      {error && <p className="text-xs font-semibold text-danger">{error}</p>}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string };

export function Input({ label, error, ...rest }: InputProps) {
  return <Field label={label} error={error}>{(id) => <input id={id} className={inputCls} {...rest} />}</Field>;
}

// ---------- Modal ----------
interface ModalProps {
  judul: string;
  onClose: () => void;
  children?: ReactNode;
  footer?: ReactNode;
  lebar?: 'form' | 'konfirmasi';
}

export function Modal({ judul, onClose, children, footer, lebar = 'form' }: ModalProps) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-ink/40 p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={judul}
        onMouseDown={(e) => e.stopPropagation()}
        className={`flex max-h-full w-full flex-col gap-5 overflow-y-auto rounded-panel bg-bg p-5 shadow-float sm:p-6 ${lebar === 'form' ? 'max-w-[480px]' : 'max-w-[400px]'}`}
      >
        <h2 className="text-xl font-extrabold">{judul}</h2>
        {children}
        {footer && <div className="flex justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}

interface KonfirmasiProps {
  judul: string;
  pesan?: string;
  label: string;
  bahaya?: boolean;
  loading?: boolean;
  onYa: () => void;
  onClose: () => void;
}

export function Konfirmasi({ judul, pesan, label, bahaya, loading, onYa, onClose }: KonfirmasiProps) {
  return (
    <Modal
      judul={judul}
      onClose={onClose}
      lebar="konfirmasi"
      footer={
        <>
          <Button varian="sekunder" onClick={onClose}>
            Batal
          </Button>
          <Button varian={bahaya ? 'merah' : 'utama'} loading={loading} onClick={onYa}>
            {label}
          </Button>
        </>
      }
    >
      {pesan && <p className="text-sm font-medium text-secondary">{pesan}</p>}
    </Modal>
  );
}

// ---------- Toggle ----------
interface ToggleProps {
  aktif: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Toggle({ aktif, onChange, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={aktif}
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => onChange(!aktif)}
      className="inline-flex size-11 cursor-pointer items-center justify-center disabled:cursor-not-allowed disabled:opacity-50"
    >
      <span className={`relative h-6 w-11 rounded-full transition-colors ${aktif ? 'bg-primary' : 'bg-pending'}`}>
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white shadow-card transition-all ${aktif ? 'left-[22px]' : 'left-0.5'}`}
        />
      </span>
    </button>
  );
}

// ---------- Badge ----------
const BADGE: Record<Status, string> = {
  menunggu_bayar: 'bg-fill text-secondary',
  dibayar: 'bg-tint text-primary',
  diproses: 'bg-caramel text-white',
  siap: 'bg-primary text-white',
  selesai: 'bg-divider text-muted',
  batal: 'bg-bg text-danger border border-danger',
};

const badgeCls = 'inline-flex h-6 items-center rounded-md px-2.5 text-xs font-bold whitespace-nowrap';

export function StatusBadge({ status }: { status: Status }) {
  return <span className={`${badgeCls} ${BADGE[status]}`}>{STATUS_LABEL[status]}</span>;
}

export function Badge({ children, className = 'bg-tint text-primary' }: { children: ReactNode; className?: string }) {
  return <span className={`${badgeCls} ${className}`}>{children}</span>;
}

export const MetodeBadge = ({ makanDiTempat, nomorMeja }: { makanDiTempat: boolean; nomorMeja: number | null }) => (
  <Badge className="gap-1 bg-tint text-primary">
    {makanDiTempat ? <UtensilsCrossed size={13} strokeWidth={2.2} /> : <ShoppingBag size={13} strokeWidth={2.2} />}
    {makanDiTempat ? `Makan di tempat${nomorMeja ? ` · Meja ${nomorMeja}` : ''}` : 'Ambil sendiri'}
  </Badge>
);

// ---------- Header halaman ----------
export function Header({ judul, sub, children }: { judul: string; sub?: ReactNode; children?: ReactNode }) {
  return (
    <header className="flex min-h-[72px] flex-wrap items-center justify-between gap-4 pb-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-[-0.4px]">{judul}</h1>
        {sub && <p className="text-[13px] font-medium text-muted">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-3">{children}</div>}
    </header>
  );
}

// ---------- Keadaan ----------
// Balok abu berdenyut pengganti konten yang belum dimuat.
export const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-md bg-ink/6 ${className}`} />
);

// Wadah skeleton; pembaca layar mendengar "Memuat…".
export const Memuat = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div role="status" aria-busy="true" className={className}>
    <span className="sr-only">Memuat…</span>
    {children}
  </div>
);

const LEBAR = ['w-3/4', 'w-1/2', 'w-2/3', 'w-5/12', 'w-7/12'];

interface SkeletonTabelProps {
  kolom: string[];
  kanan?: number[]; // indeks kolom angka (rata kanan)
  sembunyi?: number[]; // indeks kolom yang disembunyikan di HP (<768)
  awal?: 'thumb' | 'thumbNama' | 'avatar'; // bentuk sel kolom pertama
  baris?: number;
}

// Tabel skeleton: header asli + baris balok abu, supaya tata letak tidak melompat saat data datang.
export function SkeletonTabel({ kolom, kanan = [], sembunyi = [], awal, baris = 6 }: SkeletonTabelProps) {
  const hp = (c: number) => (sembunyi.includes(c) ? 'max-md:hidden' : '');
  const sel = (r: number, c: number) => {
    const balok = <Skeleton className={`h-3.5 ${LEBAR[(r + c) % LEBAR.length]} ${kanan.includes(c) ? 'ml-auto' : ''}`} />;
    if (c > 0 || !awal) return balok;
    if (awal === 'thumb') return <Skeleton className="size-10 rounded-thumb" />;
    return (
      <div className="flex items-center gap-3">
        <Skeleton className={awal === 'avatar' ? 'size-8 shrink-0 rounded-full' : 'size-10 shrink-0 rounded-thumb'} />
        <div className="flex flex-1 flex-col gap-1.5">
          <Skeleton className={`h-3.5 ${LEBAR[r % LEBAR.length]}`} />
          {awal === 'avatar' && <Skeleton className="h-3 w-1/2" />}
        </div>
      </div>
    );
  };
  return (
    <Memuat className={tabelCls}>
      <table className="w-full">
        <thead>
          <tr>
            {kolom.map((k, c) => (
              <th key={c} className={`${thCls} ${kanan.includes(c) ? 'text-right' : ''} ${hp(c)}`}>
                {k}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: baris }, (_, r) => (
            <tr key={r} className="border-b border-divider last:border-b-0">
              {kolom.map((_, c) => (
                <td key={c} className={`${tdCls} ${hp(c)}`}>
                  {sel(r, c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Memuat>
  );
}

export const Kosong = ({ pesan }: { pesan: string }) => (
  <div className="flex flex-col items-center gap-3 py-16">
    <Inbox size={40} strokeWidth={1.8} className="text-pending" />
    <p className="text-sm font-semibold text-muted">{pesan}</p>
  </div>
);

export const Galat = ({ pesan = 'Gagal memuat data.', onUlang }: { pesan?: string; onUlang?: () => void }) => (
  <div className="flex flex-col items-center gap-3 py-16">
    <CircleAlert size={40} strokeWidth={1.8} className="text-danger" />
    <p className="text-sm font-semibold text-danger">{pesan}</p>
    {onUlang && (
      <Button varian="sekunder" onClick={onUlang}>
        Coba lagi
      </Button>
    )}
  </div>
);

// ---------- Tabel ----------
export const tabelCls = 'overflow-x-auto rounded-card border border-divider bg-bg';
export const thCls = 'h-11 border-b border-divider bg-bg px-4 text-left text-xs font-bold uppercase text-muted whitespace-nowrap';
export const tdCls = 'h-14 px-4 text-sm font-semibold';
export const trCls = 'border-b border-divider last:border-b-0 hover:bg-ink/4';

// Chip filter: tinggi 36 sesuai DESIGN.md
export function Chip({ aktif, onClick, children }: { aktif: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={aktif}
      onClick={onClick}
      className={`h-9 cursor-pointer rounded-lg border px-4 text-[13px] font-bold ${aktif ? 'border-primary bg-primary text-white' : 'border-outline bg-bg text-secondary hover:bg-ink/4'}`}
    >
      {children}
    </button>
  );
}

// Thumbnail produk 40, radius 6, placeholder abu netral
export const Thumb = ({ url }: { url: string }) =>
  url ? (
    <img src={url} alt="" className="size-10 rounded-thumb bg-ink/5 object-cover" />
  ) : (
    <div className="size-10 rounded-thumb bg-ink/5" />
  );

// Avatar inisial
export const Avatar = ({ nama, size = 36 }: { nama: string; size?: number }) => (
  <div
    style={{ width: size, height: size }}
    className="flex shrink-0 items-center justify-center rounded-full bg-tint text-[13px] font-extrabold text-primary"
  >
    {nama.trim().charAt(0).toUpperCase() || '?'}
  </div>
);
