import { Type } from 'class-transformer';
import { IsArray, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { EquipmentAccess } from '../../profile/enums';
import { MovementPattern, MuscleGroup } from '../../training-engine/enums';

export class CatalogQueryDto {
  @IsOptional()
  @IsEnum(MovementPattern, { each: true })
  @IsArray()
  @Type(() => String)
  patterns?: MovementPattern[];

  @IsOptional()
  @IsEnum(MuscleGroup, { each: true })
  @IsArray()
  @Type(() => String)
  muscles?: MuscleGroup[];

  @IsOptional()
  @IsEnum(EquipmentAccess)
  equipmentAccess?: EquipmentAccess;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  difficultyMin?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  difficultyMax?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit?: number;
}
