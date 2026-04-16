'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { Spinner } from '@/components/ui/Spinner';
import { useGetProfileQuery } from '@/store/api/profileApi';
import { useAppSelector } from '@/store/hooks';

/**
 * Клиентский guard:
 *   1. Нет accessToken → /login
 *   2. Нет профиля (404) → /onboarding (кроме самой страницы /onboarding и /settings)
 *
 * Профиль грузится только при наличии токена.
 */
export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useAppSelector((s) => s.auth.accessToken);

  // Грузим профиль только если есть токен
  const { data: profile, error: profileError, isLoading: profileLoading } =
    useGetProfileQuery(undefined, { skip: !token });

  // Не редиректим с страниц, где профиль ещё не нужен
  const isOnboardingFlow = pathname === '/onboarding' || pathname === '/settings';

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    // 404 от /profile = профиля ещё нет → онбординг
    const status = (profileError as { status?: number } | undefined)?.status;
    if (status === 404 && !isOnboardingFlow) {
      router.replace('/onboarding');
    }
  }, [token, profileError, isOnboardingFlow, router]);

  if (!token || (profileLoading && !profile && !profileError)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
