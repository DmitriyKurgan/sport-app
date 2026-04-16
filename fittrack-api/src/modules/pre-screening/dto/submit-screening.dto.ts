import {
  IsDefined,
  IsObject,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';

/** Кастомный валидатор: проверяет что все значения — boolean. */
function IsAnswersMap(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isAnswersMap',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
          return Object.values(value as Record<string, unknown>).every(
            (v) => typeof v === 'boolean',
          );
        },
        defaultMessage() {
          return 'answers должен быть объектом вида { question_id: boolean }';
        },
      },
    });
  };
}

/**
 * Ответы на PAR-Q+: объект `{ question_id: boolean }`.
 * Валидация полноты question_id выполняется в сервисе.
 */
export class SubmitScreeningDto {
  @IsDefined()
  @IsObject()
  @IsAnswersMap()
  answers!: Record<string, boolean>;
}
