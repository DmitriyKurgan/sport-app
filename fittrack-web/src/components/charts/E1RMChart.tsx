'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ExerciseProgressPoint } from '@/types';
import { ChartEmpty } from './ChartEmpty';

interface Props {
  data: ExerciseProgressPoint[];
  height?: number;
  exerciseName?: string;
}

/**
 * Прогресс силы по конкретному упражнению через estimated 1RM (формула Эпли).
 */
export function E1RMChart({ data, height = 280, exerciseName }: Props) {
  if (data.length === 0) return <ChartEmpty message="Нет логов по упражнению" />;

  const formatted = data.map((p) => ({
    ...p,
    label: new Date(p.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis domain={['dataMin - 5', 'dataMax + 5']} tick={{ fontSize: 12 }} unit=" кг" />
        <Tooltip
          formatter={(v: number, name: string) => {
            if (name === 'e1rm') return [`${v} кг`, 'e1RM'];
            if (name === 'weightKg') return [`${v} кг`, 'Рабочий вес'];
            return [v, name];
          }}
        />
        <Line
          type="monotone"
          dataKey="e1rm"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3 }}
          name={exerciseName ? `e1RM (${exerciseName})` : 'e1RM'}
        />
        <Line
          type="monotone"
          dataKey="weightKg"
          stroke="#3b82f6"
          strokeWidth={1}
          strokeDasharray="4 4"
          dot={false}
          name="Рабочий вес"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
