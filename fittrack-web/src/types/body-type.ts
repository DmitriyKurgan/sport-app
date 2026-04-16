export type BodyType = 'ectomorph' | 'mesomorph' | 'endomorph' | 'hybrid';
export type ClassificationConfidence = 'low' | 'medium' | 'high';
export type BodyComponent = 'adiposity' | 'muscularity' | 'linearity';

export interface BodyTypeSnapshot {
  id: string;
  adiposityScore: number;
  muscularityScore: number;
  linearityScore: number;
  classification: BodyType;
  confidence: ClassificationConfidence;
  dominantComponents: BodyComponent[];
  createdAt: string;
}

export interface BodyTypeHistory {
  snapshots: BodyTypeSnapshot[];
}
