import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth, db } from '../firebase';
import type { UserDoc } from '../types';

interface AuthState {
  user: User | null;
  profil: UserDoc | null;
  loading: boolean; // sedang memastikan profil/role
  siap: boolean; // pemeriksaan sesi pertama (saat aplikasi dibuka) sudah selesai
  error: string;
}

const AWAL: AuthState = { user: null, profil: null, loading: true, siap: false, error: '' };
const AuthContext = createContext<AuthState>(AWAL);

// Profil terakhir disimpan di browser agar dasbor langsung tampil saat dibuka lagi,
// sementara profil terbaru dibaca ulang di belakang. Hanya untuk tampilan menu;
// pengaman sebenarnya tetap firestore.rules.
const KUNCI = 'kopikita:profil';

function bacaCache(uid: string): UserDoc | null {
  try {
    const p = JSON.parse(localStorage.getItem(KUNCI) ?? 'null') as UserDoc | null;
    return p?.id === uid ? p : null;
  } catch {
    return null;
  }
}

function tulisCache(p: UserDoc | null) {
  try {
    if (p) localStorage.setItem(KUNCI, JSON.stringify({ ...p, createdAt: undefined }));
    else localStorage.removeItem(KUNCI);
  } catch {
    // localStorage bisa tidak tersedia (mode privat); cukup tanpa cache.
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(AWAL);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          tulisCache(null);
          setState((s) => ({ user: null, profil: null, loading: false, siap: true, error: s.error }));
          return;
        }
        const cache = bacaCache(user.uid);
        if (cache) setState({ user, profil: cache, loading: false, siap: true, error: '' });
        else setState((s) => ({ ...s, loading: true }));

        try {
          // Baca profil sekali (bukan realtime) untuk hemat kuota.
          const snap = await getDoc(doc(db, 'users', user.uid));
          const profil = snap.exists() ? ({ id: snap.id, ...snap.data() } as UserDoc) : null;
          if (!profil || profil.role === 'pelanggan') {
            tulisCache(null);
            await signOut(auth);
            setState({ user: null, profil: null, loading: false, siap: true, error: 'Akun ini bukan akun staf/admin.' });
            return;
          }
          tulisCache(profil);
          setState({ user, profil, loading: false, siap: true, error: '' });
        } catch {
          if (cache) return; // mis. sedang offline: tetap pakai profil tersimpan
          await signOut(auth);
          setState({ user: null, profil: null, loading: false, siap: true, error: 'Gagal memuat profil. Coba lagi.' });
        }
      }),
    [],
  );

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
