import type { Metadata } from 'next';
import { StoreProvider } from '@/store/provider';
import { ToastProvider } from '@/components/ui/Toast';
import './globals.css';

export const metadata: Metadata = {
  title: 'FitTrack',
  description:
    'Персонализированный фитнес-трекер: 12-недельная программа, RIR-авторегуляция, аналитика',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <StoreProvider>
          <ToastProvider>{children}</ToastProvider>
        </StoreProvider>
      </body>
    </html>
  );
}
