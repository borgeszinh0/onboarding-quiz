"use client";

import { useState } from "react";
import {
  usePlanner,
  mondayOf,
  weekDates,
  todayISO,
  getWeekRocks,
  getCurrentQuarterGoals,
  getGoalDelivery,
} from "@/lib/planner-store";
import { Card, PageTitle, SectionLabel } from "@/components/apple/ui";
import type { Obstacle } from "@/lib/planner-types";
import { CheckCircle2, RotateCcw } from "lucide-react";

const OBSTACLE_LABEL: Record<Obstacle, string> = {
  interrupted: "Fui interrompido",
  misestimated: "Estimei mal o esforço",
  notImportant: "Não era o importante",
  unclear: "Faltou clareza do próximo passo",
  other: "Outro motivo",
};

type Decision = "keep" | "reduce" | "abandon" | "done";

export default function RevisaoPage() {
  const { state, dispatch, hydrated } = usePlanner();
  const [editing, setEditing] = useState(false);
  const [reducedOutcomes, setReducedOutcomes] = useState<Record<string, string>>({});

  const today = todayISO();
  const weekStart = mondayOf(today);
  const dates = weekDates(weekStart);
  const rocks = getWeekRocks(state, weekStart).filter((r) => r.committed);
  const goals = getCurrentQuarterGoals(state);
  const [decisions, setDecisions] = useState<Record<string, Decision>>(() =>
    Object.fromEntries(goals.map((g) => [g.id, "keep" as Decision]))
  );

  if (!hydrated) {
    return <main className="page-shell page-with-dock mx-auto w-full max-w-xl px-5" aria-busy="true" />;
  }

  const doneRocks = rocks.filter(
    (r) => r.taskId && state.tasks.find((t) => t.id === r.taskId)?.status === "done"
  ).length;
  const rate = rocks.length > 0 ? Math.round((doneRocks / rocks.length) * 100) : null;

  const reflections = dates
    .map((d) => state.dayLogs.find((l) => l.date === d))
    .filter((l) => l?.reflection) as Array<{ reflection: "yes" | "partial" | "no" }>;
  const notYes = reflections.filter((l) => l.reflection !== "yes").length;
  const obstacles = dates
    .map((d) => state.dayLogs.find((l) => l.date === d))
    .filter((l) => l?.obstacle)
    .map((l) => l!.obstacle as Obstacle);
  const obstacleCount = Object.entries(
    obstacles.reduce<Record<string, number>>((acc, o) => {
      acc[o] = (acc[o] ?? 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  const reviewed = state.weekLogs.find((w) => w.weekStart === weekStart);
  const showForm = !reviewed || editing;

  const saveReview = () => {
    for (const [goalId, action] of Object.entries(decisions)) {
      if (action === "abandon")
        dispatch({ type: "UPDATE_GOAL", id: goalId, patch: { status: "archived" } });
      if (action === "done")
        dispatch({ type: "UPDATE_GOAL", id: goalId, patch: { status: "done" } });
      if (action === "reduce") {
        const newOutcome = reducedOutcomes[goalId]?.trim();
        if (newOutcome)
          dispatch({ type: "UPDATE_GOAL", id: goalId, patch: { outcome: newOutcome } });
      }
    }
    dispatch({
      type: "COMPLETE_WEEK_REVIEW",
      weekStart,
      decisions: Object.entries(decisions).map(([goalId, action]) => ({ goalId, action })),
    });
    setEditing(false);
  };

  return (
    <main className="page-shell page-with-dock mx-auto w-full max-w-xl px-5">
      <PageTitle
        eyebrow="Revisão"
        title="Revisão da semana"
        subtitle="Onde o Planner corrige curso: o que foi prometido, o que foi entregue e o que fazer para a semana que vem."
      />

      {showForm ? (
        <div className="space-y-6">
          <section>
            <SectionLabel>Entrega da semana</SectionLabel>
            <Card className="flex items-center justify-between p-5">
              <div>
                <p className="a-subheadline text-label">Pedras da semana</p>
                <p className="a-caption text-label-secondary">
                  {doneRocks} de {rocks.length} concluídas
                </p>
              </div>
              <span className="a-large-title tabular text-accent">
                {rate === null ? "—" : `${rate}%`}
              </span>
            </Card>
          </section>

          <section>
            <SectionLabel>Obstáculos que se repetem</SectionLabel>
            <Card className="p-5">
              {obstacleCount.length === 0 ? (
                <p className="a-subheadline text-label-secondary">
                  {reflections.length === 0
                    ? "Nenhuma reflexão de fechamento registrada nesta semana ainda."
                    : "Nenhum obstáculo marcado. Quando algo atrapalhar, registre no Encerrar o dia."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {obstacleCount.map(([obstacle, count]) => (
                    <li key={obstacle} className="flex items-center justify-between gap-3">
                      <span className="a-body text-label">
                        {OBSTACLE_LABEL[obstacle as Obstacle]}
                      </span>
                      <span className="a-subheadline tabular text-label-secondary">
                        {count}×
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              {notYes > 0 && (
                <p className="a-caption mt-3 text-label-secondary">
                  {notYes} {notYes === 1 ? "fechamento não concluiu" : "fechamentos não concluíram"} o
                  essencial do dia.
                </p>
              )}
            </Card>
          </section>

          <section>
            <SectionLabel>Decisão por meta (próxima semana)</SectionLabel>
            {goals.length === 0 ? (
              <Card className="p-5">
                <p className="a-subheadline text-label-secondary">
                  Nenhuma meta ativa no trimestre. Defina metas em Objetivos e planeje as
                  pedras na aba Semana.
                </p>
              </Card>
            ) : (
              <div className="space-y-3">
                {goals.map((goal) => {
                  const goalRocks = rocks.filter((r) => r.goalId === goal.id);
                  const delivery = getGoalDelivery(state, goal.id);
                  const decision = decisions[goal.id] ?? "keep";
                  const options: Array<{ value: Decision; label: string; hint: string }> = [
                    { value: "keep", label: "Manter", hint: "Segue igual" },
                    { value: "reduce", label: "Reduzir", hint: "Menos ambição" },
                    { value: "abandon", label: "Abandonar", hint: "Arquiva a meta" },
                    { value: "done", label: "Concluir", hint: "Atingida" },
                  ];
                  return (
                    <Card key={goal.id} className="p-5">
                      <div className="mb-3">
                        <p className="a-subheadline text-label">{goal.title}</p>
                        <p className="a-caption mt-0.5 text-label-secondary">
                          {goalRocks.length === 0
                            ? "Sem pedra na semana"
                            : delivery.rate === null
                              ? `${goalRocks.length} ${goalRocks.length === 1 ? "pedra" : "pedras"} comprometida(s), sem entrega ainda`
                              : `Entrega: ${delivery.rate}%`}
                        </p>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {options.map((option) => {
                          const selected = decision === option.value;
                          return (
                            <button
                              key={option.value}
                              type="button"
                              aria-pressed={selected}
                              title={option.hint}
                              onClick={() =>
                                setDecisions((prev) => ({ ...prev, [goal.id]: option.value }))
                              }
                              className="a-caption min-h-[44px] rounded-xl border px-1"
                              style={{
                                borderColor: selected
                                  ? "color-mix(in oklab, var(--accent) 42%, transparent)"
                                  : "var(--separator)",
                                color: selected ? "var(--label)" : "var(--label-secondary)",
                                background: selected ? "var(--fill-subtle)" : "transparent",
                              }}
                            >
                              {option.label}
                            </button>
                          );
                        })}
                      </div>
                      {decision === "reduce" && (
                        <div className="mt-3">
                          <input
                            type="text"
                            value={reducedOutcomes[goal.id] ?? ""}
                            onChange={(e) =>
                              setReducedOutcomes((prev) => ({
                                ...prev,
                                [goal.id]: e.target.value,
                              }))
                            }
                            placeholder={goal.outcome || "Novo resultado mensurável..."}
                            aria-label={`Novo alvo de ${goal.title}`}
                            className="a-body min-h-[44px] w-full rounded-xl bg-fill-subtle px-3"
                          />
                          <p className="a-caption mt-1 text-label-secondary">
                            Ao registrar, este vira o novo resultado da meta.
                          </p>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          <button
            type="button"
            onClick={saveReview}
            className="a-btn a-btn-primary w-full min-h-[50px]"
          >
            Registrar revisão
          </button>
          <p className="a-caption text-center text-label-secondary">
            Decisões aplicam o status das metas automaticamente (abandonar arquiva,
            concluir marca como feita).
          </p>
        </div>
      ) : (
        <Card className="p-6 text-center" allowOverflow>
          <CheckCircle2 size={28} className="mx-auto mb-2 text-accent" />
          <p className="a-headline text-label">Semana revisada.</p>
          <p className="a-subheadline mt-1 text-label-secondary">
            Revisão registrada para {weekStart}.
          </p>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="a-caption a-hit-44 mt-4 inline-flex items-center gap-1.5 text-accent"
          >
            <RotateCcw size={14} />
            Revisar de novo
          </button>
        </Card>
      )}
    </main>
  );
}