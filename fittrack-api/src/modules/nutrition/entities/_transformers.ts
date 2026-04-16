export const decimalTransformer = {
  to: (v: number | null | undefined) => v,
  from: (v: string | null): number | null => (v === null ? null : parseFloat(v)),
};
