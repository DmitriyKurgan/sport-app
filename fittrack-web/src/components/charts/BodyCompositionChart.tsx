'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { BodyCompositionPoint } from '@/types';
import { ChartEmpty } from './ChartEmpty';

interface Props {
  data: BodyCompositionPoint[];
  height?: number;
}

/**
 * Multi-line chart по обхватам: chest, waist, hips, biceps, thigh.
 * Точки с null фильтруются на уровне Recharts (connectNulls=false).
 */
export function BodyCompositionChart({ data, height = 320 }: Props) {
  if (data.length === 0) return <ChartEmpty message="Замеров обхватов нет" />;

  const formatted = data.map((p) => ({
    ...p,
    label: new Date(p.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} unit=" см" />
        <Tooltip formatter={(v: number) => [`${v} см`, '']} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line type="monotone" dataKey="chestCm" stroke="#3b82f6" strokeWidth={2} dot={false} name="Грудь" connectNulls />
        <Line type="monotone" dataKey="waistCm" stroke="#ef4444" strokeWidth={2} dot={false} name="Талия" connectNulls />
        <Line type="monotone" dataKey="hipsCm" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Бёдра" connectNulls />
        <Line type="monotone" dataKey="bicepsCm" stroke="#10b981" strokeWidth={2} dot={false} name="Бицепс" connectNulls />
        <Line type="monotone" dataKey="thighCm" stroke="#f59e0b" strokeWidth={2} dot={false} name="Бедро" connectNulls />
      </LineChart>
    </ResponsiveContainer>
  );
}
