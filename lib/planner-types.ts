// Motor do planejador: Objetivos, Inbox, regra 1-3-5, TimeBlocks e Hábitos.
// Sem sincronização com calendários externos — o app é um ambiente fechado.

/** "inbox" = ainda não planejada. As outras três são os slots do dia. */
export type TaskCategory = "inbox" | "big" | "medium" | "small";
/** Tipo de dia binário: foco no que move uma meta ou manutenção. */
export type DayMode = "focus" | "maintenance";
export type LifeArea =
  | "body"
  | "mind"
  | "social"
  | "spiritual"
  | "financial"
  | "professional";

export type TaskStatus = "pending" | "done";

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  /** ISO date. Null quando category é "inbox" — regra: inbox nunca tem data. */
  date: string | null;
  estimatedMinutes?: number;
  lifeArea?: LifeArea | null;
  /** Meta do trimestre à qual a tarefa serve. */
  goalId?: string | null;
  notes?: string;
  subtasks?: Subtask[];
  createdAt: number;
}

export interface TimeBlock {
  id: string;
  taskId: string;
  date: string;
  /** "HH:MM" */
  startTime: string;
  /** "HH:MM" */
  endTime: string;
  protected?: boolean;
}

export interface FocusSession {
  id: string;
  taskId: string;
  date: string;
  startedAt: number;
  endedAt: number;
  elapsedMs: number;
  completed: boolean;
}

export interface Habit {
  id: string;
  title: string;
  isActive: boolean;
  lifeArea?: LifeArea | null;
  createdAt: number;
}

export interface HabitLog {
  id: string;
  habitId: string;
  date: string;
  done: boolean;
}

/** Reflexão no encerramento do dia sobre o essencial planejado. */
export type MotivationReflection = "yes" | "partial" | "no";
/** Obstáculo que impediu o essencial — 1 toque, alimenta a revisão semanal. */
export type Obstacle =
  | "interrupted"
  | "misestimated"
  | "notImportant"
  | "unclear"
  | "other";

export interface DayLog {
  date: string;
  intention?: string;
  /** Legacy name kept for existing localStorage data. New code uses mode. */
  energy?: DayMode;
  mode?: DayMode;
  modeSource?: "chosen" | "inferred";
  overrideCount?: number;
  shutdownFit?: "matched" | "tooHeavy" | "tooLight";
  plannedStart?: string;
  plannedShutdown?: string;
  plannedAt?: number;
  shutdownAt?: number;
  shutdownSource?: "manual" | "auto";
  shutdownTaskDone?: number;
  shutdownTaskTotal?: number;
  shutdownHabitDone?: number;
  shutdownHabitTotal?: number;
  shutdownFocusMinutes?: number;
  autoMovedToInboxCount?: number;
  reflection?: MotivationReflection;
  obstacle?: Obstacle | null;
}

/** Q1–Q4. Cada trimestre guarda 1–2 frases de foco, texto livre. */
export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

export type GoalStatus = "active" | "paused" | "done" | "archived";

/**
 * Objetivo do trimestre. Máx. 3 ativas por vez. `outcome` é o resultado
 * mensurável que define "conquistei" — não é atividade, é desfecho.
 */
export interface Goal {
  id: string;
  title: string;
  /** "2026-Q3" */
  quarter: string;
  /** Por quê — 1 frase. Âncora para decisões diárias. */
  why: string;
  /** Resultado mensurável. Ex: "100 usuários cadastrados". */
  outcome: string;
  status: GoalStatus;
  createdAt: number;
}

/** "Pedra da semana": a única tarefa que mais move cada meta na semana. */
export interface WeekRock {
  id: string;
  goalId: string;
  /** ISO da segunda-feira da semana. */
  weekStart: string;
  text: string;
  /** Tarefa grande criada a partir da pedra (se planejada). */
  taskId: string | null;
  /** Comprometida no planejamento da semana. */
  committed: boolean;
}

export interface WeekLog {
  id: string;
  weekStart: string;
  reviewedAt: number | null;
  decisions: { goalId: string; action: "keep" | "reduce" | "abandon" | "done" }[];
}

export interface PlannerState {
  goals: Goal[];
  tasks: Task[];
  timeBlocks: TimeBlock[];
  habits: Habit[];
  habitLogs: HabitLog[];
  dayLogs: DayLog[];
  focusSessions: FocusSession[];
  weekRocks: WeekRock[];
  weekLogs: WeekLog[];
  /** Última data em que a virada de dia rodou, para não repetir no mesmo dia. */
  lastRolloverDate: string | null;
}

export const initialPlannerState: PlannerState = {
  goals: [],
  tasks: [],
  timeBlocks: [],
  habits: [],
  habitLogs: [],
  dayLogs: [],
  focusSessions: [],
  weekRocks: [],
  weekLogs: [],
  lastRolloverDate: null,
};
