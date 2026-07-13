"use client";

import { useEffect } from "react";
import { useDaily } from "@/lib/daily-store";
import { scheduleTodayReminders } from "@/lib/notifications";

/** Reagenda lembretes das tarefas/eventos de hoje sempre que a agenda muda. */
export default function NotificationsRunner() {
  const { state } = useDaily();

  useEffect(() => {
    const timers = scheduleTodayReminders(state.items);
    return () => timers.forEach((t) => clearTimeout(t));
  }, [state.items]);

  return null;
}
