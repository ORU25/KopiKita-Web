import type { ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router';
import Layout, { LayoutSkeleton } from './components/Layout';
import { Memuat } from './components/ui';
import { useAuth } from './lib/useAuth';
import Antrean from './pages/Antrean';
import Laporan from './pages/Laporan';
import Login from './pages/Login';
import Menu from './pages/Menu';
import Pengguna from './pages/Pengguna';
import Stok from './pages/Stok';
import Voucher from './pages/Voucher';

// Guard UI saja — pengaman sebenarnya ada di firestore.rules.
function Wajib({ admin, children }: { admin?: boolean; children: ReactNode }) {
  const { profil, loading } = useAuth();
  if (loading) return <LayoutSkeleton />;
  if (!profil) return <Navigate to="/login" replace />;
  if (admin && profil.role !== 'admin') return <Navigate to="/antrean" replace />;
  return children;
}

function HalamanLogin() {
  const { profil, loading } = useAuth();
  // Latar gelap seperti halaman Login, supaya tidak berkedip putih.
  if (loading)
    return (
      <Memuat className="flex min-h-dvh items-center justify-center bg-ink">
        <img src="/logo-app.png" alt="" className="size-[72px] animate-pulse rounded-full bg-bg" />
      </Memuat>
    );
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
