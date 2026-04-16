'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartDataPoint } from '@/types';
import { ChartEmpty } from './ChartEmpty';

interface Props {
  data: ChartDataPoint[];
  height?: number;
  color?: string;
  unit?: string;
}

export function VolumeLoadChart({
  data,
  height = 240,
  color = '#3b82f6',
  unit = ' кг',
}: Props) {
  if (data.length === 0) return <ChartEmpty />;

  const formatted = data.map((p) => ({
    ...p,
    label: new Date(p.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(v: number) => [`${v.toLocaleString('ru-RU')}${unit}`, 'Volume Load']}
        />
        <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
