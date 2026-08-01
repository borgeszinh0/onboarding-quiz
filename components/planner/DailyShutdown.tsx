"use client";

import { usePlanner, minutesBetween } from "@/lib/planner-store";
import { Card } from "@/components/apple/ui";
import { DAY_MODE_RULES, getDayMode, type FunnelCategory } from "@/lib/day-mode";

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
        <p className="a-subheadline text-label-secondary">Dia encerrado. Bom descanso!</p>
      </div>
    );
  }

  const todayTasks = state.tasks.filter((t) => t.category !== "inbox" && t.date === date);
  const doneCount = todayTasks.filter((t) => t.status === "done").length;
  const pendingCount = todayTasks.length - doneCount;
  const dayMode = getDayMode(state, date);
  const modeRules = DAY_MODE_RULES[dayMode];
  const categories: FunnelCategory[] = ["big", "medium", "small"];
  const plannedTasksByCategory = Object.fromEntries(
    categories.map((category) => [
      category,
      todayTasks.filter((task) => task.category === category).length,
    ])
  ) as Record<FunnelCategory, number>;
  const completedTasksByCategory = Object.fromEntries(
    categories.map((category) => [
      category,
      todayTasks.filter((task) => task.category === category && task.status === "done").length,
    ])
  ) as Record<FunnelCategory, number>;

  const todayBlocks = state.timeBlocks.filter((b) => b.date === date);
  const blockedMinutes = todayBlocks.reduce((acc, b) => acc + minutesBetween(b.startTime, b.endTime), 0);
  const unblockedTasks = todayTasks.filter((t) => !todayBlocks.some((b) => b.taskId === t.id));
  const estimatedUnblocked = unblockedTasks.reduce((acc, t) => acc + (t.estimatedMinutes || 0), 0);
  const totalPlannedMinutes = blockedMinutes + estimatedUnblocked;

  const todaySessions = state.focusSessions?.filter((s) => s.date === date) || [];
  const totalFocusMinutes = Math.floor(todaySessions.reduce((acc, s) => acc + s.elapsedMs, 0) / 60000);
  const completionRate = todayTasks.length > 0 ? doneCount / todayTasks.length : 0;
  const focusAlignment =
    totalPlannedMinutes > 0 ? Math.min(1, totalFocusMinutes / totalPlannedMinutes) : 0;
  const completedWeighted = categories.reduce((acc, category) => {
    const weight = modeRules.preferredCategories.includes(category) ? 1 : 0.45;
    return acc + completedTasksByCategory[category] * weight;
  }, 0);
  const completedTotal = Math.max(1, doneCount);
  const categoryAlignment = doneCount > 0 ? completedWeighted / completedTotal : 0;
  const modeFitScore = Math.round(
    (categoryAlignment * 0.45 + completionRate * 0.35 + focusAlignment * 0.2) * 100
  );
  const modeInsight =
    dayMode === "low"
      ? modeFitScore >= 70
        ? "Você manteve o dia leve e concluiu pendências compatíveis."
        : "Hoje teve mais carga do que o modo Manutenção recomendava."
      : dayMode === "medium"
        ? modeFitScore >= 70
          ? "Você executou um dia equilibrado."
          : "Execução funciona melhor com menos dispersão entre tarefas."
        : completedTasksByCategory.big > 0
          ? "Seu bloco principal recebeu foco protegido."
          : "Modo Criação funciona melhor quando a tarefa grande vem primeiro.";

  return (
    <div className="mt-12">
      <Card className="p-5">
        <h2 className="a-headline mb-2 text-label">Encerrar o dia</h2>
        <p className="a-body mb-4 text-label-secondary">
          Você concluiu {doneCount} {doneCount === 1 ? "tarefa" : "tarefas"} hoje.
        </p>

        {(todayTasks.length > 0 || totalPlannedMinutes > 0 || totalFocusMinutes > 0) && (
          <div className="mb-6 rounded-xl bg-fill-subtle p-3">
            <div className="mb-3 flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="a-caption text-label-secondary uppercase tracking-wider">Modo</span>
                <span className="a-headline text-label">{modeRules.strategy}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="a-caption text-label-secondary uppercase tracking-wider">Fit</span>
                <span className="a-headline text-accent">{modeFitScore}/100</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex flex-col">
                <span className="a-caption text-label-secondary uppercase tracking-wider">Planejado</span>
                <span className="a-headline text-label">{formatMins(totalPlannedMinutes)}</span>
              </div>
              <div className="flex flex-col text-right">
                <span className="a-caption text-label-secondary uppercase tracking-wider">Focado</span>
                <span className="a-headline text-accent">{formatMins(totalFocusMinutes)}</span>
              </div>
            </div>
            <p className="a-caption mt-3 text-label-secondary" role="status">
              Planejado: {plannedTasksByCategory.big} grande, {plannedTasksByCategory.medium} média, {plannedTasksByCategory.small} pequena.
              {" "}Concluído: {completedTasksByCategory.big} grande, {completedTasksByCategory.medium} média, {completedTasksByCategory.small} pequena.
              {" "}{modeInsight}
            </p>
          </div>
        )}

        {pendingCount > 0 && (
          <div className="mb-6 rounded-xl bg-fill-subtle p-4">
            <p className="a-subheadline mb-3 text-label">
              Restam {pendingCount} {pendingCount === 1 ? "tarefa pendente" : "tarefas pendentes"}.
            </p>
            <button
              type="button"
              onClick={() => dispatch({ type: "MOVE_UNFINISHED_TO_INBOX", date })}
              className="a-btn a-btn-secondary w-full backdrop-blur-[18px] backdrop-brightness-[1.01] backdrop-saturate-[165%] backdrop-contrast-[1.08]"
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
