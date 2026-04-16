export interface PARQQuestion {
  id: string;
  text: string;
  redFlagIfYes: boolean;
  requiresClarification?: boolean;
}

export interface SubmitScreeningRequest {
  answers: Record<string, boolean>;
}

export interface ScreeningResult {
  id: string;
  redFlags: boolean;
  redFlagReasons: string[];
  recommendation: string;
  createdAt: string;
}
