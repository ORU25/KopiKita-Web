// POST /api/notif — Vercel Function (gratis, pengganti Cloud Functions yang butuh paket Blaze).
// Dipanggil dasbor setelah staf mengubah status pesanan; mengirim push FCM ke HP pelanggan
// (tampil walau app ditutup). Token HP ada di users/{uid}.fcmTokens (diisi app Flutter).
// Env Vercel: FIREBASE_SERVICE_ACCOUNT = isi JSON service account (jangan di-commit).
import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';
import { getMessaging } from 'firebase-admin/messaging';

const app =
  getApps()[0] ?? initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT ?? '{}')) });
const db = getFirestore(app);

// Teks sama dengan NotifPesanan di app (lib/services/notif_pesanan.dart)
const PESAN: Record<string, (nomor: string) => string> = {
  dibayar: (n) => `Pembayaran ${n} dikonfirmasi.`,
  diproses: (n) => `Pesanan ${n} sedang dibuat barista.`,
  siap: (n) => `Pesanan ${n} siap diambil. Silakan ke kasir.`,
};

export async function POST(req: Request): Promise<Response> {
  // Hanya staf/admin yang login di dasbor boleh memicu push
  let pemanggil: string;
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '') ?? '';
    pemanggil = (await getAuth(app).verifyIdToken(token)).uid;
  } catch {
    return Response.json({ error: 'unauthenticated' }, { status: 401 });
  }
  const role = (await db.doc(`users/${pemanggil}`).get()).get('role');
  if (role !== 'staf' && role !== 'admin') return Response.json({ error: 'forbidden' }, { status: 403 });

  const { orderId } = (await req.json().catch(() => ({}))) as { orderId?: string };
  if (typeof orderId !== 'string' || !orderId) return Response.json({ error: 'orderId' }, { status: 400 });

  // Status & pemilik dibaca dari Firestore, bukan dari body request
  const order = (await db.doc(`orders/${orderId}`).get()).data();
  const pesan = order && PESAN[order.status as string];
  if (!order || !pesan) return Response.json({ terkirim: 0 });

  const userRef = db.doc(`users/${order.uid}`);
  const user = (await userRef.get()).data();
  const tokens: string[] = user?.fcmTokens ?? [];
  if (user?.notifikasi === false || tokens.length === 0) return Response.json({ terkirim: 0 });

  const hasil = await getMessaging(app).sendEachForMulticast({
    tokens,
    notification: { title: `Pesanan ${order.nomor}`, body: pesan(order.nomor) },
    data: { orderId },
    android: { priority: 'high' },
  });

  // Buang token HP yang sudah uninstall / kedaluwarsa
  const mati = tokens.filter((_, i) => {
    const kode = hasil.responses[i].error?.code;
    return kode === 'messaging/registration-token-not-registered' || kode === 'messaging/invalid-registration-token';
  });
  if (mati.length) await userRef.update({ fcmTokens: FieldValue.arrayRemove(...mati) });

  return Response.json({ terkirim: hasil.successCount });
}
