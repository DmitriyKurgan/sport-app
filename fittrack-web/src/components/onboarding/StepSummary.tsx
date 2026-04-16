'use client';

import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { CreateProfileRequest } from '@/types';

interface Props {
  profile: Partial<CreateProfileRequest>;
  hasRedFlags: boolean;
}

export function StepSummary({ profile, hasRedFlags }: Props) {
  // Расчёт derived на лету (зеркало backend для preview)
  const bmi =
    profile.heightCm && profile.weightKg
      ? Math.round((profile.weightKg / Math.pow(profile.heightCm / 100, 2)) * 10) / 10
      : null;

  const isMale = profile.sex === 'male';
  const ree =
    profile.weightKg && profile.heightCm && profile.ageYears
      ? Math.round(
          10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.ageYears + (isMale ? 5 : -161),
        )
      : null;

  const activityFactor = (() => {
    if (!profile.dailyActivityLevel || !profile.weeklyTrainingDaysTarget) return null;
    const intense = profile.weeklyTrainingDaysTarget >= 4;
    const map = {
      sedentary: { low: 1.375, high: 1.55 },
      moderate: { low: 1.55, high: 1.725 },
      active: { low: 1.725, high: 1.9 },
    };
    return map[profile.dailyActivityLevel][intense ? 'high' : 'low'];
  })();

  const tdee = ree && activityFactor ? Math.round(ree * activityFactor) : null;
  const proteinTarget = profile.weightKg ? Math.round(profile.weightKg * 1.6) : null;

  return (
    <div className="space-y-4">
      {hasRedFlags && (
        <Card className="border-amber-300 bg-amber-50">
          <CardBody className="flex gap-3">
            <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-600" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900">Рекомендуем консультацию специалиста</p>
              <p className="mt-1 text-amber-800">
                По итогам PAR-Q+ выявлены факторы риска. Программа будет создана в режиме низкой
                интенсивности (только bodyweight, 3 трен/нед, безопасные параметры).
              </p>
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Расчётные показатели</CardTitle>
        </CardHeader>
        <CardBody>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">BMI</dt>
              <dd className="text-lg font-semibold">{bmi ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">REE (база)</dt>
              <dd className="text-lg font-semibold">{ree ?? '—'} ккал</dd>
            </div>
            <div>
              <dt className="text-gray-500">TDEE</dt>
              <dd className="text-lg font-semibold">{tdee ?? '—'} ккал</dd>
            </div>
            <div>
              <dt className="text-gray-500">Белок/день</dt>
              <dd className="text-lg font-semibold">{proteinTarget ?? '—'} г</dd>
            </div>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Что будет дальше</CardTitle>
        </CardHeader>
        <CardBody>
          <ul className="space-y-2 text-sm">
            <li className="flex gap-2">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
              <span>
                12-недельная программа: 3 мезоцикла × (3 недели нагрузки + делoad), периодизация
                под цель {profile.primaryTrainingGoal ?? '—'}
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
              <span>
                {profile.weeklyTrainingDaysTarget ?? '—'} тренировок/нед,{' '}
                {profile.sessionDurationMinutes ?? '—'} мин каждая
              </span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
              <span>План питания тира «{profile.nutritionTierPreference ?? '—'}»</span>
            </li>
            <li className="flex gap-2">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600" />
              <span>Авторегуляция через RIR — никаких 1RM-тестов</span>
            </li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
