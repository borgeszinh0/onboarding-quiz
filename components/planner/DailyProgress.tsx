"use client";

import { usePlanner } from "@/lib/planner-store";

function parseMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function DailyProgress({ date }: { date: string }) {
  const { state } = usePlanner();

  const todayTasks = state.tasks.filter((t) => t.category !== "inbox" && t.date === date);
  const doneTasks = todayTasks.filter((t) => t.status === "done").length;
  
  const todayBlocks = state.timeBlocks.filter((b) => b.date === date);
  const totalMinutes = todayBlocks.reduce((acc, block) => {
    return acc + Math.max(0, parseMinutes(block.endTime) - parseMinutes(block.startTime));
  }, 0);

  const activeHabits = state.habits.filter((h) => h.isActive).length;
  const doneHabits = state.habitLogs.filter((l) => l.date === date && l.done).length;

  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[color:var(--label-secondary)]">
      <span className="a-caption">{doneTasks} de {todayTasks.length} tarefas</span>
      <span aria-hidden className="a-caption text-[color:var(--separator)]">·</span>
      <span className="a-caption">{totalMinutes} min planejados</span>
      {activeHabits > 0 && (
        <>
          <span aria-hidden className="a-caption text-[color:var(--separator)]">·</span>
          <span className="a-caption">{doneHabits} de {activeHabits} hábitos</span>
        </>
      )}
    </div>
  );
}
