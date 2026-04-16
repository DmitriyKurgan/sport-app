import { BodyTypeSnapshot } from '../body-type.entity';
import { BodyComponent, BodyType, ClassificationConfidence } from '../interfaces';

export class BodyTypeResponseDto {
  id!: string;
  adiposityScore!: number;
  muscularityScore!: number;
  linearityScore!: number;
  classification!: BodyType;
  confidence!: ClassificationConfidence;
  dominantComponents!: BodyComponent[];
  createdAt!: Date;

  static fromEntity(entity: BodyTypeSnapshot): BodyTypeResponseDto {
    const dto = new BodyTypeResponseDto();
    dto.id = entity.id;
    dto.adiposityScore = entity.adiposityScore;
    dto.muscularityScore = entity.muscularityScore;
    dto.linearityScore = entity.linearityScore;
    dto.classification = entity.classification;
    dto.confidence = entity.confidence;
    dto.dominantComponents = entity.dominantComponents;
    dto.createdAt = entity.createdAt;
    return dto;
  }
}

export class BodyTypeHistoryDto {
  snapshots!: BodyTypeResponseDto[];
}
