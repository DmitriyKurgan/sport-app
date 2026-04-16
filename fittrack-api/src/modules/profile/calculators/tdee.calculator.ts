/**
 * TDEE (Total Daily Energy Expenditure) = REE × activityFactor.
 *
 * @returns TDEE в ккал/день, округлённый до целого
 */
export function calculateTDEE(ree: number, activityFactor: number): number {
  return Math.round(ree * activityFactor);
}
