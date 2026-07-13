"use client";

import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
  Dispatch,
} from "react";
import {
  TwelveWeekState,
  initialTwelveWeekState,
} from "./12wy-types";

const STORAGE_KEY = "onboarding-quiz-12wy";

function loadState(): TwelveWeekState {
  if (typeof window === "undefined") return initialTwelveWeekState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialTwelveWeekState;
    return { ...initialTwelveWeekState, ...JSON.parse(raw) };
  } catch {
    return initialTwelveWeekState;
  }
}

type Action =
  | { type: "SET_START_DATE"; date: string }
  | { type: "ADD_TACTIC"; goalId: string; description: string }
  | { type: "UPDATE_TACTIC"; tacticId: string; description: string }
  | { type: "REMOVE_TACTIC"; tacticId: string }
  | { type: "TOGGLE_TACTIC"; weekNumber: number; tacticId: string }
  | { type: "SET_CURRENT_WEEK"; week: number }
  | { type: "RESET" };

function reducer(state: TwelveWeekState, action: Action): TwelveWeekState {
  switch (action.type) {
    case "SET_START_DATE":
      return { ...state, startDate: action.date };
    case "ADD_TACTIC": {
      const tactic = {
        id: `tac_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        goalId: action.goalId,
        description: action.description,
        createdAt: Date.now(),
      };
      return { ...state, tactics: [...state.tactics, tactic] };
    }
    case "UPDATE_TACTIC":
      return {
        ...state,
        tactics: state.tactics.map((t) =>
          t.id === action.tacticId
            ? { ...t, description: action.description }
            : t
        ),
      };
    case "REMOVE_TACTIC":
      return {
        ...state,
        tactics: state.tactics.filter((t) => t.id !== action.tacticId),
      };
    case "TOGGLE_TACTIC": {
      const week = state.weeks[action.weekNumber] ?? {};
      return {
        ...state,
        weeks: {
          ...state.weeks,
          [action.weekNumber]: {
            ...week,
            [action.tacticId]: !week[action.tacticId],
          },
        },
      };
    }
    case "SET_CURRENT_WEEK":
      return { ...state, currentWeek: action.week };
    case "RESET":
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      return { ...initialTwelveWeekState };
    default:
      return state;
  }
}

const TwelveWeekContext = createContext<{
  state: TwelveWeekState;
  dispatch: Dispatch<Action>;
} | null>(null);

export function TwelveWeekProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }, [state]);

  return (
    <TwelveWeekContext.Provider value={{ state, dispatch }}>
      {children}
    </TwelveWeekContext.Provider>
  );
}

export function use12WY() {
  const ctx = useContext(TwelveWeekContext);
  if (!ctx) throw new Error("use12WY deve ser usado dentro de TwelveWeekProvider");
  return ctx;
}

// ====== Helpers ======

export function getWeekCompletion(
  state: TwelveWeekState,
  weekNumber: number
): { done: number; total: number; pct: number } {
  const total = state.tactics.length;
  if (total === 0) return { done: 0, total: 0, pct: 0 };
  const week = state.weeks[weekNumber] ?? {};
  const done = Object.entries(week).filter(
    ([_, v]) => v && state.tactics.some((t) => t.id === _)
  ).length;
  return { done, total, pct: Math.round((done / total) * 100) };
}

export function getOverallScore(
  state: TwelveWeekState
): { done: number; total: number; pct: number } {
  if (state.tactics.length === 0) return { done: 0, total: 0, pct: 0 };
  let done = 0;
  let total = 0;
  for (let w = 1; w <= 12; w++) {
    const c = getWeekCompletion(state, w);
    done += c.done;
    total += c.total;
  }
  return { done, total, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
}
