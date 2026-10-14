import { signOut } from 'firebase/auth';
import { BarChart3, ClipboardList, LogOut, Package, Ticket, Users, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
import { auth } from '../firebase';
import { useAuth } from '../lib/useAuth';
import { Avatar, Memuat, Skeleton } from './ui';

type Item = [to: string, label: string, Icon: LucideIcon];

const MENU_STAF: Item[] = [
  ['/antrean', 'Antrean', ClipboardList],
  ['/stok', 'Stok', Package],
];
const MENU_ADMIN: Item[] = [
  ['/menu', 'Menu', UtensilsCrossed],
  ['/voucher', 'Voucher', Ticket],
  ['/pengguna', 'Pengguna', Users],
  ['/laporan', 'Laporan', BarChart3],
];

const ROLE_LABEL = { pelanggan: 'Pelanggan', staf: 'Staf', admin: 'Admin' };

// Sidebar 72 (ikon saja) di tablet 1024, 240 penuh mulai 1280.
function Menu({ items }: { items: Item[] }) {
  return items.map(([to, label, Icon]) => (
    <NavLink
      key={to}
      to={to}
      title={label}
      className={({ isActive }) =>
        `flex h-11 items-center justify-center gap-3 rounded-lg px-3 text-sm xl:justify-start ${
          isActive ? 'bg-primary font-bold text-white' : 'font-semibold text-secondary hover:bg-ink/4'
        }`
      }
    >
      <Icon size={20} strokeWidth={1.8} className="shrink-0" />
      <span className="hidden xl:inline">{label}</span>
    </NavLink>
  ));
}

// Kerangka dasbor saat sesi login masih dicek (role belum diketahui).
export function LayoutSkeleton() {
  return (
    <Memuat className="flex h-dvh">
      <aside className="flex w-[72px] shrink-0 flex-col gap-1 border-r border-divider bg-surface p-3 xl:w-60 xl:p-4">
        <div className="mb-5 flex items-center justify-center gap-3 xl:justify-start">
          <img src="/logo-app.png" alt="" className="size-10 rounded-full bg-bg" />
          <div className="hidden flex-1 flex-col gap-1.5 xl:flex">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-11 rounded-lg" />
        ))}
        <div className="mt-auto flex flex-col gap-3 border-t border-divider pt-4">
          <div className="flex items-center justify-center gap-3 xl:justify-start">
            <Skeleton className="size-9 shrink-0 rounded-full" />
            <Skeleton className="hidden h-3.5 flex-1 xl:block" />
          </div>
          <Skeleton className="h-11 rounded-btn" />
        </div>
      </aside>
      <main className="flex min-w-0 flex-1 flex-col gap-6 p-6">
        <div className="flex min-h-[72px] items-center">
          <Skeleton className="h-7 w-40" />
        </div>
        <Skeleton className="h-80 rounded-card" />
      </main>
    </Memuat>
  );
}

export default function Layout() {
  const { profil } = useAuth();
  if (!profil) return null;

  return (
    <div className="flex h-dvh">
      <aside className="flex w-[72px] shrink-0 flex-col gap-1 border-r border-divider bg-surface p-3 xl:w-60 xl:p-4">
        <div className="mb-5 flex items-center justify-center gap-3 xl:justify-start">
          <img src="/logo-app.png" alt="KopiKita" className="size-10 rounded-full bg-bg" />
          <div className="hidden xl:block">
            <p className="text-lg leading-tight font-extrabold">KopiKita</p>
            <p className="text-xs font-semibold text-muted">Dashboard</p>
          </div>
        </div>

        <Menu items={MENU_STAF} />
        {profil.role === 'admin' && (
          <>
            <hr className="my-2 border-divider" />
            <Menu items={MENU_ADMIN} />
          </>
        )}

        <div className="mt-auto flex flex-col gap-3 border-t border-divider pt-4">
          <div className="flex items-center justify-center gap-3 xl:justify-start" title={profil.nama}>
            <Avatar nama={profil.nama} />
            <div className="hidden min-w-0 xl:block">
              <p className="truncate text-[13px] font-bold">{profil.nama}</p>
              <p className="text-xs text-muted">{ROLE_LABEL[profil.role]}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => signOut(auth)}
            title="Keluar"
            className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-btn border border-outline bg-bg text-sm font-bold hover:bg-ink/4"
          >
            <LogOut size={18} strokeWidth={1.8} />
            <span className="hidden xl:inline">Keluar</span>
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto bg-bg p-6">
        <Outlet />
      </main>
    </div>
  );
}
