import { AlertSeverity, AlertType } from './enums';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  recommendation: string;
  context: Record<string, unknown> | null;
  triggeredAt: string;
  dismissedAt: string | null;
  actedUpon: boolean;
  actedAt: string | null;
}

export interface ActOnResult {
  alert: Alert;
  performedAction: string;
}
