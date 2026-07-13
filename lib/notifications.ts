import type { DailyItem } from "./daily-types";

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
 * Agenda notificações para os itens de HOJE que têm horário futuro. Retorna a
 * lista de timers para permitir limpeza. Só dispara com permissão concedida.
 */
export function scheduleTodayReminders(items: DailyItem[]): number[] {
  if (notificationPermission() !== "granted") return [];

  const today = todayStr();
  const now = Date.now();
  const timers: number[] = [];

  for (const item of items) {
    if (item.date !== today || !item.time) continue;
    if (item.type === "task" && item.done) continue;

    const [h, m] = item.time.split(":").map(Number);
    const when = new Date();
    when.setHours(h, m, 0, 0);
    const delay = when.getTime() - now;
    if (delay <= 0 || delay > 24 * 60 * 60 * 1000) continue;

    const id = window.setTimeout(() => {
      fire(
        item.type === "event" ? "📅 Evento agora" : "✓ Tarefa agendada",
        `${item.time} — ${item.title}`
      );
    }, delay);
    timers.push(id);
  }

  return timers;
}
