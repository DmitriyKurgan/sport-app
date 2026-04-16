export interface AvatarParams {
  heightScale: number;
  shoulderWidth: number;
  chestDepth: number;
  waistWidth: number;
  hipWidth: number;
  armGirth: number;
  thighGirth: number;
  muscleDefinition: number; // 0..1
  bodyFatLayer: number; // 0..1
}

export interface AvatarSnapshot extends AvatarParams {
  id: string;
  createdAt: string;
}

export type AvatarDelta = {
  [K in keyof AvatarParams]: number;
};

export interface AvatarTransformation {
  from: AvatarSnapshot;
  to: AvatarSnapshot;
  delta: AvatarDelta;
}
