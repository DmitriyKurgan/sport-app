'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  proteinG: number;
  fatG: number;
  carbsG: number;
  height?: number;
}

const COLORS = {
  protein: '#ef4444',
  fat: '#f59e0b',
  carbs: '#3b82f6',
};

/**
 * Pie с распределением калорий БЖУ.
 * Конвертация: 1 г белка/углеводов = 4 ккал, 1 г жира = 9 ккал.
 */
export function MacrosChart({ proteinG, fatG, carbsG, height = 220 }: Props) {
  const data = [
    { name: 'Белок', value: proteinG * 4, grams: proteinG, color: COLORS.protein },
    { name: 'Жиры', value: fatG * 9, grams: fatG, color: COLORS.fat },
    { name: 'Углеводы', value: carbsG * 4, grams: carbsG, color: COLORS.carbs },
  ];
  const total = data.reduce((s, d) => s + d.value, 0);

  if (total === 0) {
    return <p className="text-sm text-gray-500">Нет данных по макросам</p>;
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
            label={(entry) => {
              const pct = Math.round((entry.value / total) * 100);
              return `${pct}%`;
            }}
          >
            {data.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, _name: string, props) => {
              const grams = props.payload.grams;
              return [`${grams}г · ${Math.round(value)} ккал`, props.payload.name];
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex gap-4 text-xs">
        {data.map((d) => (
          <div key={d.name} className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-sm" style={{ background: d.color }} />
            <span className="text-gray-600">
              {d.name}: <b>{d.grams}г</b>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
