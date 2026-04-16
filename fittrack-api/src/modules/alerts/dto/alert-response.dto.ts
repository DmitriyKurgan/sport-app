import { Alert, AlertSeverity, AlertType } from '../alert.entity';

export class AlertResponseDto {
  id!: string;
  type!: AlertType;
  severity!: AlertSeverity;
  title!: string;
  message!: string;
  recommendation!: string;
  context!: Record<string, unknown> | null;
  triggeredAt!: Date;
  dismissedAt!: Date | null;
  actedUpon!: boolean;
  actedAt!: Date | null;

  static fromEntity(a: Alert): AlertResponseDto {
    const dto = new AlertResponseDto();
    dto.id = a.id;
    dto.type = a.type;
    dto.severity = a.severity;
    dto.title = a.title;
    dto.message = a.message;
    dto.recommendation = a.recommendation;
    dto.context = a.context;
    dto.triggeredAt = a.triggeredAt;
    dto.dismissedAt = a.dismissedAt;
    dto.actedUpon = a.actedUpon;
    dto.actedAt = a.actedAt;
    return dto;
  }
}

export class ActOnResultDto {
  alert!: AlertResponseDto;
  /** Что система сделала в результате. */
  performedAction!: string;
}
