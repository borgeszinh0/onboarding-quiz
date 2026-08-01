import type { PlannerState, Task, TaskCategory } from "./planner-types";
import { SLOT_LIMITS } from "./planner-data";

export type DayMode = "low" | "medium" | "high";
export type TaskFitGroup = "recommended" | "compatible" | "saveForLater";
export type FunnelCategory = Exclude<TaskCategory, "inbox">;

export const DEFAULT_DAY_MODE: DayMode = "medium";

export const DAY_MODE_RULES: Record<
  DayMode,
  {
    label: string;
    strategy: string;
    recommendedTasks: Record<FunnelCategory, number>;
    maxRecommendedTasks: number;
    maxRecommendedPlannedMinutes: number;
    preferredCategories: FunnelCategory[];
    discouragedCategories: Array<FunnelCategory | "small-before-big">;
    defaultBlockMinutes: Record<FunnelCategory, number>;
    maxFocusBlockMinutes: number;
    breakAfterBlockMinutes: number;
    summary: string;
    compatibleFeedback: string;
    incompatibleFeedback: string;
  }
> = {
  low: {
    label: "Baixa",
    strategy: "Manutenção",
    recommendedTasks: { big: 0, medium: 1, small: 3 },
    maxRecommendedTasks: 4,
    maxRecommendedPlannedMinutes: 120,
    preferredCategories: ["small", "medium"],
    discouragedCategories: ["big"],
    defaultBlockMinutes: { big: 45, medium: 25, small: 15 },
    maxFocusBlockMinutes: 25,
    breakAfterBlockMinutes: 5,
    summary: "Modo Manutenção recomenda pendências leves, revisão e blocos curtos.",
    compatibleFeedback: "Combina com Manutenção",
    incompatibleFeedback: "Talvez pese hoje",
  },
  medium: {
    label: "Média",
    strategy: "Execução",
    recommendedTasks: { big: 1, medium: 2, small: 3 },
    maxRecommendedTasks: 6,
    maxRecommendedPlannedMinutes: 210,
    preferredCategories: ["medium", "big", "small"],
    discouragedCategories: [],
    defaultBlockMinutes: { big: 60, medium: 45, small: 25 },
    maxFocusBlockMinutes: 60,
    breakAfterBlockMinutes: 10,
    summary: "Modo Execução favorece tarefas médias importantes e uma rotina protegida.",
    compatibleFeedback: "Combina com Execução",
    incompatibleFeedback: "Cabe hoje",
  },
  high: {
    label: "Alta",
    strategy: "Criação",
    recommendedTasks: { big: 1, medium: 2, small: 1 },
    maxRecommendedTasks: 4,
    maxRecommendedPlannedMinutes: 240,
    preferredCategories: ["big", "medium"],
    discouragedCategories: ["small-before-big"],
    defaultBlockMinutes: { big: 90, medium: 60, small: 25 },
    maxFocusBlockMinutes: 90,
    breakAfterBlockMinutes: 15,
    summary: "Modo Criação favorece uma tarefa grande com foco protegido.",
    compatibleFeedback: "Combina com Criação",
    incompatibleFeedback: "Melhor depois do bloco principal",
  },
};

const CATEGORY_SCORE: Record<DayMode, Record<FunnelCategory, number>> = {
  low: { small: 90, medium: 65, big: 25 },
  medium: { small: 65, medium: 90, big: 75 },
  high: { small: 40, medium: 75, big: 95 },
};

export function getDayMode(state: PlannerState, date: string): DayMode {
  const log = state.dayLogs.find((dayLog) => dayLog.date === date);
  return log?.mode ?? log?.energy ?? DEFAULT_DAY_MODE;
}

export function getModeSource(state: PlannerState, date: string): "chosen" | "inferred" {
  const log = state.dayLogs.find((dayLog) => dayLog.date === date);
  return log?.mode || log?.energy ? "chosen" : "inferred";
}

export function inferTaskFitCategory(task: Task): FunnelCategory {
  if (task.category !== "inbox") return task.category;
  if (!task.estimatedMinutes) return "medium";
  if (task.estimatedMinutes <= 25) return "small";
  if (task.estimatedMinutes <= 60) return "medium";
  return "big";
}

export function daysSince(timestamp: number): number {
  const elapsed = Date.now() - timestamp;
  return Math.max(0, Math.floor(elapsed / 86400000));
}

