"use client";

import {
  usePlanner,
  getTimeBlocksForDate,
  minutesBetween,
} from "@/lib/planner-store";
import { SectionLabel } from "@/components/apple/ui";

function formatDuration(startTime: string, endTime: string): string {
  const mins = minutesBetween(startTime, endTime);
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const rest = mins % 60;
  return rest > 0 ? `${h}h ${rest}m` : `${h}h`;
}

/** Agenda do dia: lista cronológica de blocos protegidos, otimizada para mobile. */
export function ScheduleRuler({
  date,
  onFocus,
}: {
  date: string;
  onFocus: (taskId: string) => void;
}) {
  const { state } = usePlanner();
  const blocks = getTimeBlocksForDate(state, date).sort((a, b) =>
    a.startTime.localeCompare(b.startTime)
  );
  const taskById = new Map(state.tasks.map((t) => [t.id, t]));

  return (
    <section>
      <div className="flex items-end justify-between">
        <SectionLabel>Agenda</SectionLabel>
        <span className="a-caption tabular text-label-secondary">
          {blocks.length === 0 ? "Livre" : `${blocks.length} ${blocks.length === 1 ? "bloco" : "blocos"}`}
        </span>
      </div>
      <div className="mt-3">
        {blocks.length === 0 && (
          <div className="a-card p-5">
            <p className="a-headline text-label">Sem blocos protegidos</p>
            <p className="a-subheadline mt-1 text-label-secondary">
              Agende tarefas pelo funil para reservar foco no dia.
            </p>
          </div>
        )}

        {blocks.length > 0 && (
          <ol className="space-y-3">
            {blocks.map((block, index) => {
              const task = taskById.get(block.taskId);
              if (!task) return null;
              const done = task.status === "done";
              const isLast = index === blocks.length - 1;

              return (
                <li key={block.id} className="relative grid grid-cols-[62px_14px_1fr] gap-x-3">
                  <div className="flex flex-col items-end pt-3">
                    <span className="a-caption tabular text-label">
                      {block.startTime}
                    </span>
                    <span className="a-caption tabular mt-0.5 text-label-secondary">
                      {block.endTime}
                    </span>
                  </div>

                  <div className="relative flex justify-center pt-[18px]">
                    <span
                      aria-hidden
                      className="h-2.5 w-2.5 rounded-full"
                      style={{
                        background: done ? "var(--label-secondary)" : "var(--gemini-grad)",
                      }}
                    />
                    {!isLast && (
                      <span
                        aria-hidden
                        className="absolute top-[16px] h-[calc(100%+12px)] w-px bg-separator"
                      />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onFocus(block.taskId)}
                    className="liquid-control min-h-[72px] overflow-hidden rounded-2xl px-4 py-3 text-left backdrop-blur-[18px] backdrop-brightness-[1.01] backdrop-saturate-[165%] backdrop-contrast-[1.08] transition-transform duration-200 active:scale-[0.99]"
                    style={{ opacity: done ? 0.66 : 1 }}
                  >
                    <span className="a-caption tabular text-label-secondary">
                      {formatDuration(block.startTime, block.endTime)}
                      {block.protected ? " · Foco protegido" : ""}
                    </span>
                    <span
                      className="a-headline mt-0.5 block"
                      style={{
                        color: done ? "var(--label-secondary)" : "var(--label)",
                        textDecoration: done ? "line-through" : undefined,
                      }}
                    >
                      {task.title}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        )}
      </div>
    </section>
  );
}
