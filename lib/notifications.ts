import type { Task, TimeBlock } from "./planner-types";

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function notificationPermission(): NotificationPermission | "unsupported" {
  if (!notificationsSupported()) return "unsupported";
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!notificationsSupported()) return "denied";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

async function fire(title: string, body: string) {
  try {
    const reg = await navigator.serviceWorker?.getRegistration();
    if (reg) {
      reg.showNotification(title, { body, icon: "/icons/icon-192.png", tag: title });
    } else {
      new Notification(title, { body, icon: "/icons/icon-192.png" });
    }
  } catch {
    // ignore
  }
}

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

/**
 * Agenda notificações para os TimeBlocks de HOJE cuja tarefa ainda está
 * pendente. Retorna a lista de timers para permitir limpeza. Só dispara com
 * permissão concedida.
 */
export function scheduleTodayReminders(
  blocks: TimeBlock[],
  tasks: Task[]
): number[] {
  if (notificationPermission() !== "granted") return [];

  const today = todayStr();
  const now = Date.now();
  const timers: number[] = [];
  const taskById = new Map(tasks.map((t) => [t.id, t]));

  for (const block of blocks) {
    if (block.date !== today) continue;
    const task = taskById.get(block.taskId);
    if (!task || task.status === "done") continue;

    const [h, m] = block.startTime.split(":").map(Number);
    const when = new Date();
    when.setHours(h, m, 0, 0);
    const delay = when.getTime() - now;
    if (delay <= 0 || delay > 24 * 60 * 60 * 1000) continue;

    const id = window.setTimeout(() => {
      fire("⏱ Bloco começando", `${block.startTime} — ${task.title}`);
    }, delay);
    timers.push(id);
  }

  return timers;
}