export function getPlannedCountByCategory(
  state: PlannerState,
  date: string,
  category: FunnelCategory
): number {
  return state.tasks.filter((task) => task.date === date && task.category === category).length;
}

export function getTaskFitScore({
  state,
  date,
  mode,
  task,
  category,
}: {
  state: PlannerState;
  date: string;
  mode: DayMode;
  task: Task;
  category?: FunnelCategory;
}): number {
  const targetCategory = category ?? inferTaskFitCategory(task);
  const rules = DAY_MODE_RULES[mode];
  const plannedCount = getPlannedCountByCategory(state, date, targetCategory);
  const ageBonus = Math.min(10, daysSince(task.createdAt) * 2);
  const budgetPenalty =
    plannedCount >= rules.recommendedTasks[targetCategory] ? 25 : 0;

  return Math.max(
    0,
    Math.min(100, CATEGORY_SCORE[mode][targetCategory] + ageBonus - budgetPenalty)
  );
}

export function getFitGroup(score: number): TaskFitGroup {
  if (score >= 75) return "recommended";
  if (score >= 50) return "compatible";
  return "saveForLater";
}

export function getFitLabel(mode: DayMode, group: TaskFitGroup): string {
  if (group === "recommended") return DAY_MODE_RULES[mode].compatibleFeedback;
  if (group === "compatible") return "Cabe hoje";
  return DAY_MODE_RULES[mode].incompatibleFeedback;
}

export function sortTasksForMode(
  tasks: Task[],
  state: PlannerState,
  date: string,
  mode: DayMode,
  category?: FunnelCategory
): Array<{ task: Task; score: number; group: TaskFitGroup }> {
  return tasks
    .map((task) => {
      const score = getTaskFitScore({ state, date, mode, task, category });
      return { task, score, group: getFitGroup(score) };
    })
    .sort((a, b) => b.score - a.score || a.task.createdAt - b.task.createdAt);
}

export function groupTasksForTodayRecommendation(
  tasks: Task[],
  state: PlannerState,
  date: string,
  mode: DayMode
): Array<{ task: Task; score: number; group: TaskFitGroup }> {
  const rules = DAY_MODE_RULES[mode];
  const remainingSlots = Object.fromEntries(
    (Object.keys(SLOT_LIMITS) as FunnelCategory[]).map((category) => [
      category,
      Math.max(0, SLOT_LIMITS[category] - getPlannedCountByCategory(state, date, category)),
    ])
  ) as Record<FunnelCategory, number>;
  const remainingRecommended = Object.fromEntries(
    (Object.keys(SLOT_LIMITS) as FunnelCategory[]).map((category) => [
      category,
      Math.max(
        0,
        rules.recommendedTasks[category] - getPlannedCountByCategory(state, date, category)
      ),
    ])
  ) as Record<FunnelCategory, number>;

  return tasks
    .map((task) => {
      const score = getTaskFitScore({ state, date, mode, task });
      return {
        task,
        score,
        category: inferTaskFitCategory(task),
      };
    })
    .sort((a, b) => b.score - a.score || a.task.createdAt - b.task.createdAt)
    .map(({ task, score, category }) => {
      let group: TaskFitGroup = "saveForLater";
      if (remainingSlots[category] > 0 && score >= 50) {
        if (remainingRecommended[category] > 0) {
          group = "recommended";
          remainingRecommended[category] -= 1;
        } else {
          group = "compatible";
        }
        remainingSlots[category] -= 1;
      }
      return { task, score, group };
    });
}

export function getRecommendedBudgetCopy(
  state: PlannerState,
  date: string,
  mode: DayMode,
  category: FunnelCategory
): string {
  const rules = DAY_MODE_RULES[mode];
  const count = getPlannedCountByCategory(state, date, category);
  const recommended = rules.recommendedTasks[category];

  if (count > recommended) {
    return `Acima do recomendado para ${rules.strategy}.`;
  }
  return "Dentro do ritmo de hoje.";
}

export function getScheduleSuggestion(mode: DayMode, category: FunnelCategory): string {
  const rules = DAY_MODE_RULES[mode];
  const duration = rules.defaultBlockMinutes[category];
  if (mode === "high" && category === "big") {
    return `Sugestão: ${duration} min de foco protegido.`;
  }
  return `Sugestão: ${duration} min + pausa de ${rules.breakAfterBlockMinutes} min.`;
}
