/**
 * Возвращает дату начала недели (понедельник) для переданной даты.
 * Используется для агрегаций по неделям.
 */
export function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay() || 7; // Sunday=7, Monday=1
  d.setHours(0, 0, 0, 0);
  if (day !== 1) d.setDate(d.getDate() - (day - 1));
  return d;
}

/** Дата на N дней назад от now. */
export function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Конец недели (воскресенье 23:59:59). */
export function endOfWeek(date: Date): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}
