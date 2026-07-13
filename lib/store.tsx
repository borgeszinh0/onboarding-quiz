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
  QuizState,
  QuizStep,
  Dimension,
  DomainScores,
  QualitativeEntry,
  NarrativeEntry,
  EnvironmentEntry,
  SmartGoal,
} from "./types";
import { DOMAINS, DIMENSIONS } from "./data";

const STORAGE_KEY = "onboarding-quiz-state";

const emptyScores = (): Record<string, DomainScores> => {
  const scores: Record<string, DomainScores> = {};
  for (const domain of DOMAINS) {
    scores[domain.id] = {
      possibility: 0,
      currentImportance: 0,
      generalImportance: 0,
      action: 0,
      satisfaction: 0,
      concern: 0,
    };
  }
  return scores;
};

const initialState: QuizState = {
  step: "welcome",
  username: "",
  scores: emptyScores(),
  qualitative: [],
  narratives: [],
  environment: [],
  goals: [],
};

// Load from localStorage on init
function loadState(): QuizState {
  if (typeof window === "undefined") return initialState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return initialState;
    const saved = JSON.parse(raw) as Partial<QuizState>;
    return {
      ...initialState,
      ...saved,
      scores: { ...emptyScores(), ...(saved.scores ?? {}) },
    };
  } catch {
    return initialState;
  }
}

type Action =
  | { type: "SET_STEP"; step: QuizStep }
  | { type: "SET_USERNAME"; name: string }
  | { type: "SET_SCORE"; domainId: string; dimension: Dimension; value: number }
  | { type: "SET_QUALITATIVE"; entries: QualitativeEntry[] }
  | { type: "SET_NARRATIVE"; entries: NarrativeEntry[] }
  | { type: "SET_ENVIRONMENT"; entries: EnvironmentEntry[] }
  | { type: "SET_GOALS"; goals: SmartGoal[] }
  | { type: "RESET" };

function reducer(state: QuizState, action: Action): QuizState {
  switch (action.type) {
    case "SET_STEP":
      return { ...state, step: action.step };
    case "SET_USERNAME":
      return { ...state, username: action.name };
    case "SET_SCORE":
      return {
        ...state,
        scores: {
          ...state.scores,
          [action.domainId]: {
            ...state.scores[action.domainId],
            [action.dimension]: action.value,
          },
        },
      };
    case "SET_QUALITATIVE":
      return { ...state, qualitative: action.entries };
    case "SET_NARRATIVE":
      return { ...state, narratives: action.entries };
    case "SET_ENVIRONMENT":
      return { ...state, environment: action.entries };
    case "SET_GOALS":
      return { ...state, goals: action.goals };
    case "RESET":
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      return { ...initialState };
    default:
      return state;
  }
}

const QuizContext = createContext<{
  state: QuizState;
  dispatch: Dispatch<Action>;
} | null>(null);

export function QuizProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);

  // Persist to localStorage on every change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore quota errors
    }
  }, [state]);

  return (
    <QuizContext.Provider value={{ state, dispatch }}>
      {children}
    </QuizContext.Provider>
  );
}

export function useQuiz() {
  const ctx = useContext(QuizContext);
  if (!ctx) throw new Error("useQuiz deve ser usado dentro de QuizProvider");
  return ctx;
}

// ====== Helpers de análise ======

export interface DomainGap {
  domainId: string;
  domainName: string;
  icon: string;
  importance: number;
  action: number;
  gap: number;
}

export function getGaps(state: QuizState): DomainGap[] {
  return DOMAINS.map((d) => {
    const s = state.scores[d.id];
    const avgImportance = (s.currentImportance + s.generalImportance) / 2;
    const gap = avgImportance - s.action;
    return {
      domainId: d.id,
      domainName: d.name,
      icon: d.icon,
      importance: avgImportance,
      action: s.action,
      gap,
    };
  }).sort((a, b) => b.gap - a.gap);
}

export function getTopPriorityDomains(state: QuizState, n = 3): DomainGap[] {
  return getGaps(state)
    .filter((g) => g.importance >= 5)
    .slice(0, n);
}

export function getProgress(
  state: QuizState
): { completed: number; total: number } {
  const steps: QuizStep[] = [
    "welcome",
    "quantitative",
    "qualitative",
    "narrative",
    "environment",
    "smart",
    "result",
  ];
  const currentIdx = steps.indexOf(state.step);
  return { completed: currentIdx, total: steps.length - 1 };
}
