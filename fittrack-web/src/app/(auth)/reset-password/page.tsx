'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/lib/errors';
import { ResetPasswordFormValues, resetPasswordSchema } from '@/lib/schemas';
import { useResetPasswordMutation } from '@/store/api/authApi';

function ResetPasswordForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get('token') ?? '';
  const toast = useToast();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  const onSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      toast.error('Токен сброса отсутствует. Перейдите по ссылке из письма.');
      return;
    }
    try {
      await resetPassword({ token, newPassword: values.newPassword }).unwrap();
      setDone(true);
      setTimeout(() => router.replace('/login'), 2500);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Не удалось обновить пароль'));
    }
  };

  if (!token) {
    return (
      <Card>
        <CardBody className="space-y-3 py-8 text-center">
          <h2 className="text-lg font-semibold">Ссылка повреждена</h2>
          <p className="text-sm text-gray-600">
            В URL отсутствует токен. Запросите новое письмо для сброса.
          </p>
          <Link href="/forgot-password" className="text-sm text-brand-600 hover:underline">
            Запросить новое письмо
          </Link>
        </CardBody>
      </Card>
    );
  }

  if (done) {
    return (
      <Card>
        <CardBody className="space-y-3 py-8 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
          <h2 className="text-lg font-semibold">Пароль обновлён</h2>
          <p className="text-sm text-gray-600">Сейчас перенаправим на страницу входа…</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Новый пароль</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="mb-4 text-sm text-gray-600">
          Придумайте новый пароль — минимум 8 символов, одна заглавная буква и одна цифра.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Новый пароль"
            type="password"
            autoComplete="new-password"
            error={errors.newPassword?.message}
            {...register('newPassword')}
          />
          <Input
            label="Повторите пароль"
            type="password"
            autoComplete="new-password"
            error={errors.confirmPassword?.message}
            {...register('confirmPassword')}
          />
          <Button type="submit" loading={isLoading} fullWidth>
            Установить пароль
          </Button>
        </form>
      </CardBody>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<Card><CardBody className="py-8 text-center text-sm text-gray-500">Загрузка…</CardBody></Card>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
