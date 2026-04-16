export enum EquipmentAccess {
  BODYWEIGHT = 'bodyweight',
  HOME_DUMBBELLS = 'home_dumbbells',
  GYM = 'gym',
  ADVANCED_GYM = 'advanced_gym',
}

/** Ранжирование для фильтрации упражнений: exercise.equipmentAccessMin <= profile.equipmentAccess. */
export const EQUIPMENT_ACCESS_RANK: Record<EquipmentAccess, number> = {
  [EquipmentAccess.BODYWEIGHT]: 0,
  [EquipmentAccess.HOME_DUMBBELLS]: 1,
  [EquipmentAccess.GYM]: 2,
  [EquipmentAccess.ADVANCED_GYM]: 3,
};
