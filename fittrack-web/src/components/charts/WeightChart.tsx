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
import { ChartEmpty } from './ChartEmpty';

export interface WeightChartPoint {
  date: string;
  weightKg: number;
  avg7d: number | null;
  avg14d: number | null;
}

interface Props {
  data: WeightChartPoint[];
  height?: number;
}

export function WeightChart({ data, height = 280 }: Props) {
  if (data.length === 0) return <ChartEmpty />;

  const formatted = data.map((p) => ({
    ...p,
    label: new Date(p.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{ fontSize: 12 }} unit=" кг" />
        <Tooltip
          formatter={(v: number) => [`${v} кг`, '']}
          labelStyle={{ fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Line
          type="monotone"
          dataKey="weightKg"
          stroke="#3b82f6"
          strokeWidth={1}
          dot={false}
          name="Вес"
        />
        <Line
          type="monotone"
          dataKey="avg7d"
          stroke="#10b981"
          strokeWidth={2}
          dot={false}
          name="7-day avg"
        />
        <Line
          type="monotone"
          dataKey="avg14d"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={false}
          name="14-day avg"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
