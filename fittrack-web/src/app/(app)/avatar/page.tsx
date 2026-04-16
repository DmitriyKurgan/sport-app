'use client';

import dynamic from 'next/dynamic';
import { Sparkles } from 'lucide-react';

const Avatar3D = dynamic(
  () => import('@/components/avatar/Avatar3D').then((m) => m.Avatar3D),
  { ssr: false, loading: () => <div className="h-[480px] animate-pulse rounded-lg bg-slate-800" /> },
);
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { getErrorMessage } from '@/lib/errors';
import {
  useGetCurrentAvatarQuery,
  useRecalculateAvatarMutation,
} from '@/store/api/avatarApi';
import { useGetCurrentBodyTypeQuery } from '@/store/api/bodyTypeApi';

export default function AvatarPage() {
  const toast = useToast();
  const { data: avatar, isLoading: avatarLoading } = useGetCurrentAvatarQuery();
  const { data: bodyType } = useGetCurrentBodyTypeQuery();
  const [recalculate, { isLoading: recalculating }] = useRecalculateAvatarMutation();

  const handleRecalc = async () => {
    try {
      await recalculate().unwrap();
      toast.success('Аватар обновлён');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (avatarLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Голограф-аватар</h1>
        <Button onClick={handleRecalc} loading={recalculating} variant="ghost" size="sm">
          <Sparkles className="h-4 w-4" />
          Пересчитать
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="bg-slate-900">
          <CardBody className="flex flex-col gap-4 py-4">
            {avatar ? (
              <Avatar3D params={avatar} />
            ) : (
              <p className="text-gray-400">Аватар недоступен</p>
            )}
            <p className="text-center text-xs text-gray-400">Покрутите мышью · колёсико — масштаб</p>
          </CardBody>
        </Card>

        <div className="space-y-4">
          {bodyType && (
            <Card>
              <CardHeader>
                <CardTitle>Тип телосложения</CardTitle>
              </CardHeader>
              <CardBody>
                <div className="flex items-center justify-between">
                  <Badge tone="info">{bodyType.classification}</Badge>
                  <span className="text-sm text-gray-500">
                    confidence: {bodyType.confidence}
                  </span>
                </div>
                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Adiposity</dt>
                    <dd className="font-mono">{bodyType.adiposityScore.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Muscularity</dt>
                    <dd className="font-mono">{bodyType.muscularityScore.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-gray-500">Linearity</dt>
                    <dd className="font-mono">{bodyType.linearityScore.toFixed(2)}</dd>
                  </div>
                </dl>
              </CardBody>
            </Card>
          )}

          {avatar && (
            <Card>
              <CardHeader>
                <CardTitle>Параметры</CardTitle>
              </CardHeader>
              <CardBody>
                <dl className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <dt className="text-gray-500">Плечи</dt>
                    <dd className="font-mono">{avatar.shoulderWidth.toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Талия</dt>
                    <dd className="font-mono">{avatar.waistWidth.toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Бёдра</dt>
                    <dd className="font-mono">{avatar.hipWidth.toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Бицепс</dt>
                    <dd className="font-mono">{avatar.armGirth.toFixed(2)}</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Рельеф</dt>
                    <dd className="font-mono">{(avatar.muscleDefinition * 100).toFixed(0)}%</dd>
                  </div>
                  <div>
                    <dt className="text-gray-500">Жировой слой</dt>
                    <dd className="font-mono">{(avatar.bodyFatLayer * 100).toFixed(0)}%</dd>
                  </div>
                </dl>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
