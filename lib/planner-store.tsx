"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  ReactNode,
  Dispatch,
} from "react";
import {
  Habit,
  HabitLog,
  LifeArea,
  PlannerState,
  Quarter,
  Task,
  TaskCategory,
  TimeBlock,
  DayLog,
  Goal,
  MotivationReflection,
  Obstacle,
  WeekRock,
  initialPlannerState,
} from "./planner-types";
import { SLOT_LIMITS } from "./planner-data";

export type { Quarter } from "./planner-types";

export const PLANNER_STORAGE_KEY = "onboarding-quiz-planner";

/** "2026-Q3" */
export function quarterKey(year: number, quarter: Quarter): string {
  return `${year}-${quarter}`;
}

export type QuarterPhase = "estabelecer" | "consolidar" | "execucao";

/**
 * Progresso dentro do trimestre. As três fases batem com a roda de Revisão:
 * semanas 1–3 estabelecem, 4–7 consolidam, 8–13 executam.
 */
export function getQuarterInfo(
  date = todayISO()
): {
  year: number;
  quarter: Quarter;
  key: string;
  weekOfQuarter: number;
  totalWeeks: number;
  phase: QuarterPhase;
} {
  const [y, m, d] = date.split("-").map(Number);
  const quarterIndex = Math.floor((m - 1) / 3);
  const quarter = `Q${quarterIndex + 1}` as Quarter;
  const quarterStart = new Date(y, quarterIndex * 3, 1);
  const quarterEnd = new Date(y, quarterIndex * 3 + 3, 0);
  const dayMs = 86_400_000;
  const elapsedDays = Math.floor(
    (new Date(y, m - 1, d).getTime() - quarterStart.getTime()) / dayMs
  );
  const totalDays = Math.round((quarterEnd.getTime() - quarterStart.getTime()) / dayMs) + 1;
  const weekOfQuarter = Math.floor(elapsedDays / 7) + 1;
  const totalWeeks = Math.ceil(totalDays / 7);
  const phase: QuarterPhase =
    weekOfQuarter <= 3 ? "estabelecer" : weekOfQuarter <= 7 ? "consolidar" : "execucao";
  return { year: y, quarter, key: quarterKey(y, quarter), weekOfQuarter, totalWeeks, phase };
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Normaliza qualquer estado parcial (localStorage legado ou sync na nuvem):
 *  - `yearFocus` (frases livres por trimestre) vira `Goal` (não perder dado).
 *  - `lifeAreaTargets` é ignorado — radar de áreas saiu do produto.
 */
function normalizeState(parsed: unknown): PlannerState {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- estado legado/desserializado, formato histórico não tipável
  const p = parsed as any;
  const legacyGoals: Goal[] = [];
  const yearFocus = p?.yearFocus as
    | Record<string, Partial<Record<Quarter, string>>>
    | undefined;
  if (yearFocus) {
    for (const [year, byQuarter] of Object.entries(yearFocus)) {
      if (!byQuarter) continue;
      for (const quarter of ["Q1", "Q2", "Q3", "Q4"] as const) {
        const text = byQuarter[quarter]?.trim();
        if (!text) continue;
        legacyGoals.push({
          id: makeId("goal"),
          title: text,
          quarter: quarterKey(Number(year), quarter),
          why: "",
          outcome: "",
          status: "archived",
          createdAt: Date.now(),
        });
      }
    }
  }

  delete p?.yearFocus;
  delete p?.lifeAreaTargets;

  return {
    ...initialPlannerState,
    ...p,
    goals: [...legacyGoals, ...(Array.isArray(p?.goals) ? p.goals : [])],
    weekRocks: Array.isArray(p?.weekRocks) ? p.weekRocks : [],
    weekLogs: Array.isArray(p?.weekLogs) ? p.weekLogs : [],
  };
}

function migrateState(raw: string): PlannerState {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- parse de estado legado, formato histórico não tipável
    return normalizeState(JSON.parse(raw) as any);
  } catch {
    return initialPlannerState;
  }
}

