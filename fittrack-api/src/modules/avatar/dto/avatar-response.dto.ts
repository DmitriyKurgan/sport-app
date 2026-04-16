import { AvatarSnapshot } from '../avatar.entity';
import { AvatarDelta, AvatarParams } from '../interfaces/avatar-params.interface';

export class AvatarResponseDto implements AvatarParams {
  id!: string;
  heightScale!: number;
  shoulderWidth!: number;
  chestDepth!: number;
  waistWidth!: number;
  hipWidth!: number;
  armGirth!: number;
  thighGirth!: number;
  muscleDefinition!: number;
  bodyFatLayer!: number;
  createdAt!: Date;

  static fromEntity(entity: AvatarSnapshot): AvatarResponseDto {
    const dto = new AvatarResponseDto();
    dto.id = entity.id;
    dto.heightScale = entity.heightScale;
    dto.shoulderWidth = entity.shoulderWidth;
    dto.chestDepth = entity.chestDepth;
    dto.waistWidth = entity.waistWidth;
    dto.hipWidth = entity.hipWidth;
    dto.armGirth = entity.armGirth;
    dto.thighGirth = entity.thighGirth;
    dto.muscleDefinition = entity.muscleDefinition;
    dto.bodyFatLayer = entity.bodyFatLayer;
    dto.createdAt = entity.createdAt;
    return dto;
  }
}

export class AvatarTransformationDto {
  from!: AvatarResponseDto;
  to!: AvatarResponseDto;
  delta!: AvatarDelta;
}
