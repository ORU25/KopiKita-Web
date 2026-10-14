import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth, db } from '../firebase';
import type { UserDoc } from '../types';

interface AuthState {
  user: User | null;
  profil: UserDoc | null;
  loading: boolean;
  error: string;
}

const AuthContext = createContext<AuthState>({ user: null, profil: null, loading: true, error: '' });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, profil: null, loading: true, error: '' });

  useEffect(
    () =>
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          setState((s) => ({ user: null, profil: null, loading: false, error: s.error }));
          return;
        }
        setState((s) => ({ ...s, loading: true }));
        try {
          // Baca profil sekali (bukan realtime) untuk hemat kuota.
          const snap = await getDoc(doc(db, 'users', user.uid));
          const profil = snap.exists() ? ({ id: snap.id, ...snap.data() } as UserDoc) : null;
          if (!profil || profil.role === 'pelanggan') {
            await signOut(auth);
            setState({ user: null, profil: null, loading: false, error: 'Akun ini bukan akun staf/admin.' });
            return;
          }
          setState({ user, profil, loading: false, error: '' });
        } catch {
          await signOut(auth);
          setState({ user: null, profil: null, loading: false, error: 'Gagal memuat profil. Coba lagi.' });
        }
      }),
    [],
  );

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
