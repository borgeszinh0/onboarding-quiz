"use client";

import { useEffect } from "react";
import { usePlanner } from "@/lib/planner-store";
import { scheduleTodayReminders } from "@/lib/notifications";

/** Reagenda lembretes dos blocos de hoje sempre que a agenda muda. */
export default function NotificationsRunner() {
  const { state } = usePlanner();

  useEffect(() => {
    const timers = scheduleTodayReminders(state.timeBlocks, state.tasks);
    return () => timers.forEach((t) => clearTimeout(t));
  }, [state.timeBlocks, state.tasks]);

  return null;
}