function loadState(): PlannerState {
  if (typeof window === "undefined") return initialPlannerState;
  const raw = localStorage.getItem(PLANNER_STORAGE_KEY);
  if (!raw) return initialPlannerState;
  return migrateState(raw);
}

function endOfLocalDayTimestamp(date: string): number {
  return new Date(`${date}T23:59:59.999`).getTime();
}

function getDaySnapshot(
  state: PlannerState,
  date: string,
  autoMovedToInboxCount = 0
): Pick<
  DayLog,
  | "shutdownTaskDone"
  | "shutdownTaskTotal"
  | "shutdownHabitDone"
  | "shutdownHabitTotal"
  | "shutdownFocusMinutes"
  | "autoMovedToInboxCount"
> {
  const tasks = state.tasks.filter((task) => task.category !== "inbox" && task.date === date);
  const habits = state.habits.filter((habit) => habit.isActive);
  const habitLogs = state.habitLogs.filter((log) => log.date === date && log.done);
  const focusMinutes = Math.floor(
    state.focusSessions
      .filter((session) => session.date === date)
      .reduce((total, session) => total + session.elapsedMs, 0) / 60000
  );

  return {
    shutdownTaskDone: tasks.filter((task) => task.status === "done").length,
    shutdownTaskTotal: tasks.length,
    shutdownHabitDone: habits.filter((habit) =>
      habitLogs.some((log) => log.habitId === habit.id)
    ).length,
    shutdownHabitTotal: habits.length,
    shutdownFocusMinutes: focusMinutes,
    autoMovedToInboxCount,
  };
}

function upsertDayLog(state: PlannerState, date: string, patch: Partial<DayLog>): DayLog[] {
  const existingIdx = state.dayLogs.findIndex((log) => log.date === date);
  if (existingIdx >= 0) {
    const nextLogs = [...state.dayLogs];
    nextLogs[existingIdx] = { ...nextLogs[existingIdx], ...patch, date };
    return nextLogs;
  }
  return [...state.dayLogs, { date, ...patch }];
}

type Action =
  | { type: "HYDRATE"; state: Partial<PlannerState> }
  | {
      type: "ADD_TASK";
      id?: string;
      title: string;
      category?: TaskCategory;
      date?: string | null;
      estimatedMinutes?: number;
      lifeArea?: LifeArea | null;
      goalId?: string | null;
    }
  | { type: "MOVE_TASK"; id: string; category: TaskCategory; date: string | null }
  | { type: "UPDATE_TASK"; id: string; title?: string; notes?: string }
  | { type: "SET_TASK_AREA"; id: string; lifeArea: LifeArea | null }
  | { type: "SET_TASK_GOAL"; id: string; goalId: string | null }
  | { type: "TOGGLE_TASK_DONE"; id: string }
  | { type: "REMOVE_TASK"; id: string }
  | { type: "ADD_SUBTASK"; taskId: string; title: string }
  | { type: "TOGGLE_SUBTASK"; taskId: string; subtaskId: string }
  | { type: "REMOVE_SUBTASK"; taskId: string; subtaskId: string }
  | {
      type: "ADD_TIME_BLOCK";
      taskId: string;
      date: string;
      startTime: string;
      endTime: string;
      protected?: boolean;
    }
  | { type: "REMOVE_TIME_BLOCK"; id: string }
  | { type: "ADD_HABIT"; title: string; lifeArea?: LifeArea | null }
  | { type: "UPDATE_HABIT"; id: string; title: string }
  | { type: "SET_HABIT_AREA"; id: string; lifeArea: LifeArea | null }
  | { type: "TOGGLE_HABIT_ACTIVE"; id: string }
  | { type: "REMOVE_HABIT"; id: string }
  | { type: "TOGGLE_HABIT_LOG"; habitId: string; date: string }
  | {
      type: "ADD_GOAL";
      title: string;
      quarter: string;
      why: string;
      outcome: string;
    }
  | {
      type: "UPDATE_GOAL";
      id: string;
      patch: Partial<Pick<Goal, "title" | "why" | "outcome" | "status">>;
    }
  | { type: "PLAN_DAY"; date: string; payload: Omit<DayLog, "date" | "plannedAt" | "shutdownAt"> }
  | {
      type: "SHUTDOWN_DAY";
      date: string;
      reflection?: MotivationReflection;
      obstacle?: Obstacle | null;
    }
  | { type: "MOVE_UNFINISHED_TO_INBOX"; date: string }
  | {
      type: "ADD_WEEK_ROCK";
      goalId: string;
      weekStart: string;
      text: string;
      taskId?: string | null;
    }
  | {
      type: "UPDATE_WEEK_ROCK";
      id: string;
      patch: Partial<Pick<WeekRock, "text" | "committed" | "taskId">>;
    }
  | { type: "REMOVE_WEEK_ROCK"; id: string }
  | {
      type: "COMPLETE_WEEK_REVIEW";
      weekStart: string;
      decisions: { goalId: string; action: "keep" | "reduce" | "abandon" | "done" }[];
    }
  | { type: "SAVE_FOCUS_SESSION"; session: Omit<import("@/lib/planner-types").FocusSession, "id"> }
  | { type: "ROLLOVER"; today: string }
  | { type: "RESET" };

