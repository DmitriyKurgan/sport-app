/** Postgres DECIMAL → number (драйвер по умолчанию возвращает строку). */
export const decimalTransformer = {
  to: (v: number | null | undefined) => v,
  from: (v: string | null): number | null => (v === null ? null : parseFloat(v)),
};
