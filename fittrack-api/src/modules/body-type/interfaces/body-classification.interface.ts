import { BodyComponent } from './body-scores.interface';

export type BodyType = 'ectomorph' | 'mesomorph' | 'endomorph' | 'hybrid';

export type ClassificationConfidence = 'low' | 'medium' | 'high';

export interface BodyClassification {
  type: BodyType;
  confidence: ClassificationConfidence;
  /** Заполняется только для hybrid: 2 наиболее выраженных компонента. */
  dominantComponents: BodyComponent[];
}
