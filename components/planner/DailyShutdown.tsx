"use client";

import { useState } from "react";
import { usePlanner } from "@/lib/planner-store";
import { Card } from "@/components/apple/ui";
import type { MotivationReflection, Obstacle } from "@/lib/planner-types";

const OBSTACLES: Array<{ value: Obstacle; label: string }> = [
  { value: "interrupted", label: "Fui interrompido" },
  { value: "misestimated", label: "Estimei mal o esforço" },
  { value: "notImportant", label: "Não era o importante" },
  { value: "unclear", label: "Faltou clareza do próximo passo" },
  { value: "other", label: "Outro motivo" },
];

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
  const [reflection, setReflection] = useState<MotivationReflection | null>(null);
  const [obstacle, setObstacle] = useState<Obstacle | null>(null);

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
  const todaySessions = state.focusSessions?.filter((s) => s.date === date) || [];
  const totalFocusMinutes = Math.floor(
    todaySessions.reduce((acc, s) => acc + s.elapsedMs, 0) / 60000
  );

  const askingObstacle = reflection !== null && reflection !== "yes";

  return (
    <div className="mt-12">
      <Card className="p-5">
        <h2 className="a-headline mb-2 text-label">Encerrar o dia</h2>
        <p className="a-body mb-4 text-label-secondary">
          Você concluiu {doneCount} {doneCount === 1 ? "tarefa" : "tarefas"} hoje
          {totalFocusMinutes > 0 && <> e focou por {formatMins(totalFocusMinutes)}</>}.
        </p>

        <div className="mb-5">
          <p className="a-subheadline mb-3 text-label">
            O essencial de hoje foi concluído?
          </p>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                { value: "yes", label: "Sim" },
                { value: "partial", label: "Parcial" },
                { value: "no", label: "Não" },
              ] as const
            ).map((option) => {
              const selected = reflection === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setReflection(option.value)}
                  className="a-body min-h-[44px] rounded-xl border px-3 transition-colors duration-200"
                  style={{
                    borderColor: selected
                      ? "color-mix(in oklab, var(--accent) 42%, transparent)"
                      : "var(--separator)",
                    background: selected ? "var(--fill-subtle)" : "transparent",
                    color: selected ? "var(--label)" : "var(--label-secondary)",
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        {askingObstacle && (
          <div className="mb-5">
            <p className="a-subheadline mb-3 text-label">
              O que atrapalhou? (1 toque)
            </p>
            <div className="flex flex-wrap gap-2">
              {OBSTACLES.map((option) => {
                const selected = obstacle === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setObstacle(selected ? null : option.value)}
                    className="a-caption min-h-[36px] rounded-full border px-3 transition-colors duration-200"
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
            <p className="a-caption mt-2 text-label-secondary">
              Essa resposta alimenta a revisão semanal — ela é o dado que corrige o curso.
            </p>
          </div>
        )}

        {pendingCount > 0 && (
          <div className="mb-4 rounded-xl bg-fill-subtle p-4">
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
          disabled={reflection === null}
          onClick={() =>
            dispatch({ type: "SHUTDOWN_DAY", date, reflection: reflection!, obstacle })
          }
          className="a-btn a-btn-primary w-full min-h-[50px] disabled:opacity-40"
        >
          Encerrar Dia
        </button>
      </Card>
    </div>
  );
}