import { LineChart } from 'lucide-react';

interface Props {
  message?: string;
  height?: number;
}

export function ChartEmpty({ message = 'Нет данных за период', height = 200 }: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 text-center text-sm text-gray-500"
      style={{ height }}
    >
      <LineChart className="h-8 w-8 text-gray-400" />
      {message}
    </div>
  );
}
