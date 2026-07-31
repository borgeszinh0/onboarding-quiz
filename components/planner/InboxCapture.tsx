"use client";

import { useState } from "react";
import { usePlanner, getInboxTasks } from "@/lib/planner-store";
import { Card, SectionLabel } from "@/components/apple/ui";
import { parseNaturalInput } from "@/lib/parser";
import { Plus, X } from "lucide-react";

/**
 * A caixa de captura. Tudo que não coube nos 9 slots do dia — ou que ainda
 * não tem hora de acontecer — mora aqui. Sem pastas, sem projetos.
 */
export function InboxCapture() {
  const { state, dispatch } = usePlanner();
  const [title, setTitle] = useState("");
  const items = getInboxTasks(state);

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
      <Card className="p-5">
        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && capture()}
            placeholder="Despejar uma ideia"
            className="a-subheadline min-h-[44px] min-w-0 flex-1 rounded-xl bg-[color:var(--fill-subtle)] px-3"
          />
          <button
            type="button"
            onClick={capture}
            disabled={!title.trim()}
            aria-label="Capturar"
            className="a-hit-44 shrink-0 rounded-xl px-4 text-[color:var(--accent-text)] disabled:opacity-30"
          >
            <Plus size={24} />
          </button>
        </div>

        {items.length === 0 ? (
          <p className="a-subheadline text-[color:var(--label-secondary)]">
            Nada capturado.
          </p>
        ) : (
          <ul className="divide-y divide-[color:var(--separator)]">
            {items.map((task) => (
              <li key={task.id} className="flex min-h-[44px] items-center gap-3 py-1">
                <span className="a-body min-w-0 flex-1">
                  {task.title}
                </span>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "REMOVE_TASK", id: task.id })}
                  aria-label={`Remover ${task.title}`}
                  className="a-subheadline flex h-11 w-11 shrink-0 items-center justify-center text-[color:var(--label-secondary)] transition-colors hover:text-[color:var(--danger-text)]"
                >
                  <X size={20} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
