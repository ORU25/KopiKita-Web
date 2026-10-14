import { FirebaseError } from 'firebase/app';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { Button, Field, Input, inputCls } from '../components/ui';
import { auth } from '../firebase';
import { useAuth } from '../lib/useAuth';

function pesanGalat(e: unknown) {
  const kode = e instanceof FirebaseError ? e.code : '';
  if (['auth/invalid-credential', 'auth/wrong-password', 'auth/user-not-found', 'auth/invalid-email'].includes(kode))
    return 'Email atau kata sandi salah.';
  if (kode === 'auth/too-many-requests') return 'Terlalu banyak percobaan. Coba lagi nanti.';
  if (kode === 'auth/network-request-failed') return 'Tidak ada koneksi internet.';
  return 'Gagal masuk. Coba lagi.';
}

export default function Login() {
  const { error: galatAuth } = useAuth();
  const [email, setEmail] = useState('');
  const [sandi, setSandi] = useState('');
  const [lihat, setLihat] = useState(false);
  const [galat, setGalat] = useState('');
  const [loading, setLoading] = useState(false);

  async function masuk(e: FormEvent) {
    e.preventDefault();
    setGalat('');
    setLoading(true);
    try {
      // Pengecekan role terjadi di AuthProvider; pelanggan otomatis dikeluarkan.
      await signInWithEmailAndPassword(auth, email.trim(), sandi);
    } catch (err) {
      setGalat(pesanGalat(err));
    } finally {
      setLoading(false);
    }
  }

  const pesan = galat || galatAuth;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-ink p-4">
      <form onSubmit={masuk} className="flex w-full max-w-[400px] flex-col gap-4 rounded-panel bg-bg p-8 shadow-float">
        <div className="mb-2 flex flex-col items-center gap-1 text-center">
          <img src="/logo-app.png" alt="" className="mb-2 size-[72px] rounded-full bg-bg" />
          <h1 className="text-2xl font-extrabold">KopiKita</h1>
          <p className="text-[13px] text-muted">Dashboard staf &amp; admin</p>
        </div>

        <Input label="Email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Kata sandi">
          {(id) => (
            <div className="relative">
              <input
                id={id}
                type={lihat ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={sandi}
                onChange={(e) => setSandi(e.target.value)}
                className={`${inputCls} pr-12`}
              />
              <button
                type="button"
                onClick={() => setLihat(!lihat)}
                aria-label={lihat ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                className="absolute top-0 right-0 flex size-11 cursor-pointer items-center justify-center text-muted"
              >
                {lihat ? <EyeOff size={20} strokeWidth={1.8} /> : <Eye size={20} strokeWidth={1.8} />}
              </button>
            </div>
          )}
        </Field>

        {pesan && <p className="text-xs font-semibold text-danger">{pesan}</p>}

        <Button type="submit" disabled={loading} className="mt-2 w-full">
          {loading ? 'Masuk…' : 'Masuk'}
        </Button>
      </form>
    </div>
  );
}
