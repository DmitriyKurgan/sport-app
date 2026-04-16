'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/lib/errors';
import { measurementSchema, MeasurementFormValues } from '@/lib/schemas';
import { useAddMeasurementMutation } from '@/store/api/progressApi';

export function BodyMeasurementForm() {
  const toast = useToast();
  const [addMeasurement, { isLoading }] = useAddMeasurementMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MeasurementFormValues>({
    resolver: zodResolver(measurementSchema),
  });

  const onSubmit = async (data: MeasurementFormValues) => {
    try {
      await addMeasurement(data).unwrap();
      toast.success('Замер сохранён');
      reset();
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Новый замер</CardTitle>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <Input
            type="number"
            step="0.1"
            label="Вес, кг"
            error={errors.weightKg?.message}
            {...register('weightKg')}
          />
          <Input
            type="number"
            step="0.1"
            label="Жир, %"
            error={errors.bodyFatPercent?.message}
            {...register('bodyFatPercent')}
          />
          <Input
            type="number"
            step="0.1"
            label="Грудь, см"
            error={errors.chestCm?.message}
            {...register('chestCm')}
          />
          <Input
            type="number"
            step="0.1"
            label="Талия, см"
            error={errors.waistCm?.message}
            {...register('waistCm')}
          />
          <Input
            type="number"
            step="0.1"
            label="Бёдра, см"
            error={errors.hipsCm?.message}
            {...register('hipsCm')}
          />
          <Input
            type="number"
            step="0.1"
            label="Бицепс, см"
            error={errors.bicepsCm?.message}
            {...register('bicepsCm')}
          />
          <Input
            type="number"
            step="0.1"
            label="Бедро, см"
            error={errors.thighCm?.message}
            {...register('thighCm')}
          />
          <div className="col-span-2 md:col-span-3 flex justify-end">
            <Button type="submit" loading={isLoading}>
              Сохранить
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
