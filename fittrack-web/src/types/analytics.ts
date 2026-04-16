export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ProgramSummaryInfo {
  id: string;
  name: string;
  weekNumber: number;
  totalWeeks: number;
  phase: string;
  completedDays: number;
  totalDays: number;
}

export interface WeekProgressInfo {
  planned: number;
  completed: number;
  upcoming: Array<{ dayId: string; name: string; dayNumber: number }>;
}

export interface RecordCard {
  exerciseId: string;
  exerciseName: string;
  prWeightKg: number;
  prE1rmKg: number;
  achievedAt: string;
}

export interface DashboardResponse {
  currentProgram: ProgramSummaryInfo | null;
  weekProgress: WeekProgressInfo;
  recentRecords: RecordCard[];
  bodyWeight: ChartDataPoint[];
  totalVolume: ChartDataPoint[];
  internalLoad: ChartDataPoint[];
  avgRIRMainLifts: number | null;
  consistencyScore: number;
}

export interface ExerciseProgressPoint {
  date: string;
  weightKg: number;
  reps: number;
  e1rm: number;
}

export interface BodyCompositionPoint {
  date: string;
  weightKg: number;
  bodyFatPercent: number | null;
  chestCm: number | null;
  waistCm: number | null;
  hipsCm: number | null;
  bicepsCm: number | null;
  thighCm: number | null;
}

export interface WeeklyInsight {
  category: 'improvement' | 'blocker' | 'recommendation';
  title: string;
  message: string;
}

export interface WeeklyReport {
  weekStart: string;
  weekEnd: string;
  insights: WeeklyInsight[];
  metrics: {
    completedSessions: number;
    plannedSessions: number;
    avgRIR: number | null;
    totalVolumeLoad: number;
    totalInternalLoad: number;
  };
}
