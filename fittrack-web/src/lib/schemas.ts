import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Введите пароль'),
});
export type LoginFormValues = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z
    .string()
    .min(8, 'Минимум 8 символов')
    .regex(/[A-Z]/, 'Нужна минимум 1 заглавная буква')
    .regex(/\d/, 'Нужна минимум 1 цифра'),
  firstName: z.string().min(2, 'Минимум 2 символа').max(50),
  lastName: z.string().min(2, 'Минимум 2 символа').max(50),
});
export type RegisterFormValues = z.infer<typeof registerSchema>;

export const measurementSchema = z.object({
  weightKg: z.coerce.number().min(30).max(300),
  bodyFatPercent: z.coerce.number().min(3).max(60).optional(),
  chestCm: z.coerce.number().min(50).max(160).optional(),
  waistCm: z.coerce.number().min(40).max(200).optional(),
  hipsCm: z.coerce.number().min(50).max(180).optional(),
  bicepsCm: z.coerce.number().min(15).max(70).optional(),
  thighCm: z.coerce.number().min(30).max(100).optional(),
});
export type MeasurementFormValues = z.infer<typeof measurementSchema>;
