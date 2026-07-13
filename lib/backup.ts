import type { QuizState } from "./types";
import type { TwelveWeekState } from "./12wy-types";
import type { DailyItem } from "./daily-types";

export interface Backup {
  version: 1;
  app: "valores";
  exportedAt: string;
  quiz: Partial<QuizState>;
  plan: Partial<TwelveWeekState>;
  daily: { items: DailyItem[] };
}

export function buildBackup(
  quiz: QuizState,
  plan: TwelveWeekState,
  daily: { items: DailyItem[] }
): Backup {
  return {
    version: 1,
    app: "valores",
    exportedAt: new Date().toISOString(),
    quiz,
    plan,
    daily,
  };
}

export function downloadBackup(backup: Backup) {
  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `valores-backup-${backup.exportedAt.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Valida e faz parse de um arquivo de backup. Lança em caso de formato inválido. */
export function parseBackup(raw: string): Backup {
  const data = JSON.parse(raw);
  if (!data || data.app !== "valores" || data.version !== 1) {
    throw new Error("Arquivo não é um backup válido do Valores.");
  }
  return {
    version: 1,
    app: "valores",
    exportedAt: data.exportedAt ?? new Date().toISOString(),
    quiz: data.quiz ?? {},
    plan: data.plan ?? {},
    daily: data.daily ?? { items: [] },
  };
}

// ---- Auto-backup rotativo em localStorage (últimos 7 dias) ----

const AUTO_PREFIX = "valores-autobackup-";
const AUTO_KEEP = 7;

export function autoBackup(backup: Backup) {
  if (typeof window === "undefined") return;
  try {
    const today = backup.exportedAt.slice(0, 10);
    localStorage.setItem(AUTO_PREFIX + today, JSON.stringify(backup));

    const keys = Object.keys(localStorage)
      .filter((k) => k.startsWith(AUTO_PREFIX))
      .sort();
    while (keys.length > AUTO_KEEP) {
      const oldest = keys.shift();
      if (oldest) localStorage.removeItem(oldest);
    }
  } catch {
    // quota — ignore
  }
}

export function listAutoBackups(): { date: string; key: string }[] {
  if (typeof window === "undefined") return [];
  return Object.keys(localStorage)
    .filter((k) => k.startsWith(AUTO_PREFIX))
    .map((k) => ({ date: k.slice(AUTO_PREFIX.length), key: k }))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function readAutoBackup(key: string): Backup | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? parseBackup(raw) : null;
  } catch {
    return null;
  }
}
