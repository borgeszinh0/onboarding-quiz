"use client";

import { useState } from "react";
import { usePlanner, getInboxTasks } from "@/lib/planner-store";
import { Card, SectionLabel } from "@/components/apple/ui";
import { parseNaturalInput } from "@/lib/parser";
import { Plus, X } from "lucide-react";
import { TaskDetailModal } from "./TaskDetailModal";
import { GoalBadge } from "./DailyFunnel";

/**
 * A caixa de captura. Tudo que não coube nos slots do dia — ou que ainda não
 * tem hora de acontecer — mora aqui. Sem pastas, sem projetos, sem campos
 * extras: captura é 1 campo + Enter.
 */
export function InboxCapture() {
  const { state, dispatch } = usePlanner();
  const [title, setTitle] = useState("");
  const [detailTaskId, setDetailTaskId] = useState<string | null>(null);
  const items = [...getInboxTasks(state)].sort((a, b) => a.createdAt - b.createdAt);

  const capture = () => {
    if (!title.trim()) return;

    const parsed = parseNaturalInput(title.trim());
    const newId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    dispatch({
      type: "ADD_TASK",
      id: newId,
      title: parsed.title,
      category: parsed.date ? "small" : "inbox",
      date: parsed.date ?? null,
      estimatedMinutes: parsed.durationMinutes,
    });

    if (parsed.startTime && parsed.date) {
      let endH = parseInt(parsed.startTime.split(":")[0]);
      let endM = parseInt(parsed.startTime.split(":")[1]) + (parsed.durationMinutes || 30);

      while (endM >= 60) {
        endM -= 60;
        endH += 1;
      }

      const endTime = `${String(endH).padStart(2, "0")}:${String(endM).padStart(2, "0")}`;

      dispatch({
        type: "ADD_TIME_BLOCK",
        taskId: newId,
        date: parsed.date,
        startTime: parsed.startTime,
        endTime,
      });
    }

    setTitle("");
  };

  return (
    <section className="space-y-3">
      <SectionLabel>Inbox</SectionLabel>
      <Card className="p-5" allowOverflow>
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && capture()}
            placeholder="Despejar uma ideia"
            className="a-subheadline min-h-[44px] min-w-0 flex-1 rounded-xl bg-fill-subtle px-3"
          />
          <button
            type="button"
            onClick={capture}
            disabled={!title.trim()}
            aria-label="Capturar"
            className="a-hit-44 shrink-0 rounded-xl px-4 text-accent disabled:opacity-30"
          >
            <Plus size={24} />
          </button>
        </div>

        {items.length === 0 ? (
          <p className="a-subheadline text-label-secondary">
            Nada capturado.
          </p>
        ) : (
          <ul className="divide-y divide-separator">
            {items.map((task) => (
              <li key={task.id} className="space-y-2 py-3">
                <button
                  type="button"
                  onClick={() => setDetailTaskId(task.id)}
                  className="block min-w-0 w-full text-left"
                >
                  <span className="a-body block truncate text-label">{task.title}</span>
                  <span className="mt-0.5 block">
                    <GoalBadge task={task} />
                  </span>
                </button>
                <div className="flex min-h-[44px] items-center justify-between gap-3">
                  <span className="a-caption text-label-secondary">
                    {task.estimatedMinutes
                      ? `~${task.estimatedMinutes} min`
                      : "Sem duração estimada"}
                  </span>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: "REMOVE_TASK", id: task.id })}
                    aria-label={`Remover ${task.title}`}
                    className="a-subheadline flex h-11 w-11 shrink-0 items-center justify-center text-label-secondary transition-colors hover-text-danger"
                  >
                    <X size={20} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <TaskDetailModal taskId={detailTaskId} onClose={() => setDetailTaskId(null)} />
    </section>
  );
}