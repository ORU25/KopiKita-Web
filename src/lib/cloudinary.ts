const CLOUD = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

export const TIPE_FOTO = ['image/jpeg', 'image/png', 'image/webp'];
export const MAKS_FOTO = 2 * 1024 * 1024;

// Pesan error (Bahasa Indonesia) bila file tidak valid, null bila valid.
export function cekFoto(file: File): string | null {
  if (!TIPE_FOTO.includes(file.type)) return 'Foto harus JPG, PNG, atau WEBP.';
  if (file.size > MAKS_FOTO) return 'Ukuran foto maksimal 2 MB.';
  return null;
}

// Unggah unsigned ke Cloudinary → secure_url
export async function uploadFoto(file: File): Promise<string> {
  const salah = cekFoto(file);
  if (salah) throw new Error(salah);
  if (!CLOUD || !PRESET) throw new Error('Cloudinary belum dikonfigurasi (.env.local).');
  const body = new FormData();
  body.append('file', file);
  body.append('upload_preset', PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD}/image/upload`, { method: 'POST', body });
  if (!res.ok) throw new Error('Gagal mengunggah foto.');
  return (await res.json()).secure_url as string;
}
