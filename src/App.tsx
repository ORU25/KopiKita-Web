import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import Layout from './components/Layout';
import { Memuat } from './components/ui';
import { useAuth } from './lib/useAuth';
import Antrean from './pages/Antrean';
import Laporan from './pages/Laporan';
import Login from './pages/Login';
import Menu from './pages/Menu';
import Pengguna from './pages/Pengguna';
import Stok from './pages/Stok';
import Voucher from './pages/Voucher';

// Splash loading awal. Harus identik dengan splash HTML di index.html agar pergantiannya tidak terlihat.
function Splash() {
  return (
    <Memuat className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-bg">
      <img src="/logo-app.png" alt="" width={72} height={72} className="size-[72px] rounded-full" />
      <p className="text-xl font-extrabold text-ink">KopiKita</p>
      <div className="h-1 w-40 overflow-hidden rounded-full bg-ink/6">
        <div className="h-full w-1/3 animate-muat rounded-full bg-primary motion-reduce:animate-none" />
      </div>
    </Memuat>
  );
}

// Guard UI saja — pengaman sebenarnya ada di firestore.rules.
function Wajib({ admin, children }: { admin?: boolean; children: ReactNode }) {
  const { profil, loading } = useAuth();
  if (loading) return <Splash />;
  if (!profil) return <Navigate to="/login" replace />;
  if (admin && profil.role !== 'admin') return <Navigate to="/antrean" replace />;
  return children;
}

function HalamanLogin() {
  const { profil, siap } = useAuth();
  // Splash hanya saat sesi pertama dicek; saat tombol Masuk ditekan, form tetap tampil.
  if (!siap) return <Splash />;
  return profil ? <Navigate to="/antrean" replace /> : <Login />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<HalamanLogin />} />
        <Route
          element={
            <Wajib>
              <Layout />
            </Wajib>
          }
        >
          <Route path="/antrean" element={<Antrean />} />
          <Route path="/stok" element={<Stok />} />
          <Route path="/menu" element={<Wajib admin><Menu /></Wajib>} />
          <Route path="/voucher" element={<Wajib admin><Voucher /></Wajib>} />
          <Route path="/pengguna" element={<Wajib admin><Pengguna /></Wajib>} />
          <Route path="/laporan" element={<Wajib admin><Laporan /></Wajib>} />
        </Route>
        <Route path="*" element={<Navigate to="/antrean" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
