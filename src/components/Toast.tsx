import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

const ToastContext = createContext<(pesan: string) => void>(() => {});

export function ToastProvider({ children }: { children: ReactNode }) {
  const [daftar, setDaftar] = useState<{ id: number; pesan: string }[]>([]);

  const toast = useCallback((pesan: string) => {
    const id = Date.now() + Math.random();
    setDaftar((d) => [...d, { id, pesan }]);
    setTimeout(() => setDaftar((d) => d.filter((t) => t.id !== id)), 3000);
  }, []);

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed right-6 bottom-6 z-50 flex flex-col items-end gap-2" aria-live="polite">
        {daftar.map((t) => (
          <div key={t.id} className="rounded-input bg-ink px-4 py-3 text-[13px] font-semibold text-cream shadow-float">
            {t.pesan}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
