import { signOut } from 'firebase/auth';
import { BarChart3, ClipboardList, LogOut, Package, Ticket, Users, UtensilsCrossed, type LucideIcon } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
import { auth } from '../firebase';
import { useAuth } from '../lib/useAuth';
import { Avatar } from './ui';

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

// HP (<768): bilah navigasi bawah ikon saja. Sidebar 72 (ikon saja) di tablet, 240 penuh mulai 1280.
function Menu({ items }: { items: Item[] }) {
  return items.map(([to, label, Icon]) => (
    <NavLink
      key={to}
      to={to}
      title={label}
      aria-label={label}
      className={({ isActive }) =>
        `flex h-11 flex-1 items-center justify-center gap-3 rounded-lg px-3 text-sm md:flex-none xl:justify-start ${
          isActive ? 'bg-primary font-bold text-white' : 'font-semibold text-secondary hover:bg-ink/4'
        }`
      }
    >
      <Icon size={20} strokeWidth={1.8} className="shrink-0" />
      <span className="hidden xl:inline">{label}</span>
    </NavLink>
  ));
}

export default function Layout() {
  const { profil } = useAuth();
  if (!profil) return null;

  return (
    <div className="flex h-dvh flex-col md:flex-row">
      <aside className="order-last flex shrink-0 gap-1 border-t border-divider bg-surface p-1 md:order-none md:w-[72px] md:flex-col md:border-t-0 md:border-r md:p-3 xl:w-60 xl:p-4">
        <div className="mb-5 hidden items-center justify-center gap-3 md:flex xl:justify-start">
          <img src="/logo-app.png" alt="KopiKita" className="size-10 rounded-full bg-bg" />
          <div className="hidden xl:block">
            <p className="text-lg leading-tight font-extrabold">KopiKita</p>
            <p className="text-xs font-semibold text-muted">Dashboard</p>
          </div>
        </div>

        <Menu items={MENU_STAF} />
        {profil.role === 'admin' && (
          <>
            <hr className="my-2 hidden border-divider md:block" />
            <Menu items={MENU_ADMIN} />
          </>
        )}

        <div className="contents md:mt-auto md:flex md:flex-col md:gap-3 md:border-t md:border-divider md:pt-4">
          <div className="hidden items-center justify-center gap-3 md:flex xl:justify-start" title={profil.nama}>
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
            aria-label="Keluar"
            className="flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-btn text-sm font-bold text-secondary hover:bg-ink/4 md:flex-none md:border md:border-outline md:bg-bg md:text-ink"
          >
            <LogOut size={18} strokeWidth={1.8} />
            <span className="hidden xl:inline">Keluar</span>
          </button>
        </div>
      </aside>

      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-bg p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}
