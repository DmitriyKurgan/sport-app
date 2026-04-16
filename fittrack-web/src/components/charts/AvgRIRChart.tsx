'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
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
}

/**
 * Средний RIR по main_lifts по неделям.
 * Зона "опасная" (RIR < 1) подсвечена красным — близко к отказу,
 * "оптимальная" (1.5-3) зелёная.
 */
export function AvgRIRChart({ data, height = 240 }: Props) {
  if (data.length === 0) return <ChartEmpty message="Нет данных по RIR" />;

  const formatted = data.map((p) => ({
    ...p,
    label: new Date(p.date).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }),
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={formatted}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 5]} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v: number) => [v.toFixed(1), 'avg RIR']} />
        {/* Опасная зона: RIR < 1 */}
        <ReferenceArea y1={0} y2={1} fill="#ef4444" fillOpacity={0.1} />
        {/* Оптимальная: 1.5-3 */}
        <ReferenceArea y1={1.5} y2={3} fill="#10b981" fillOpacity={0.1} />
        <ReferenceLine y={1} stroke="#ef4444" strokeDasharray="4 4" label="overtraining" />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 4 }}
          name="avg RIR"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
