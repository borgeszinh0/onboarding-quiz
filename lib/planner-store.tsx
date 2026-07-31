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
  PlannerState,
  Quarter,
  Task,
  TaskCategory,
  TimeBlock,
  DayLog,
  initialPlannerState,
} from "./planner-types";
import { SLOT_LIMITS } from "./planner-data";

const STORAGE_KEY = "onboarding-quiz-planner";

function loadState(): PlannerState {
  if (typeof window === "undefined") return initialPlannerState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialPlannerState;
    return { ...initialPlannerState, ...JSON.parse(raw) };
  } catch {
    return initialPlannerState;
  }
}

function makeId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
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
    }
  | { type: "MOVE_TASK"; id: string; category: TaskCategory; date: string | null }
  | { type: "UPDATE_TASK"; id: string; title: string }
  | { type: "TOGGLE_TASK_DONE"; id: string }
  | { type: "REMOVE_TASK"; id: string }
  | { type: "ADD_TIME_BLOCK"; taskId: string; date: string; startTime: string; endTime: string }
  | { type: "REMOVE_TIME_BLOCK"; id: string }
  | { type: "ADD_HABIT"; title: string }
  | { type: "TOGGLE_HABIT_ACTIVE"; id: string }
  | { type: "REMOVE_HABIT"; id: string }
  | { type: "TOGGLE_HABIT_LOG"; habitId: string; date: string }
  | { type: "SET_YEAR_FOCUS"; year: number; quarter: Quarter; text: string }
  | { type: "PLAN_DAY"; date: string; payload: Omit<DayLog, "date" | "plannedAt" | "shutdownAt"> }
  | { type: "SHUTDOWN_DAY"; date: string }
  | { type: "MOVE_UNFINISHED_TO_INBOX"; date: string }
  | { type: "SAVE_FOCUS_SESSION"; session: Omit<import("@/lib/planner-types").FocusSession, "id"> }
  | { type: "ROLLOVER"; today: string }
  | { type: "RESET" };

function reducer(state: PlannerState, action: Action): PlannerState {
  switch (action.type) {
    case "HYDRATE":
      return { ...initialPlannerState, ...action.state };

    case "PLAN_DAY": {
      const existingIdx = state.dayLogs.findIndex((l) => l.date === action.date);
      const newLog: DayLog = {
        date: action.date,
        ...action.payload,
        plannedAt: Date.now(),
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
        shutdownAt: Date.now(),
      };
      if (existingIdx >= 0) {
        const newLogs = [...state.dayLogs];
        newLogs[existingIdx] = { ...newLogs[existingIdx], shutdownAt: Date.now() };
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
          t.id === action.id ? { ...t, title: action.title } : t
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
        createdAt: Date.now(),
      };
      return { ...state, habits: [...state.habits, habit] };
    }

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

    case "SET_YEAR_FOCUS": {
      const yearMap = state.yearFocus[action.year] ?? {};
      return {
        ...state,
        yearFocus: {
          ...state.yearFocus,
          [action.year]: { ...yearMap, [action.quarter]: action.text },
        },
      };
    }

    case "ROLLOVER": {
      if (state.lastRolloverDate === action.today) return state;

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
      if (overdueIds.size === 0) {
        return { ...state, lastRolloverDate: action.today };
      }

      return {
        ...state,
        tasks: state.tasks.map((t) =>
          overdueIds.has(t.id) ? { ...t, category: "inbox", date: null } : t
        ),
        timeBlocks: state.timeBlocks.filter((b) => !overdueIds.has(b.taskId)),
        lastRolloverDate: action.today,
      };
    }

    case "RESET":
      try {
        localStorage.removeItem(STORAGE_KEY);
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

  // Virada de dia: tarefas passadas não concluídas voltam pro Inbox.
  useEffect(() => {
    if (!hydrated) return;
    dispatch({ type: "ROLLOVER", today: todayISO() });
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
