'use client';

import { Activity, Calendar, Scale, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { AlertBanner } from '@/components/dashboard/AlertBanner';
import { PhaseIndicator } from '@/components/dashboard/PhaseIndicator';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { useGetActiveAlertsQuery } from '@/store/api/alertsApi';
import { useGetDashboardQuery, useGetWeeklyReportQuery } from '@/store/api/analyticsApi';

const insightTone = (cat: 'improvement' | 'blocker' | 'recommendation') =>
  cat === 'improvement' ? 'success' : cat === 'blocker' ? 'warning' : 'info';

const insightLabel = (cat: 'improvement' | 'blocker' | 'recommendation') =>
  cat === 'improvement' ? 'Что улучшилось' : cat === 'blocker' ? 'Что тормозит' : 'Что делать';

export default function DashboardPage() {
  const { data: dashboard, isLoading: dashLoading } = useGetDashboardQuery();
  const { data: report } = useGetWeeklyReportQuery();
  const { data: alerts = [] } = useGetActiveAlertsQuery();

  if (dashLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-32" />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <Card>
        <CardBody>
          <p className="text-gray-600">Не удалось загрузить дашборд.</p>
        </CardBody>
      </Card>
    );
  }

  const cp = dashboard.currentProgram;
  const lastWeight = dashboard.bodyWeight[dashboard.bodyWeight.length - 1]?.value;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Дашборд</h1>

      {alerts
        .filter((a) => a.severity === 'critical')
        .map((a) => (
          <AlertBanner key={a.id} alert={a} />
        ))}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-brand-600" />
              <div>
                <p className="text-xs text-gray-500">Текущая неделя</p>
                <p className="text-xl font-bold">
                  {cp ? `${cp.weekNumber}/${cp.totalWeeks}` : '—'}
                </p>
                {cp && <Badge tone="info">{cp.phase}</Badge>}
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-xs text-gray-500">Регулярность</p>
                <p className="text-xl font-bold">{dashboard.consistencyScore}%</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <Scale className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-xs text-gray-500">Вес</p>
                <p className="text-xl font-bold">{lastWeight ? `${lastWeight} кг` : '—'}</p>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-xs text-gray-500">Avg RIR (main)</p>
                <p className="text-xl font-bold">
                  {dashboard.avgRIRMainLifts !== null
                    ? dashboard.avgRIRMainLifts.toFixed(1)
                    : '—'}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {cp && (
        <Card>
          <CardHeader>
            <CardTitle>Программа: {cp.name}</CardTitle>
          </CardHeader>
          <CardBody>
            <PhaseIndicator currentWeek={cp.weekNumber} />
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Прогресс недели</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="mb-3 flex items-end justify-between">
              <span className="text-3xl font-bold">
                {dashboard.weekProgress.completed}/{dashboard.weekProgress.planned}
              </span>
              <span className="text-sm text-gray-500">тренировок</span>
            </div>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full bg-brand-600 transition-all"
                style={{
                  width: `${
                    dashboard.weekProgress.planned
                      ? (dashboard.weekProgress.completed / dashboard.weekProgress.planned) * 100
                      : 0
                  }%`,
                }}
              />
            </div>

            {dashboard.weekProgress.upcoming.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-medium text-gray-700">Дальше</p>
                <div className="space-y-2">
                  {dashboard.weekProgress.upcoming.slice(0, 3).map((d) => (
                    <Link
                      key={d.dayId}
                      href={`/training/day/${d.dayId}`}
                      className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50"
                    >
                      <span className="text-sm">
                        День {d.dayNumber}: <span className="font-medium">{d.name}</span>
                      </span>
                      <Button size="sm">Начать</Button>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Недавние рекорды</CardTitle>
          </CardHeader>
          <CardBody>
            {dashboard.recentRecords.length === 0 ? (
              <p className="text-sm text-gray-500">
                Пока нет рекордов. Записывайте подходы — они появятся.
              </p>
            ) : (
              <div className="space-y-2">
                {dashboard.recentRecords.slice(0, 5).map((r) => (
                  <div key={r.exerciseId} className="flex items-center justify-between text-sm">
                    <span>{r.exerciseName}</span>
                    <div className="flex gap-3 text-xs">
                      <span className="font-medium">{r.prWeightKg} кг</span>
                      <Badge tone="success">e1RM {r.prE1rmKg.toFixed(0)}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {report && (
        <Card>
          <CardHeader>
            <CardTitle>Инсайты недели</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {report.insights.map((ins, i) => (
                <div key={i} className="rounded-lg border border-gray-200 p-3">
                  <Badge tone={insightTone(ins.category)}>{insightLabel(ins.category)}</Badge>
                  <p className="mt-2 text-sm font-semibold">{ins.title}</p>
                  <p className="mt-1 text-xs text-gray-600">{ins.message}</p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
