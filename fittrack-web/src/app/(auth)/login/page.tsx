'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/lib/errors';
import { LoginFormValues, loginSchema } from '@/lib/schemas';
import { useLoginMutation } from '@/store/api/authApi';
import { useAppDispatch } from '@/store/hooks';
import { setTokens, setUser } from '@/store/slices/authSlice';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [login, { isLoading }] = useLoginMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const result = await login(values).unwrap();
      dispatch(setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken }));
      dispatch(setUser(result.user));
      toast.success('Добро пожаловать!');
      router.replace('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Не удалось войти'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Вход</CardTitle>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Input
            label="Пароль"
            type="password"
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" loading={isLoading} fullWidth>
            Войти
          </Button>
          <p className="text-center text-sm text-gray-600">
            Нет аккаунта?{' '}
            <Link href="/register" className="text-brand-600 hover:underline">
              Регистрация
            </Link>
          </p>
        </form>
      </CardBody>
    </Card>
  );
}