function reducer(state: PlannerState, action: Action): PlannerState {
  switch (action.type) {
    case "HYDRATE":
      return normalizeState(action.state);

    case "PLAN_DAY": {
      const existingIdx = state.dayLogs.findIndex((l) => l.date === action.date);
      const existingLog = existingIdx >= 0 ? state.dayLogs[existingIdx] : undefined;
      const mode = action.payload.mode ?? action.payload.energy;
      const newLog: DayLog = {
        date: action.date,
        ...action.payload,
        ...(mode ? { mode, energy: mode, modeSource: "chosen" as const } : {}),
        plannedAt: existingLog?.plannedAt ?? Date.now(),
      };
      if (existingIdx >= 0) {
        const newLogs = [...state.dayLogs];
        newLogs[existingIdx] = { ...newLogs[existingIdx], ...newLog };
        return { ...state, dayLogs: newLogs };
      }
      return { ...state, dayLogs: [...state.dayLogs, newLog] };
    }

    case "SHUTDOWN_DAY": {
      const existingIdx = state.dayLogs.findIndex((l) => l.date === action.date);
      const newLog: DayLog = {
        date: action.date,
        ...getDaySnapshot(state, action.date),
        ...(action.reflection !== undefined ? { reflection: action.reflection } : {}),
        ...(action.obstacle !== undefined ? { obstacle: action.obstacle } : {}),
        shutdownAt: Date.now(),
        shutdownSource: "manual",
      };
      if (existingIdx >= 0) {
        const newLogs = [...state.dayLogs];
        newLogs[existingIdx] = { ...newLogs[existingIdx], ...newLog };
        return { ...state, dayLogs: newLogs };
      }
      return { ...state, dayLogs: [...state.dayLogs, newLog] };
    }

    case "MOVE_UNFINISHED_TO_INBOX": {
      const unfinished = state.tasks.filter(
        (t) => t.date === action.date && t.category !== "inbox" && t.status === "pending"
      );
      if (unfinished.length === 0) return state;
      const unfinishedIds = new Set(unfinished.map(t => t.id));
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          unfinishedIds.has(t.id) ? { ...t, category: "inbox", date: null } : t
        ),
        timeBlocks: state.timeBlocks.filter((b) => !unfinishedIds.has(b.taskId)),
      };
    }

    case "ADD_WEEK_ROCK": {
      const rock: WeekRock = {
        id: makeId("rock"),
        goalId: action.goalId,
        weekStart: action.weekStart,
        text: action.text,
        taskId: action.taskId ?? null,
        committed: true,
      };
      return { ...state, weekRocks: [...state.weekRocks, rock] };
    }

    case "UPDATE_WEEK_ROCK":
      return {
        ...state,
        weekRocks: state.weekRocks.map((r) =>
          r.id === action.id ? { ...r, ...action.patch } : r
        ),
      };

    case "REMOVE_WEEK_ROCK":
      return {
        ...state,
        weekRocks: state.weekRocks.filter((r) => r.id !== action.id),
      };

    case "COMPLETE_WEEK_REVIEW": {
      const existing = state.weekLogs.find((w) => w.weekStart === action.weekStart);
      const log = {
        id: existing?.id ?? makeId("week"),
        weekStart: action.weekStart,
        reviewedAt: Date.now(),
        decisions: action.decisions,
      };
      return {
        ...state,
        weekLogs: existing
          ? state.weekLogs.map((w) => (w.id === existing.id ? log : w))
          : [...state.weekLogs, log],
      };
    }

    case "SAVE_FOCUS_SESSION": {
      return {
        ...state,
        focusSessions: [
          ...state.focusSessions,
          { id: makeId("focus"), ...action.session },
        ],
      };
    }

    case "ADD_TASK": {
      const task: Task = {
        id: action.id ?? makeId("task"),
        title: action.title,
        category: action.category ?? "inbox",
        status: "pending",
        date: action.category && action.category !== "inbox" ? action.date ?? null : null,
        estimatedMinutes: action.estimatedMinutes,
        lifeArea: action.lifeArea ?? null,
        ...(action.goalId !== undefined ? { goalId: action.goalId } : {}),
        createdAt: Date.now(),
      };
      return { ...state, tasks: [...state.tasks, task] };
    }

    case "MOVE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id
            ? {
                ...t,
                category: action.category,
                date: action.category === "inbox" ? null : action.date,
              }
            : t
        ),
        // Tirar da agenda também solta o bloco de tempo associado.
        timeBlocks:
          action.category === "inbox"
            ? state.timeBlocks.filter((b) => b.taskId !== action.id)
            : state.timeBlocks,
      };

    case "UPDATE_TASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id
            ? {
                ...t,
                ...(action.title !== undefined ? { title: action.title } : {}),
                ...(action.notes !== undefined ? { notes: action.notes } : {}),
              }
            : t
        ),
      };

    case "ADD_SUBTASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? {
                ...t,
                subtasks: [
                  ...(t.subtasks ?? []),
                  { id: makeId("subtask"), title: action.title, done: false },
                ],
              }
            : t
        ),
      };

    case "TOGGLE_SUBTASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? {
                ...t,
                subtasks: (t.subtasks ?? []).map((s) =>
                  s.id === action.subtaskId ? { ...s, done: !s.done } : s
                ),
              }
            : t
        ),
      };

    case "REMOVE_SUBTASK":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.taskId
            ? { ...t, subtasks: (t.subtasks ?? []).filter((s) => s.id !== action.subtaskId) }
            : t
        ),
      };

    case "SET_TASK_AREA":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, lifeArea: action.lifeArea } : t
        ),
      };

    case "SET_TASK_GOAL":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id ? { ...t, goalId: action.goalId } : t
        ),
      };

    case "ADD_GOAL": {
      const goal: Goal = {
        id: makeId("goal"),
        title: action.title,
        quarter: action.quarter,
        why: action.why,
        outcome: action.outcome,
        status: "active",
        createdAt: Date.now(),
      };
      return { ...state, goals: [...state.goals, goal] };
    }

    case "UPDATE_GOAL":
      return {
        ...state,
        goals: state.goals.map((g) =>
          g.id === action.id ? { ...g, ...action.patch } : g
        ),
      };

    case "TOGGLE_TASK_DONE":
      return {
        ...state,
        tasks: state.tasks.map((t) =>
          t.id === action.id
            ? { ...t, status: t.status === "done" ? "pending" : "done" }
            : t
        ),
      };

    case "REMOVE_TASK":
      return {
        ...state,
        tasks: state.tasks.filter((t) => t.id !== action.id),
        timeBlocks: state.timeBlocks.filter((b) => b.taskId !== action.id),
      };

    case "ADD_TIME_BLOCK": {
      // Um bloco ativo por tarefa: um novo agendamento substitui o anterior.
      const withoutOld = state.timeBlocks.filter((b) => b.taskId !== action.taskId);
      const block: TimeBlock = {
        id: makeId("block"),
        taskId: action.taskId,
        date: action.date,
        startTime: action.startTime,
        endTime: action.endTime,
        protected: action.protected,
      };
      return { ...state, timeBlocks: [...withoutOld, block] };
    }

    case "REMOVE_TIME_BLOCK":
      return {
        ...state,
        timeBlocks: state.timeBlocks.filter((b) => b.id !== action.id),
      };

    case "ADD_HABIT": {
      const habit: Habit = {
        id: makeId("habit"),
        title: action.title,
        isActive: true,
        lifeArea: action.lifeArea ?? null,
        createdAt: Date.now(),
      };
      return { ...state, habits: [...state.habits, habit] };
    }

    case "UPDATE_HABIT":
      return {
        ...state,
        habits: state.habits.map((h) =>
          h.id === action.id ? { ...h, title: action.title } : h
        ),
      };

    case "SET_HABIT_AREA":
      return {
        ...state,
        habits: state.habits.map((h) =>
          h.id === action.id ? { ...h, lifeArea: action.lifeArea } : h
        ),
      };

    case "TOGGLE_HABIT_ACTIVE":
      return {
        ...state,
        habits: state.habits.map((h) =>
          h.id === action.id ? { ...h, isActive: !h.isActive } : h
        ),
      };

    case "REMOVE_HABIT":
      return {
        ...state,
        habits: state.habits.filter((h) => h.id !== action.id),
        habitLogs: state.habitLogs.filter((l) => l.habitId !== action.id),
      };

    case "TOGGLE_HABIT_LOG": {
      const existing = state.habitLogs.find(
        (l) => l.habitId === action.habitId && l.date === action.date
      );
      if (!existing) {
        const log: HabitLog = {
          id: makeId("log"),
          habitId: action.habitId,
          date: action.date,
          done: true,
        };
        return { ...state, habitLogs: [...state.habitLogs, log] };
      }
      return {
        ...state,
        habitLogs: state.habitLogs.map((l) =>
          l.id === existing.id ? { ...l, done: !l.done } : l
        ),
      };
    }

    case "ROLLOVER": {
      if (state.lastRolloverDate === action.today) return state;

      const datesToAutoClose = new Set<string>();
      for (const log of state.dayLogs) {
        if (log.date < action.today && !log.shutdownAt) datesToAutoClose.add(log.date);
      }
      for (const task of state.tasks) {
        if (task.date && task.date < action.today) datesToAutoClose.add(task.date);
      }
      for (const block of state.timeBlocks) {
        if (block.date < action.today) datesToAutoClose.add(block.date);
      }
      for (const log of state.habitLogs) {
        if (log.date < action.today) datesToAutoClose.add(log.date);
      }
      for (const session of state.focusSessions) {
        if (session.date < action.today) datesToAutoClose.add(session.date);
      }

      const overdueIds = new Set(
        state.tasks
          .filter(
            (t) =>
              t.category !== "inbox" &&
              t.status === "pending" &&
              t.date !== null &&
              t.date < action.today
          )
          .map((t) => t.id)
      );

      let dayLogs = state.dayLogs;
      for (const date of datesToAutoClose) {
        const existing = dayLogs.find((log) => log.date === date);
        if (existing?.shutdownAt) continue;

        const autoMovedToInboxCount = state.tasks.filter(
          (task) =>
            task.date === date &&
            task.category !== "inbox" &&
            task.status === "pending"
        ).length;

        dayLogs = upsertDayLog(
          { ...state, dayLogs },
          date,
          {
            ...getDaySnapshot(state, date, autoMovedToInboxCount),
            shutdownAt: endOfLocalDayTimestamp(date),
            shutdownSource: "auto",
          }
        );
      }

      return {
        ...state,
        tasks: state.tasks.map((t) =>
          overdueIds.has(t.id) ? { ...t, category: "inbox", date: null } : t
        ),
        timeBlocks: state.timeBlocks.filter((b) => !overdueIds.has(b.taskId)),
        dayLogs,
        lastRolloverDate: action.today,
      };
    }

    case "RESET":
      try {
        localStorage.removeItem(PLANNER_STORAGE_KEY);
      } catch {}
      return initialPlannerState;

    default:
      return state;
  }
}

