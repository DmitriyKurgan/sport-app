/**
 * Извлекает человекочитаемое сообщение из ошибки RTK Query.
 * Бекенд возвращает либо строку, либо массив (валидация class-validator).
 */
export function getErrorMessage(err: unknown, fallback = 'Что-то пошло не так'): string {
  if (!err || typeof err !== 'object') return fallback;
  const e = err as { data?: { message?: string | string[] }; status?: number };
  const msg = e.data?.message;
  if (Array.isArray(msg)) return msg.join('; ');
  if (typeof msg === 'string') return msg;
  if (e.status === 0) return 'Сервер недоступен — проверьте подключение';
  return fallback;
}
