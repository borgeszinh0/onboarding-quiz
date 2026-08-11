"use client";

import { useMemo } from "react";
import {
  dayCompletion,
  getGoal,
  habitCompletion,
  minutesBetween,
  usePlanner,
} from "@/lib/planner-store";
import { DAY_MODE_RULES, getDayMode } from "@/lib/day-mode";
import { Card, PageTitle } from "@/components/apple/ui";
import type { Obstacle } from "@/lib/planner-types";

const REFLECTION_LABEL = { yes: "Sim", partial: "Parcial", no: "Não" } as const;

const OBSTACLE_LABEL: Record<Obstacle, string> = {
  interrupted: "Fui interrompido",
  misestimated: "Estimei mal o esforço",
  notImportant: "Não era o importante",
  unclear: "Faltou clareza do próximo passo",
  other: "Outro motivo",
};

const DECISION_LABEL = {
  keep: "Manter",
  reduce: "Reduzida",
  abandon: "Abandonada",
  done: "Concluída",
} as const;

function formatDate(date: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(new Date(`${date}T12:00:00`));
}

function formatMinutes(minutes: number): string {
  if (minutes <= 0) return "0 min";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h`;
  return `${mins}m`;
}

export default function HistoricoPage() {
  const { state, hydrated } = usePlanner();

  const dates = useMemo(() => {
    const allDates = new Set<string>();
    for (const log of state.dayLogs) allDates.add(log.date);
    for (const task of state.tasks) if (task.date) allDates.add(task.date);
    for (const block of state.timeBlocks) allDates.add(block.date);
    for (const log of state.habitLogs) allDates.add(log.date);
    for (const session of state.focusSessions) allDates.add(session.date);
    return Array.from(allDates).sort((a, b) => b.localeCompare(a));
  }, [state]);

  if (!hydrated) {
    return <main className="page-shell page-with-dock mx-auto w-full max-w-xl px-5" aria-busy="true" />;
  }

  return (
    <main className="page-shell page-with-dock mx-auto w-full max-w-xl px-5">
      <PageTitle
        eyebrow="Histórico"
        title="Registro dos dias"
        subtitle="Energia, intenção, fechamento e o que ficou registrado em cada dia."
      />

      {state.weekLogs.length > 0 && (
        <section className="mb-8 space-y-3">
          <h2 className="a-headline text-label">Revisões de semana</h2>
          {[...state.weekLogs]
            .sort((a, b) => b.weekStart.localeCompare(a.weekStart))
            .map((week) => (
              <Card key={week.id} className="p-5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="a-caption text-label-secondary">
                    Semana de {formatDate(week.weekStart)}
                  </p>
                  <span className="a-caption rounded-full bg-fill-subtle px-3 py-1 text-label-secondary">
                    {week.decisions.length === 0
                      ? "Revisão pulada"
                      : `${week.decisions.length} ${week.decisions.length === 1 ? "decisão" : "decisões"}`}
                  </span>
                </div>
                {week.decisions.length > 0 && (
                  <ul className="space-y-1">
                    {week.decisions.map((decision) => {
                      const goal = getGoal(state, decision.goalId);
                      return (
                        <li
                          key={decision.goalId}
                          className="flex items-center justify-between gap-3"
                        >
                          <span className="a-subheadline truncate text-label">
                            {goal?.title ?? "Meta removida"}
                          </span>
                          <span className="a-caption shrink-0 tabular text-label-secondary">
                            {DECISION_LABEL[decision.action]}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            ))}
        </section>
      )}

      {dates.length === 0 ? (
        <Card className="p-5">
          <p className="a-subheadline text-label-secondary">
            Nenhum dia registrado ainda. Planeje hoje para começar o histórico.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {dates.map((date) => {
            const dayLog = state.dayLogs.find((log) => log.date === date);
            const mode = getDayMode(state, date);
            const modeRules = DAY_MODE_RULES[mode];
            const taskFallback = dayCompletion(state, date);
            const habitFallback = habitCompletion(state, date);
            const focusFallback = Math.floor(
              state.focusSessions
                .filter((session) => session.date === date)
                .reduce((total, session) => total + session.elapsedMs, 0) / 60000
            );
            const plannedFallback = state.timeBlocks
              .filter((block) => block.date === date)
              .reduce(
                (total, block) =>
                  total + Math.max(0, minutesBetween(block.startTime, block.endTime)),
                0
              );

            const taskDone = dayLog?.shutdownTaskDone ?? taskFallback.done;
            const taskTotal = dayLog?.shutdownTaskTotal ?? taskFallback.total;
            const habitDone = dayLog?.shutdownHabitDone ?? habitFallback.done;
            const habitTotal = dayLog?.shutdownHabitTotal ?? habitFallback.total;
            const focusMinutes = dayLog?.shutdownFocusMinutes ?? focusFallback;
            const movedCount = dayLog?.autoMovedToInboxCount ?? 0;
            const status = dayLog?.shutdownAt
              ? dayLog.shutdownSource === "auto"
                ? "Encerrado automaticamente"
                : "Encerrado manualmente"
              : dayLog?.plannedAt
                ? "Dia iniciado"
                : "Registro parcial";

            return (
              <Card key={date} className="p-5">
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <p className="a-caption text-label-secondary">{formatDate(date)}</p>
                    <h2 className="a-headline mt-1 text-label">{modeRules.strategy}</h2>
                  </div>
                  <span className="a-caption rounded-full bg-fill-subtle px-3 py-1 text-label-secondary">
                    {status}
                  </span>
                </div>

                {dayLog?.intention && (
                  <p className="a-subheadline mb-4 text-label">“{dayLog.intention}”</p>
                )}

                <div className="grid grid-cols-3 gap-2">
                  <Metric label="Tarefas" value={`${taskDone}/${taskTotal}`} />
                  <Metric label="Hábitos" value={`${habitDone}/${habitTotal}`} />
                  <Metric
                    label={plannedFallback > 0 ? "Foco / plano" : "Foco"}
                    value={
                      plannedFallback > 0
                        ? `${formatMinutes(focusMinutes)} / ${formatMinutes(plannedFallback)}`
                        : formatMinutes(focusMinutes)
                    }
                  />
                </div>

                {dayLog?.reflection && (
                  <p className="a-caption mt-3 text-label-secondary">
                    Essencial do dia: {REFLECTION_LABEL[dayLog.reflection]}
                    {dayLog.obstacle && (
                      <>
                        {" "}· O que atrapalhou: {OBSTACLE_LABEL[dayLog.obstacle]}
                      </>
                    )}
                  </p>
                )}

                {movedCount > 0 && (
                  <p className="a-caption mt-3 text-label-secondary">
                    {movedCount} {movedCount === 1 ? "pendência voltou" : "pendências voltaram"} para o Inbox na virada.
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-fill-subtle p-3">
      <p className="a-caption text-label-secondary">{label}</p>
      <p className="a-subheadline mt-1 tabular text-label">{value}</p>
    </div>
  );
}
