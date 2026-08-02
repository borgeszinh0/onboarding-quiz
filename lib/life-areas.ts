import type { Habit, LifeArea, PlannerState, Task, TaskCategory } from "./planner-types";

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

export interface LifeAreaDetail {
  tasksCompleted: number;
  focusMinutes: number;
  linkedHabits: number;
  habitCompletions: number;
  points: number;
}

export interface LifeAreaRadarRow {
  area: LifeArea;
  label: string;
  color: string;
  current: number;
  previous: number | null;
  target: number;
  detail: LifeAreaDetail;
}

const FOCUS_UNIT_MS = 25 * 60_000;
const DEFAULT_TARGET = 75;

const TASK_POINTS: Record<TaskCategory, number> = {
  inbox: 0,
  small: 1,
  medium: 2,
  big: 3,
};

const AREA_KEYWORDS: Record<LifeArea, readonly string[]> = {
  body: [
    "agua",
    "beber",
    "caminhar",
    "consulta",
    "corpo",
    "dormir",
    "exercicio",
    "saude",
    "sono",
    "treino",
  ],
  mind: [
    "aula",
    "estudo",
    "estudar",
    "ler",
    "livro",
    "mente",
    "notas",
    "pesquisar",
    "revisar materiais",
  ],
  social: [
    "audio",
    "conversa",
    "follow-up",
    "mensagem",
    "mentoria",
    "perguntar",
    "reuniao",
    "social",
  ],
  spiritual: [
    "journaling",
    "meditar",
    "meditacao",
    "reflexao",
    "ritual",
    "silencio",
  ],
  financial: [
    "boleto",
    "compras",
    "financeiro",
    "gastos",
    "orcamento",
    "pagar",
    "recibos",
  ],
  professional: [
    "app",
    "arquitetura",
    "backlog",
    "briefing",
    "checklist",
    "deploy",
    "designer",
    "documentacao",
    "metrica",
    "onboarding",
    "produto",
    "proposta",
    "reuniao",
    "ui",
    "widget",
  ],
};

export function getLifeAreaRadarRows(
  state: PlannerState,
  referenceDate = new Date()
): {
  rows: LifeAreaRadarRow[];
  hasPrevious: boolean;
  classifiedItems: number;
  hasAnyExecution: boolean;
  isEarly: boolean;
} {
  const currentEnd = endOfDay(referenceDate);
  const currentStart = addDays(currentEnd, -29);
  const previousEnd = addDays(currentStart, -1);
  const previousStart = addDays(previousEnd, -29);

  const current = scorePeriod(state, currentStart, currentEnd);
  const previous = scorePeriod(state, previousStart, previousEnd);
  const hasPrevious = previous.totalPoints > 0;
  const denominator = Math.max(current.maxAreaPoints, previous.maxAreaPoints, 1);
  const classifiedItems =
    state.tasks.filter((task) => getTaskLifeArea(task)).length +
    state.habits.filter((habit) => getHabitLifeArea(habit)).length;

  const rows = LIFE_AREA_ORDER.map((area) => ({
    area,
    label: LIFE_AREA_LABEL[area],
    color: LIFE_AREA_COLOR[area],
    current: normalize(current.byArea[area].points, denominator),
    previous: hasPrevious ? normalize(previous.byArea[area].points, denominator) : null,
    target: getTarget(state, area),
    detail: current.byArea[area],
  }));

  return {
    rows,
    hasPrevious,
    classifiedItems,
    hasAnyExecution: current.totalPoints > 0,
    isEarly: current.activeDays < 5,
  };
}

export function filterTasksByLifeArea<T extends Pick<Task, "lifeArea">>(
  tasks: readonly T[],
  area: LifeArea | null
): T[] {
  if (!area) return [...tasks];
  return tasks.filter((task) => task.lifeArea === area);
}

function getTarget(state: PlannerState, area: LifeArea): number {
  const target = state.lifeAreaTargets?.[area];
  if (typeof target !== "number" || !Number.isFinite(target)) return DEFAULT_TARGET;
  return Math.min(100, Math.max(0, Math.round(target)));
}

function scorePeriod(state: PlannerState, startDate: Date, endDate: Date) {
  const byArea = Object.fromEntries(
    LIFE_AREA_ORDER.map((area) => [
      area,
      {
        tasksCompleted: 0,
        focusMinutes: 0,
        linkedHabits: 0,
        habitCompletions: 0,
        points: 0,
      },
    ])
  ) as Record<LifeArea, LifeAreaDetail>;
  const start = toISODate(startDate);
  const end = toISODate(endDate);
  const activeDates = new Set<string>();

  for (const task of state.tasks) {
    const area = getTaskLifeArea(task);
    if (!area || task.status !== "done" || !task.date) continue;
    if (!isISOInRange(task.date, start, end)) continue;
    const points = TASK_POINTS[task.category];
    byArea[area].tasksCompleted += 1;
    byArea[area].points += points;
    activeDates.add(task.date);
  }

  for (const session of state.focusSessions) {
    if (!session.completed || !isISOInRange(session.date, start, end)) continue;
    const task = state.tasks.find((item) => item.id === session.taskId);
    const area = task ? getTaskLifeArea(task) : null;
    if (!area) continue;
    const minutes = Math.round(session.elapsedMs / 60_000);
    byArea[area].focusMinutes += minutes;
    byArea[area].points += Math.floor(session.elapsedMs / FOCUS_UNIT_MS);
    activeDates.add(session.date);
  }

  const habitsById = new Map(state.habits.map((habit) => [habit.id, habit]));
  for (const habit of state.habits) {
    const area = getHabitLifeArea(habit);
    if (area && habit.isActive) {
      byArea[area].linkedHabits += 1;
    }
  }

  for (const log of state.habitLogs) {
    if (!log.done || !isISOInRange(log.date, start, end)) continue;
    const habit = habitsById.get(log.habitId);
    const area = habit ? getHabitLifeArea(habit) : null;
    if (!habit?.isActive || !area) continue;
    byArea[area].habitCompletions += 1;
    byArea[area].points += 1;
    activeDates.add(log.date);
  }

  return {
    byArea,
    totalPoints: LIFE_AREA_ORDER.reduce((sum, area) => sum + byArea[area].points, 0),
    maxAreaPoints: Math.max(...LIFE_AREA_ORDER.map((area) => byArea[area].points)),
    activeDays: activeDates.size,
  };
}

function getTaskLifeArea(task: Task): LifeArea | null {
  return task.lifeArea ?? inferLifeArea(task.title);
}

function getHabitLifeArea(habit: Habit): LifeArea | null {
  return habit.lifeArea ?? null;
}

function inferLifeArea(title: string): LifeArea | null {
  const normalized = normalizeText(title);
  for (const area of LIFE_AREA_ORDER) {
    if (AREA_KEYWORDS[area].some((keyword) => normalized.includes(keyword))) {
      return area;
    }
  }
  return null;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function normalize(points: number, denominator: number): number {
  return Math.min(100, Math.round((points / denominator) * 100));
}

function isISOInRange(value: string, start: string, end: string): boolean {
  return value >= start && value <= end;
}

function endOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(date.getDate() + days);
  return next;
}

function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
