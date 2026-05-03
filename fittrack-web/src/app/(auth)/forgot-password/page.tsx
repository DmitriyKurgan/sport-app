'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/lib/errors';
import { ForgotPasswordFormValues, forgotPasswordSchema } from '@/lib/schemas';
import { useForgotPasswordMutation } from '@/store/api/authApi';

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [forgot, { isLoading }] = useForgotPasswordMutation();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  const onSubmit = async (values: ForgotPasswordFormValues) => {
    try {
      await forgot({ email: values.email }).unwrap();
      setSubmittedEmail(values.email);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Не удалось отправить письмо'));
    }
  };

  if (submittedEmail) {
    return (
      <Card>
        <CardBody className="space-y-4 py-8 text-center">
          <MailCheck className="mx-auto h-12 w-12 text-brand-600" />
          <h2 className="text-lg font-semibold">Проверьте почту</h2>
          <p className="text-sm text-gray-600">
            Если аккаунт <strong>{submittedEmail}</strong> существует — мы отправили на него ссылку для сброса пароля. Срок действия — 30 минут.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-1 text-sm text-brand-600 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Вернуться ко входу
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Восстановление пароля</CardTitle>
      </CardHeader>
      <CardBody>
        <p className="mb-4 text-sm text-gray-600">
          Введите email, на который зарегистрирован аккаунт. Мы вышлем ссылку для сброса пароля.
        </p>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email"
            type="email"
            autoComplete="email"
            error={errors.email?.message}
            {...register('email')}
          />
          <Button type="submit" loading={isLoading} fullWidth>
            Отправить ссылку
          </Button>
          <p className="text-center text-sm text-gray-600">
            <Link href="/login" className="text-brand-600 hover:underline">
              Вернуться ко входу
            </Link>
          </p>
        </form>
      </CardBody>
    </Card>
  );
}
