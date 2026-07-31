"use client";

import { usePlanner, minutesBetween } from "@/lib/planner-store";
import { Card } from "@/components/apple/ui";

function formatMins(m: number) {
  if (m === 0) return "0 min";
  const h = Math.floor(m / 60);
  const mins = Math.floor(m % 60);
  if (h > 0 && mins > 0) return `${h}h ${mins}m`;
  if (h > 0) return `${h}h`;
  return `${mins}m`;
}

export function DailyShutdown({ date }: { date: string }) {
  const { state, dispatch } = usePlanner();

  const dayLog = state.dayLogs.find((l) => l.date === date);
  const isShutdown = !!dayLog?.shutdownAt;

  if (isShutdown) {
    return (
      <div className="mt-12 mb-8 text-center">
        <p className="a-subheadline text-[color:var(--label-secondary)]">Dia encerrado. Bom descanso!</p>
      </div>
    );
  }

  const todayTasks = state.tasks.filter((t) => t.category !== "inbox" && t.date === date);
  const doneCount = todayTasks.filter((t) => t.status === "done").length;
  const pendingCount = todayTasks.length - doneCount;

  const todayBlocks = state.timeBlocks.filter((b) => b.date === date);
  const blockedMinutes = todayBlocks.reduce((acc, b) => acc + minutesBetween(b.startTime, b.endTime), 0);
  const unblockedTasks = todayTasks.filter((t) => !todayBlocks.some((b) => b.taskId === t.id));
  const estimatedUnblocked = unblockedTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const totalPlannedMinutes = blockedMinutes + estimatedUnblocked;

  const todaySessions = state.focusSessions?.filter((s) => s.date === date) || [];
  const totalFocusMinutes = Math.floor(todaySessions.reduce((acc, s) => acc + s.elapsedMs, 0) / 60000);

  return (
    <div className="mt-12">
      <Card className="p-5">
        <h2 className="a-headline mb-2 text-[color:var(--label)]">Encerrar o dia</h2>
        <p className="a-body mb-4 text-[color:var(--label-secondary)]">
          Você concluiu {doneCount} {doneCount === 1 ? "tarefa" : "tarefas"} hoje.
        </p>

        {(totalPlannedMinutes > 0 || totalFocusMinutes > 0) && (
          <div className="mb-6 flex items-center justify-between rounded-xl bg-[color:var(--fill-subtle)] p-3">
            <div className="flex flex-col">
              <span className="a-caption text-[color:var(--label-secondary)] uppercase tracking-wider">Planejado</span>
              <span className="a-headline text-[color:var(--label)]">{formatMins(totalPlannedMinutes)}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="a-caption text-[color:var(--label-secondary)] uppercase tracking-wider">Focado</span>
              <span className="a-headline text-[color:var(--accent-text)]">{formatMins(totalFocusMinutes)}</span>
            </div>
          </div>
        )}

        {pendingCount > 0 && (
          <div className="mb-6 rounded-xl bg-[color:var(--fill-subtle)] p-4">
            <p className="a-subheadline mb-3 text-[color:var(--label)]">
              Restam {pendingCount} {pendingCount === 1 ? "tarefa pendente" : "tarefas pendentes"}.
            </p>
            <button
              type="button"
              onClick={() => dispatch({ type: "MOVE_UNFINISHED_TO_INBOX", date })}
              className="a-btn a-btn-secondary w-full"
            >
              Mover para o Inbox
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => dispatch({ type: "SHUTDOWN_DAY", date })}
          className="a-btn a-btn-primary w-full min-h-[50px]"
        >
          Encerrar Dia
        </button>
      </Card>
    </div>
  );
}
