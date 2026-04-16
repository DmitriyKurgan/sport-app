'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/lib/errors';
import { useDeleteMeMutation } from '@/store/api/authApi';
import { useGetProfileQuery } from '@/store/api/profileApi';
import { useGenerateProgramMutation } from '@/store/api/trainingApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { setLoadPreference } from '@/store/slices/uiSlice';

export default function SettingsPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const toast = useToast();

  const { data: profile } = useGetProfileQuery();
  const loadPref = useAppSelector((s) => s.ui.loadPreference);

  const [generateProgram, { isLoading: regenerating }] = useGenerateProgramMutation();
  const [deleteMe, { isLoading: deleting }] = useDeleteMeMutation();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleRegenerate = async () => {
    try {
      await generateProgram().unwrap();
      toast.success('Программа пересоздана');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMe().unwrap();
      dispatch(logout());
      router.replace('/login');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Настройки</h1>

      {profile && (
        <Card>
          <CardHeader>
            <CardTitle>Профиль</CardTitle>
          </CardHeader>
          <CardBody>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-gray-500">Цель</dt>
                <dd className="font-medium">{profile.primaryTrainingGoal}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Вес/рост</dt>
                <dd className="font-medium">
                  {profile.weightKg} кг · {profile.heightCm} см
                </dd>
              </div>
              <div>
                <dt className="text-gray-500">TDEE</dt>
                <dd className="font-medium">{profile.tdee ?? '—'} ккал</dd>
              </div>
              <div>
                <dt className="text-gray-500">Белок цель</dt>
                <dd className="font-medium">{profile.proteinTargetG ?? '—'} г</dd>
              </div>
            </dl>
            <p className="mt-4 text-xs text-gray-500">
              Полная форма редактирования профиля — следующая итерация.
            </p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Предпочтение шкалы</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="mb-3 text-sm text-gray-600">
            RIR (reps in reserve) — основная шкала. RPE — альтернатива.
          </p>
          <div className="flex gap-2">
            <Button
              variant={loadPref === 'rir' ? 'primary' : 'ghost'}
              onClick={() => dispatch(setLoadPreference('rir'))}
            >
              RIR
            </Button>
            <Button
              variant={loadPref === 'rpe' ? 'primary' : 'ghost'}
              onClick={() => dispatch(setLoadPreference('rpe'))}
            >
              RPE
            </Button>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Программа</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="mb-3 text-sm text-gray-600">
            Пересоздать программу с нуля по текущему профилю. Прогресс по предыдущей сохранится в
            истории.
          </p>
          <Button onClick={handleRegenerate} loading={regenerating}>
            Пересоздать программу
          </Button>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Безопасность</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="mb-3 text-sm text-gray-600">
            Заново пройти PAR-Q+ скрининг — если изменилось состояние здоровья.
          </p>
          <Button variant="secondary" onClick={() => router.push('/onboarding')}>
            Re-screening
          </Button>
        </CardBody>
      </Card>

      <Card className="border-red-200">
        <CardHeader>
          <CardTitle>Удаление аккаунта</CardTitle>
        </CardHeader>
        <CardBody>
          <p className="mb-3 text-sm text-gray-600">
            Аккаунт будет помечен как удалённый. Восстановление невозможно.
          </p>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            Удалить аккаунт
          </Button>
        </CardBody>
      </Card>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Подтвердите удаление"
        size="sm"
      >
        <p className="mb-4 text-sm text-gray-700">
          Это действие необратимо. Все данные будут деактивированы.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
            Отмена
          </Button>
          <Button variant="danger" loading={deleting} onClick={handleDelete}>
            Удалить навсегда
          </Button>
        </div>
      </Modal>
    </div>
  );
}