const PlannerContext = createContext<{
  state: PlannerState;
  dispatch: Dispatch<Action>;
  /** False até o estado do localStorage entrar. Ver PlannerProvider. */
  hydrated: boolean;
} | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialPlannerState);
  const [hydrated, setHydrated] = useState(false);

  // O estado começa vazio nos dois lados para o HTML do servidor bater com o
  // primeiro render do cliente. Só depois de montar é que o localStorage entra.
  useEffect(() => {
    dispatch({ type: "HYDRATE", state: loadState() });
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage só existe no cliente; ler durante o render quebra a hidratação
    setHydrated(true);
  }, []);

  // Virada de dia: dias passados ganham fechamento automático e pendências
  // voltam pro Inbox sem fingir que houve encerramento manual.
  useEffect(() => {
    if (!hydrated) return;
    const run = () => dispatch({ type: "ROLLOVER", today: todayISO() });
    run();
    const id = window.setInterval(run, 60_000);
    return () => window.clearInterval(id);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state, hydrated]);

  return (
    <PlannerContext.Provider value={{ state, dispatch, hydrated }}>
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error("usePlanner deve ser usado dentro de PlannerProvider");
  return ctx;
}

// ====== Datas ======

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** Segunda-feira da semana de uma data. */
export function mondayOf(anchor: string = todayISO()): string {
  const base = new Date(`${anchor}T12:00:00`);
  const dow = base.getDay();
  base.setDate(base.getDate() - (dow === 0 ? 6 : dow - 1));
  return toISODate(base);
}

