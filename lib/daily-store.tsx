"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  Dispatch,
} from "react";
import { DailyItem } from "./daily-types";

const STORAGE_KEY = "onboarding-quiz-daily";

type State = { items: DailyItem[] };

function loadState(): State {
  if (typeof window === "undefined") return { items: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { items: [] };
    return { items: JSON.parse(raw) };
  } catch {
    return { items: [] };
  }
}

type Action =
  | { type: "ADD_ITEM"; item: Omit<DailyItem, "id" | "createdAt" | "done"> }
  | { type: "TOGGLE_ITEM"; id: string }
  | { type: "REMOVE_ITEM"; id: string }
  | { type: "RESET" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_ITEM": {
      const item: DailyItem = {
        ...action.item,
        id: `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        done: false,
        createdAt: Date.now(),
      };
      return { items: [...state.items, item] };
    }
    case "TOGGLE_ITEM":
      return {
        items: state.items.map((i) =>
          i.id === action.id ? { ...i, done: !i.done } : i
        ),
      };
    case "REMOVE_ITEM":
      return { items: state.items.filter((i) => i.id !== action.id) };
    case "RESET":
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      return { items: [] };
    default:
      return state;
  }
}

const DailyContext = createContext<{
  state: State;
  dispatch: Dispatch<Action>;
} | null>(null);

export function DailyProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  return (
    <DailyContext.Provider value={{ state, dispatch }}>
      {children}
    </DailyContext.Provider>
  );
}

export function useDaily() {
  const ctx = useContext(DailyContext);
  if (!ctx) throw new Error("useDaily deve ser usado dentro de DailyProvider");
  return ctx;
}

// ====== Helpers ======

export function getItemsForDate(state: State, date: string): DailyItem[] {
  return state.items
    .filter((i) => i.date === date)
    .sort((a, b) => {
      // undone first, then by time
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (a.time && b.time) return a.time.localeCompare(b.time);
      if (a.time) return -1;
      if (b.time) return 1;
      return 0;
    });
}

export function getItemsForMonth(
  state: State,
  year: number,
  month: number // 0-11
): Record<string, number> {
  const prefix = `${year}-${String(month + 1).padStart(2, "0")}`;
  const counts: Record<string, number> = {};
  for (const item of state.items) {
    if (item.date.startsWith(prefix)) {
      const day = item.date.slice(8, 10);
      counts[day] = (counts[day] ?? 0) + 1;
    }
  }
  return counts;
}

export function getDayCompletion(state: State, date: string): { done: number; total: number } {
  const items = state.items.filter((i) => i.date === date && i.type === "task");
  return {
    done: items.filter((i) => i.done).length,
    total: items.length,
  };
}
