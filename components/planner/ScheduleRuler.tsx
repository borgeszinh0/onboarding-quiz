"use client";

import { usePlanner, getTimeBlocksForDate } from "@/lib/planner-store";
import { SCHEDULE_END_HOUR, SCHEDULE_START_HOUR } from "@/lib/planner-data";
import { Card, SectionLabel } from "@/components/apple/ui";

const HOUR_HEIGHT = 48;

function minutesFromRulerStart(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h - SCHEDULE_START_HOUR) * 60 + m;
}

/** Régua de horários do dia: cada bloco agendado vira uma barra na posição certa. */
export function ScheduleRuler({
  date,
  onFocus,
}: {
  date: string;
  onFocus: (taskId: string) => void;
}) {
  const { state } = usePlanner();
  const blocks = getTimeBlocksForDate(state, date);
  const hours = Array.from(
    { length: SCHEDULE_END_HOUR - SCHEDULE_START_HOUR + 1 },
    (_, i) => SCHEDULE_START_HOUR + i
  );
  const rulerHeight = (hours.length - 1) * HOUR_HEIGHT;
  const taskById = new Map(state.tasks.map((t) => [t.id, t]));

  return (
    <section>
      <SectionLabel>Cronograma</SectionLabel>
      <Card className="mt-3 overflow-hidden p-0">
        {blocks.length === 0 && (
          <p className="p-5 text-[15px] text-[color:var(--label-secondary)]">
            Nada agendado ainda. Toque em &quot;Agendar&quot; numa tarefa do
            funil acima.
          </p>
        )}
        <div className="relative px-5 py-2" style={{ height: rulerHeight }}>
          {hours.map((h, i) => (
            <div
              key={h}
              className="absolute inset-x-5 border-t border-[color:var(--separator)]"
              style={{ top: i * HOUR_HEIGHT }}
            >
              <span className="tabular -translate-y-1/2 inline-block bg-[color:var(--bg)] pr-2 text-[11px] text-[color:var(--label-secondary)]">
                {String(h).padStart(2, "0")}:00
              </span>
            </div>
          ))}

          {blocks.map((block) => {
            const task = taskById.get(block.taskId);
            if (!task) return null;
            const top = (minutesFromRulerStart(block.startTime) / 60) * HOUR_HEIGHT;
            const height = Math.max(
              20,
              ((minutesFromRulerStart(block.endTime) -
                minutesFromRulerStart(block.startTime)) /
                60) *
                HOUR_HEIGHT
            );

            return (
              <button
                key={block.id}
                type="button"
                onClick={() => onFocus(block.taskId)}
                className="absolute inset-x-5 overflow-hidden rounded-lg px-2.5 py-1 text-left transition-opacity hover:opacity-90"
                style={{
                  top,
                  height,
                  background:
                    task.status === "done"
                      ? "var(--fill-subtle)"
                      : "color-mix(in oklab, var(--color-accent) 16%, var(--bg))",
                }}
              >
                <span
                  className="block truncate text-[13px] font-medium"
                  style={{
                    color:
                      task.status === "done"
                        ? "var(--label-secondary)"
                        : "var(--accent-text)",
                    textDecoration: task.status === "done" ? "line-through" : undefined,
                  }}
                >
                  {block.startTime} · {task.title}
                </span>
              </button>
            );
          })}
        </div>
      </Card>
    </section>
  );
}
