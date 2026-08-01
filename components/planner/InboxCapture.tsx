"use client";

import { useState } from "react";
import { usePlanner, getInboxTasks } from "@/lib/planner-store";
import { Card, SectionLabel } from "@/components/apple/ui";
import { parseNaturalInput } from "@/lib/parser";
import { Plus, X } from "lucide-react";
import { LifeAreaSelect } from "./LifeAreaField";
import type { LifeArea } from "@/lib/planner-types";
import {
  DAY_MODE_RULES,
  getDayMode,
  getFitLabel,
  getModeSource,
  sortTasksForMode,
  type TaskFitGroup,
} from "@/lib/day-mode";

/**
 * A caixa de captura. Tudo que não coube nos 9 slots do dia — ou que ainda
 * não tem hora de acontecer — mora aqui. Sem pastas, sem projetos.
 */
export function InboxCapture() {
  const { state, dispatch } = usePlanner();
  const [title, setTitle] = useState("");
  const [lifeArea, setLifeArea] = useState<LifeArea | null>(null);
  const items = getInboxTasks(state);
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const mode = getDayMode(state, date);
  const modeSource = getModeSource(state, date);
  const sortedItems = sortTasksForMode(items, state, date, mode);
  const groupedItems: Record<TaskFitGroup, typeof sortedItems> = {
    recommended: sortedItems.filter((item) => item.group === "recommended"),
    compatible: sortedItems.filter((item) => item.group === "compatible"),
    saveForLater: sortedItems.filter((item) => item.group === "saveForLater"),
  };

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
      lifeArea,
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
    setLifeArea(null);
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
        <div className="mb-4">
          <LifeAreaSelect value={lifeArea} onChange={setLifeArea} label="Área da nova tarefa" />
        </div>

        {items.length === 0 ? (
          <p className="a-subheadline text-label-secondary">
            Nada capturado.
          </p>
        ) : (
          <div className="space-y-4">
            {modeSource === "inferred" && (
              <p className="a-caption text-label-secondary">
                Sem modo escolhido. O app está usando Execução como padrão.
              </p>
            )}
            <p className="a-caption text-label-secondary">
              {DAY_MODE_RULES[mode].summary}
            </p>
            <InboxGroup
              title="Recomendadas para hoje"
              items={groupedItems.recommended}
              mode={mode}
              onSetArea={(id, area) => dispatch({ type: "SET_TASK_AREA", id, lifeArea: area })}
              onRemove={(id) => dispatch({ type: "REMOVE_TASK", id })}
            />
            <InboxGroup
              title="Também cabem"
              items={groupedItems.compatible}
              mode={mode}
              onSetArea={(id, area) => dispatch({ type: "SET_TASK_AREA", id, lifeArea: area })}
              onRemove={(id) => dispatch({ type: "REMOVE_TASK", id })}
            />
            <InboxGroup
              title="Melhor guardar"
              items={groupedItems.saveForLater}
              mode={mode}
              onSetArea={(id, area) => dispatch({ type: "SET_TASK_AREA", id, lifeArea: area })}
              onRemove={(id) => dispatch({ type: "REMOVE_TASK", id })}
            />
          </div>
        )}
      </Card>
    </section>
  );
}

function InboxGroup({
  title,
  items,
  mode,
  onSetArea,
  onRemove,
}: {
  title: string;
  items: ReturnType<typeof sortTasksForMode>;
  mode: ReturnType<typeof getDayMode>;
  onSetArea: (id: string, area: LifeArea | null) => void;
  onRemove: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <p className="a-caption mb-1.5 uppercase text-label-secondary">{title}</p>
      <ul className="divide-y divide-separator">
        {items.map(({ task, group }) => (
          <li key={task.id} className="flex min-h-[44px] items-start gap-3 py-3">
            <div className="min-w-0 flex-1">
              <span className="a-body block truncate">{task.title}</span>
              <span className="a-caption text-label-secondary">
                {getFitLabel(mode, group)}
              </span>
              <div className="mt-2">
                <LifeAreaSelect
                  value={task.lifeArea}
                  onChange={(area) => onSetArea(task.id, area)}
                  label={`Área de ${task.title}`}
                  compact
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemove(task.id)}
              aria-label={`Remover ${task.title}`}
              className="a-subheadline flex h-11 w-11 shrink-0 items-center justify-center text-label-secondary transition-colors hover-text-danger"
            >
              <X size={20} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
