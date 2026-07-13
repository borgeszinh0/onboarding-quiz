// 12 Week Year types

export interface Tactic {
  id: string;
  goalId: string;        // links to SmartGoal
  description: string;    // what to do weekly
  createdAt: number;
}

export interface WeekTactics {
  // weekNumber 1-12 -> tacticId -> done?
  [weekNumber: number]: {
    [tacticId: string]: boolean;
  };
}

export interface TwelveWeekState {
  startDate: string | null;  // ISO date when the 12 weeks begin
  tactics: Tactic[];
  weeks: WeekTactics;        // completion tracking
  currentWeek: number;       // 1-12
}

export const initialTwelveWeekState: TwelveWeekState = {
  startDate: null,
  tactics: [],
  weeks: {},
  currentWeek: 1,
};
