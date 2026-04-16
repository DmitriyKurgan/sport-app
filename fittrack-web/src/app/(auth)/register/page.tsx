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
import { RegisterFormValues, registerSchema } from '@/lib/schemas';
import { useRegisterMutation } from '@/store/api/authApi';
import { useAppDispatch } from '@/store/hooks';
import { setTokens, setUser } from '@/store/slices/authSlice';

export default function RegisterPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const [registerMutation, { isLoading }] = useRegisterMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      const result = await registerMutation(values).unwrap();
      dispatch(setTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken }));
      dispatch(setUser(result.user));
      toast.success('Аккаунт создан!');
      router.replace('/onboarding');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Не удалось создать аккаунт'));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Регистрация</CardTitle>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Имя"
              autoComplete="given-name"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Фамилия"
              autoComplete="family-name"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>
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
            autoComplete="new-password"
            error={errors.password?.message}
            helperText="Минимум 8 символов, заглавная буква и цифра"
            {...register('password')}
          />
          <Button type="submit" loading={isLoading} fullWidth>
            Создать аккаунт
          </Button>
          <p className="text-center text-sm text-gray-600">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-brand-600 hover:underline">
              Войти
            </Link>
          </p>
        </form>
      </CardBody>
    </Card>
  );
}
