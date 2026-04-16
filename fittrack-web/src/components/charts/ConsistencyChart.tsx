'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ChartDataPoint } from '@/types';
import { ChartEmpty } from './ChartEmpty';

interface Props {
  data: ChartDataPoint[]; // value 0..100 (%)
  height?: number;
}

const colorFor = (pct: number): string => {
  if (pct >= 80) return '#10b981';
  if (pct >= 50) return '#f59e0b';
  return '#ef4444';
};

export function ConsistencyChart({ data, height = 240 }: Props) {
  if (data.length === 0) return <ChartEmpty message="Нет данных за период" />;

  const formatted = data.map((p) => ({
    ...p,
    label: new Date(p.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
        <Tooltip formatter={(v: number) => [`${v}%`, 'Adherence']} />
        <ReferenceLine y={80} stroke="#10b981" strokeDasharray="4 4" />
        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
          {formatted.map((p, i) => (
            <Cell key={i} fill={colorFor(p.value)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
