import { ReactNode } from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { MobileNav } from '@/components/layout/MobileNav';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Navbar />
          <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
            <div className="mx-auto max-w-7xl p-4 md:p-6">{children}</div>
          </main>
        </div>
        <MobileNav />
      </div>
    </AuthGuard>
  );
}
