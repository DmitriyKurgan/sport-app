import { BodyweightGoal } from '../../profile/enums';
import { ProgramPhase } from '../../training-engine/enums';

/**
 * Расчёт целевой калорийности.
 * Источник: sport-research.md → nutritionSystem.calorieLogic.
 *
 * Safeguards:
 *   - cut: max −600 ккал/день (темп 0.5–1 кг/нед)
 *   - bulk: только малый профицит (+150 default)
 *   - deload уменьшает калории за счёт углеводов (в service), здесь общий −5%
 *   - accumulation добавляет +5% (высокий объём требует топлива)
 */
export function calculateCalorieTarget(params: {
  tdee: number;
  bodyweightGoal: BodyweightGoal;
  phase?: ProgramPhase | null;
}): number {
  const { tdee, bodyweightGoal, phase } = params;

  let baseTarget = tdee;
  switch (bodyweightGoal) {
    case BodyweightGoal.CUT: {
      const deficit = 300;
      baseTarget = Math.max(tdee - deficit, tdee - 600); // cap −600
      break;
    }
    case BodyweightGoal.BULK:
      baseTarget = tdee + 150;
      break;
    case BodyweightGoal.MAINTAIN:
    default:
      baseTarget = tdee;
      break;
  }

  // Фазовые корректировки (sport-research → linkToTraining)
  if (phase === ProgramPhase.ACCUMULATION) {
    baseTarget *= 1.05;
  }
  if (phase === ProgramPhase.DELOAD && bodyweightGoal !== BodyweightGoal.BULK) {
    baseTarget *= 0.95;
  }

  return Math.round(baseTarget);
}
