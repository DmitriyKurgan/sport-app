'use client';

import { LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLogoutMutation, useMeQuery } from '@/store/api/authApi';
import { logout } from '@/store/slices/authSlice';
import { useAppDispatch } from '@/store/hooks';
import { Button } from '@/components/ui/Button';

export function Navbar() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { data: user } = useMeQuery();
  const [logoutMutation, { isLoading }] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // ignore — токен мог уже истечь, всё равно очищаем стор
    }
    dispatch(logout());
    router.push('/login');
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-6">
      <div className="flex items-center gap-3">
        <h1 className="md:hidden text-lg font-bold text-brand-600">FitTrack</h1>
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <div className="hidden sm:flex items-center gap-2 text-sm text-gray-700">
            <User className="h-4 w-4" />
            <span>{user.firstName}</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          loading={isLoading}
          aria-label="Выйти"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Выйти</span>
        </Button>
      </div>
    </header>
  );
}
