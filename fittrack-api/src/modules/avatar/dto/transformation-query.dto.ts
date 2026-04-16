import { Type } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';

export class TransformationQueryDto {
  /** ISO-дата. По умолчанию — самый старый snapshot. */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  from?: Date;

  /** ISO-дата. По умолчанию — текущий (самый свежий) snapshot. */
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  to?: Date;
}
