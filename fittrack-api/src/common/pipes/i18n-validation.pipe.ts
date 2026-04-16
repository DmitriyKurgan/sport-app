import { BadRequestException, ValidationPipe, ValidationPipeOptions } from '@nestjs/common';
import { ValidationError } from 'class-validator';

const TEMPLATES: Record<string, (p: string, ctx: Record<string, any>) => string> = {
  isString: (p) => `Поле "${p}" должно быть строкой`,
  isNumber: (p) => `Поле "${p}" должно быть числом`,
  isInt: (p) => `Поле "${p}" должно быть целым числом`,
  isBoolean: (p) => `Поле "${p}" должно быть true или false`,
  isEmail: (p) => `Поле "${p}" должно быть корректным email`,
  isUUID: (p) => `Поле "${p}" должно быть UUID`,
  isUrl: (p) => `Поле "${p}" должно быть URL`,
  isDate: (p) => `Поле "${p}" должно быть датой`,
  isDateString: (p) => `Поле "${p}" должно быть датой в формате ISO`,
  isArray: (p) => `Поле "${p}" должно быть массивом`,
  isObject: (p) => `Поле "${p}" должно быть объектом`,
  isEnum: (p, ctx) => `Поле "${p}" должно быть одним из: ${listEnum(ctx)}`,
  isPositive: (p) => `Поле "${p}" должно быть больше нуля`,
  isNegative: (p) => `Поле "${p}" должно быть меньше нуля`,
  isNotEmpty: (p) => `Поле "${p}" обязательно`,
  isDefined: (p) => `Поле "${p}" обязательно`,
  isEmpty: (p) => `Поле "${p}" должно быть пустым`,
  min: (p, ctx) => `Поле "${p}" должно быть не меньше ${ctx.min ?? '?'}`,
  max: (p, ctx) => `Поле "${p}" должно быть не больше ${ctx.max ?? '?'}`,
  minLength: (p, ctx) => `Поле "${p}" должно быть не короче ${ctx.constraints?.[0] ?? '?'} символов`,
  maxLength: (p, ctx) => `Поле "${p}" должно быть не длиннее ${ctx.constraints?.[0] ?? '?'} символов`,
  length: (p, ctx) => {
    const [a, b] = ctx.constraints ?? [];
    return `Поле "${p}" должно быть длиной от ${a} до ${b} символов`;
  },
  arrayMinSize: (p, ctx) => `Массив "${p}" должен содержать не меньше ${ctx.constraints?.[0] ?? '?'} элементов`,
  arrayMaxSize: (p, ctx) => `Массив "${p}" должен содержать не больше ${ctx.constraints?.[0] ?? '?'} элементов`,
  arrayNotEmpty: (p) => `Массив "${p}" не должен быть пустым`,
  arrayUnique: (p) => `Элементы массива "${p}" должны быть уникальны`,
  matches: (p) => `Поле "${p}" имеет недопустимый формат`,
  whitelistValidation: (p) => `Поле "${p}" не разрешено`,
};

function listEnum(ctx: Record<string, any>): string {
  const constraints = ctx.constraints?.[0];
  if (!constraints) return '?';
  if (Array.isArray(constraints)) return constraints.join(', ');
  if (typeof constraints === 'object') return Object.values(constraints).join(', ');
  return String(constraints);
}

function localizeOne(error: ValidationError, parentPath = ''): string[] {
  const path = parentPath ? `${parentPath}.${error.property}` : error.property;
  const out: string[] = [];

  if (error.constraints) {
    for (const [key, defaultMsg] of Object.entries(error.constraints)) {
      const tpl = TEMPLATES[key];
      if (tpl) {
        const ctx = { constraints: (error as any).contexts?.[key]?.constraints, ...(error as any).contexts?.[key] };
        out.push(tpl(path, ctx));
      } else {
        out.push(defaultMsg);
      }
    }
  }

  if (error.children?.length) {
    for (const child of error.children) {
      out.push(...localizeOne(child, path));
    }
  }

  return out;
}

export class I18nValidationPipe extends ValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      ...options,
      exceptionFactory: (errors: ValidationError[]) => {
        const messages = errors.flatMap((e) => localizeOne(e));
        return new BadRequestException({
          statusCode: 400,
          message: messages,
          error: 'Bad Request',
        });
      },
    });
  }
}
