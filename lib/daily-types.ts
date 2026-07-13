// Daily items: tasks + events

export type ItemType = "task" | "event";

export interface DailyItem {
  id: string;
  type: ItemType;
  title: string;
  date: string;        // ISO date "2026-07-13"
  time?: string;       // "14:30" (optional, events mainly)
  done: boolean;       // for tasks
  linkedTacticId?: string; // optional link to a 12WY tactic
  createdAt: number;
}

export const initialDailyState: { items: DailyItem[] } = {
  items: [],
};
