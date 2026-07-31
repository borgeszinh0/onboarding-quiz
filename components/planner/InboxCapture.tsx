"use client";

import { useState } from "react";
import { usePlanner, getInboxTasks } from "@/lib/planner-store";
import { Card, SectionLabel } from "@/components/apple/ui";

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
    dispatch({ type: "ADD_TASK", title: title.trim() });
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
            className="min-h-[44px] min-w-0 flex-1 rounded-xl bg-[color:var(--fill-subtle)] px-3 text-[15px]"
          />
          <button
            type="button"
            onClick={capture}
            disabled={!title.trim()}
            aria-label="Capturar"
            className="min-h-[44px] shrink-0 rounded-xl px-4 text-[20px] font-medium leading-none text-[color:var(--accent-text)] disabled:opacity-30"
          >
            +
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-[15px] text-[color:var(--label-secondary)]">
            Inbox vazio.
          </p>
        ) : (
          <ul className="divide-y divide-[color:var(--separator)]">
            {items.map((task) => (
              <li key={task.id} className="flex min-h-[44px] items-center gap-3 py-1">
                <span className="min-w-0 flex-1 text-[17px] leading-tight">
                  {task.title}
                </span>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "REMOVE_TASK", id: task.id })}
                  aria-label={`Remover ${task.title}`}
                  className="flex h-11 w-11 shrink-0 items-center justify-center text-[15px] text-[color:var(--label-secondary)] transition-colors hover:text-[color:var(--danger-text)]"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  );
}
