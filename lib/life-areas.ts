import type { LifeArea, Task } from "./planner-types";

/**
 * Áreas da vida — hoje são apenas uma classificação opcional de tarefas e
 * hábitos (tag). O radar, a pontuação e os alvos saíram do produto: mediam
 * volume de atividade, não resultado em metas.
 */

export const LIFE_AREA_ORDER: readonly LifeArea[] = [
  "body",
  "mind",
  "social",
  "spiritual",
  "financial",
  "professional",
];

export const LIFE_AREA_LABEL: Record<LifeArea, string> = {
  body: "Corpo",
  mind: "Mente",
  social: "Social",
  spiritual: "Espiritual",
  financial: "Financeiro",
  professional: "Profissional",
};

export const LIFE_AREA_COLOR: Record<LifeArea, string> = {
  body: "#34d399",
  mind: "#38bdf8",
  social: "#fb7185",
  spiritual: "#c084fc",
  financial: "#fbbf24",
  professional: "#818cf8",
};

export function filterTasksByLifeArea<T extends Pick<Task, "lifeArea">>(
  tasks: readonly T[],
  area: LifeArea | null
): T[] {
  if (!area) return [...tasks];
  return tasks.filter((task) => task.lifeArea === area);
}