export function weekDates(anchor: string = todayISO()): string[] {
  const base = new Date(`${anchor}T12:00:00`);
  const dow = base.getDay();
  const monday = new Date(base);
  // Semana começa na segunda: domingo (0) volta 6 dias, os demais voltam dow-1.
  monday.setDate(base.getDate() - (dow === 0 ? 6 : dow - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toISODate(d);
  });
}

// ====== Leitura — Goals e Rocks (motores de entrega) ======

export function getGoal(state: PlannerState, goalId: string | null | undefined): Goal | undefined {
  if (!goalId) return undefined;
  return state.goals.find((g) => g.id === goalId);
}

export function getActiveGoals(state: PlannerState): Goal[] {
  return state.goals.filter((g) => g.status === "active");
}

/** Metas ativas do trimestre atual (aquelas que mandam nos rocks da semana). */
export function getCurrentQuarterGoals(state: PlannerState): Goal[] {
  const now = new Date();
  const year = now.getFullYear();
  const q = (`Q${Math.floor(now.getMonth() / 3) + 1}`) as Quarter;
  return getActiveGoals(state).filter((g) => g.quarter === quarterKey(year, q));
}

export function getWeekRocks(state: PlannerState, weekStart: string): WeekRock[] {
  return state.weekRocks.filter((r) => r.weekStart === weekStart);
}

