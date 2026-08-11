import type { PlannerState, Task, TaskCategory } from "./planner-types";

export type DayMode = "focus" | "maintenance";
export type FunnelCategory = Exclude<TaskCategory, "inbox">;

export const DEFAULT_DAY_MODE: DayMode = "focus";

/**
 * Tipo de dia binário. Substituiu o modo triplo (low/medium/high) que
 * adicionava uma camada de ajuste sem afetar resultado. Hoje só respondem a
 * duas perguntas: qual a duração padrão de um bloco e se a tarefa grande
 * ganha foco protegido.
 */
export const DAY_MODE_RULES: Record<
  DayMode,
  {
    label: string;
    strategy: string;
    defaultBlockMinutes: Record<FunnelCategory, number>;
    maxFocusBlockMinutes: number;
    breakAfterBlockMinutes: number;
    summary: string;
  }
> = {
  focus: {
    label: "Foco",
    strategy: "Foco no grande",
    defaultBlockMinutes: { big: 90, medium: 60, small: 25 },
    maxFocusBlockMinutes: 90,
    breakAfterBlockMinutes: 15,
    summary: "Dia de foco: a tarefa grande vem primeiro, com foco protegido.",
  },
  maintenance: {
    label: "Manutenção",
    strategy: "Manutenção",
    defaultBlockMinutes: { big: 45, medium: 25, small: 15 },
    maxFocusBlockMinutes: 25,
    breakAfterBlockMinutes: 5,
    summary: "Dia de pendências, revisão e blocos curtos.",
  },
};

/** Modos legados (low/medium/high) antes da reescrita para tipo binário. */
const LEGACY_MODE: Record<string, DayMode> = {
  low: "maintenance",
  medium: "focus",
  high: "focus",
};

export function getDayMode(state: PlannerState, date: string): DayMode {
  const log = state.dayLogs.find((dayLog) => dayLog.date === date);
  const raw = log?.mode ?? log?.energy;
  if (raw === "focus" || raw === "maintenance") return raw;
  if (raw && raw in LEGACY_MODE) return LEGACY_MODE[raw];
  return DEFAULT_DAY_MODE;
}

export function getModeSource(state: PlannerState, date: string): "chosen" | "inferred" {
  const log = state.dayLogs.find((dayLog) => dayLog.date === date);
  return log?.mode || log?.energy ? "chosen" : "inferred";
}

/** Palpite de categoria a partir do título+duração, sem campo extra. */
export function inferTaskFitCategory(task: Task): FunnelCategory {
  if (task.category !== "inbox") return task.category;
  if (!task.estimatedMinutes) return "medium";
  if (task.estimatedMinutes <= 25) return "small";
  if (task.estimatedMinutes <= 60) return "medium";
  return "big";
}

/** Sugestão de duração exibida no formulário de agendamento. */
export function getScheduleSuggestion(mode: DayMode, category: FunnelCategory): string {
  const rules = DAY_MODE_RULES[mode];
  const duration = rules.defaultBlockMinutes[category];
  if (mode === "focus" && category === "big") {
    return `Sugestão: ${duration} min de foco protegido.`;
  }
  return `Sugestão: ${duration} min + pausa de ${rules.breakAfterBlockMinutes} min.`;
}