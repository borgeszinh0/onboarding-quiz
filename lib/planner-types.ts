// Motor do planejador: Inbox, regra 1-3-5, TimeBlocks e Hábitos.
// Sem sincronização com calendários externos — o app é um ambiente fechado.

/** "inbox" = ainda não planejada. As outras três são os slots do dia. */
export type TaskCategory = "inbox" | "big" | "medium" | "small";
export type DayMode = "low" | "medium" | "high";
export type LifeArea =
  | "body"
  | "mind"
  | "social"
  | "spiritual"
  | "financial"
  | "professional";

export type TaskStatus = "pending" | "done";

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  status: TaskStatus;
  /** ISO date. Null quando category é "inbox" — regra: inbox nunca tem data. */
  date: string | null;
  estimatedMinutes?: number;
  lifeArea?: LifeArea | null;
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
}

/** Q1–Q4. Cada trimestre guarda 1–2 frases de foco, texto livre. */
export type Quarter = "Q1" | "Q2" | "Q3" | "Q4";

export interface PlannerState {
  tasks: Task[];
  timeBlocks: TimeBlock[];
  habits: Habit[];
  habitLogs: HabitLog[];
  dayLogs: DayLog[];
  focusSessions: FocusSession[];
  /** year -> quarter -> texto. */
  yearFocus: Record<number, Partial<Record<Quarter, string>>>;
  /** Metas normalizadas do radar de áreas da vida, de 0 a 100. */
  lifeAreaTargets: Partial<Record<LifeArea, number>>;
  /** Última data em que a virada de dia rodou, para não repetir no mesmo dia. */
  lastRolloverDate: string | null;
}

export const initialPlannerState: PlannerState = {
  tasks: [],
  timeBlocks: [],
  habits: [],
  habitLogs: [],
  dayLogs: [],
  focusSessions: [],
  yearFocus: {},
  lifeAreaTargets: {},
  lastRolloverDate: null,
};
