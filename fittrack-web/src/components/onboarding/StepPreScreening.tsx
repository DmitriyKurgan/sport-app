'use client';

import { Card, CardBody } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { useGetQuestionsQuery } from '@/store/api/screeningApi';

interface Props {
  answers: Record<string, boolean>;
  onChange: (next: Record<string, boolean>) => void;
}

export function StepPreScreening({ answers, onChange }: Props) {
  const { data, isLoading } = useGetQuestionsQuery();

  if (isLoading || !data) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  const setAnswer = (id: string, value: boolean) => {
    onChange({ ...answers, [id]: value });
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600">
        Ответьте на короткий опрос (PAR-Q+) — это нужно для безопасного старта тренировок.
        Ваши ответы конфиденциальны.
      </p>
      {data.questions.map((q) => (
        <Card key={q.id}>
          <CardBody>
            <p className="mb-3 text-sm font-medium text-gray-900">{q.text}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setAnswer(q.id, false)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  answers[q.id] === false
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                Нет
              </button>
              <button
                type="button"
                onClick={() => setAnswer(q.id, true)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  answers[q.id] === true
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                Да
              </button>
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

export function isPreScreeningComplete(
  answers: Record<string, boolean>,
  expectedIds: string[],
): boolean {
  return expectedIds.every((id) => id in answers);
}