/**
 * Taxa de entrega de rocks por meta: pedras comprometidas × concluídas
 * (a tarefa ligada precisa estar com status "done"). É o KPI do app.
 */
export function getGoalDelivery(
  state: PlannerState,
  goalId: string
): { delivered: number; committed: number; rate: number | null } {
  const rocks = state.weekRocks.filter((r) => r.goalId === goalId);
  const committed = rocks.filter((r) => r.committed).length;
  const delivered = rocks.filter(
    (r) => r.committed && r.taskId !== null &&
      state.tasks.find((t) => t.id === r.taskId)?.status === "done"
  ).length;
  return { delivered, committed, rate: committed > 0 ? Math.round((delivered / committed) * 100) : null };
}

// ====== Leitura — Tasks ======

export function getInboxTasks(state: PlannerState): Task[] {
  return state.tasks
    .filter((t) => t.category === "inbox")
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function getTasksForSlot(
  state: PlannerState,
  date: string,
  category: Exclude<TaskCategory, "inbox">
): Task[] {
  return state.tasks
    .filter((t) => t.category === category && t.date === date)
    .sort((a, b) => a.createdAt - b.createdAt);
}

export function getTasksForDate(state: PlannerState, date: string): Task[] {
  return state.tasks.filter((t) => t.category !== "inbox" && t.date === date);
}

export function slotsFilled(
  state: PlannerState,
  date: string,
  category: Exclude<TaskCategory, "inbox">
): number {
  return getTasksForSlot(state, date, category).length;
}

export function canPlanTask(
  state: PlannerState,
  date: string,
  category: Exclude<TaskCategory, "inbox">
): boolean {
  return slotsFilled(state, date, category) < SLOT_LIMITS[category];
}

export function dayCompletion(
  state: PlannerState,
  date: string
): { done: number; total: number } {
  const tasks = getTasksForDate(state, date);
  return { done: tasks.filter((t) => t.status === "done").length, total: tasks.length };
}

/** "09:30" + 45 -> "10:15". Não estoura pra além de 23:59. */
export function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = Math.min(23 * 60 + 59, h * 60 + m + minutes);
  const hh = Math.floor(total / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function minutesBetween(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  return eh * 60 + em - (sh * 60 + sm);
}

// ====== Leitura — TimeBlocks ======

export function getTimeBlocksForDate(state: PlannerState, date: string): TimeBlock[] {
  return state.timeBlocks
    .filter((b) => b.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/** Soma dos minutos agendados no dia, somando todos os blocos. */
export function occupiedMinutes(state: PlannerState, date: string): number {
  return getTimeBlocksForDate(state, date).reduce(
    (sum, b) => sum + minutesBetween(b.startTime, b.endTime),
    0
  );
}

export function getTimeBlockForTask(
  state: PlannerState,
  taskId: string
): TimeBlock | null {
  return state.timeBlocks.find((b) => b.taskId === taskId) ?? null;
}

// ====== Leitura — Hábitos ======

export function getActiveHabits(state: PlannerState): Habit[] {
  return state.habits.filter((h) => h.isActive);
}

export function isHabitDone(
  state: PlannerState,
  habitId: string,
  date: string
): boolean {
  return (
    state.habitLogs.find((l) => l.habitId === habitId && l.date === date)?.done ??
    false
  );
}

export function habitCompletion(
  state: PlannerState,
  date: string
): { done: number; total: number } {
  const habits = getActiveHabits(state);
  return {
    done: habits.filter((h) => isHabitDone(state, h.id, date)).length,
    total: habits.length,
  };
}

/** Todo hábito ativo cumprido no dia — usado para destacar streaks no mês. */
export function isPerfectDay(state: PlannerState, date: string): boolean {
  const c = habitCompletion(state, date);
  return c.total > 0 && c.done === c.total;
}
