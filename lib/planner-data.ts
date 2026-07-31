import type { TaskCategory, Quarter } from "./planner-types";

/** Vagas fixas por dia. Regra 1-3-5: acabou a vaga, acabou — vira Inbox. */
export const SLOT_LIMITS: Record<Exclude<TaskCategory, "inbox">, number> = {
  big: 1,
  medium: 3,
  small: 5,
};

export const CATEGORY_LABEL: Record<Exclude<TaskCategory, "inbox">, string> = {
  big: "Grande",
  medium: "Média",
  small: "Pequena",
};

/** Ordem de exibição do funil, do maior compromisso ao menor. */
export const CATEGORY_ORDER: readonly Exclude<TaskCategory, "inbox">[] = [
  "big",
  "medium",
  "small",
];

export const QUARTERS: readonly Quarter[] = ["Q1", "Q2", "Q3", "Q4"];

export const QUARTER_LABEL: Record<Quarter, string> = {
  Q1: "Jan – Mar",
  Q2: "Abr – Jun",
  Q3: "Jul – Set",
  Q4: "Out – Dez",
};

/** Início e fim da régua de horários no painel de cronograma. */
export const SCHEDULE_START_HOUR = 6;
export const SCHEDULE_END_HOUR = 22;
