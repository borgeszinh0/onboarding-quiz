"use client";

import { useEffect, useRef, useState } from "react";
import { usePlanner, getInboxTasks } from "@/lib/planner-store";
import { Card, SectionLabel } from "@/components/apple/ui";
import { parseNaturalInput } from "@/lib/parser";
import { Plus, X } from "lucide-react";
import { LifeAreaMenu } from "./LifeAreaField";
import type { LifeArea } from "@/lib/planner-types";
import {
  LIFE_AREA_COLOR,
  LIFE_AREA_LABEL,
  LIFE_AREA_ORDER,
  filterTasksByLifeArea,
} from "@/lib/life-areas";
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
  const [areaFilter, setAreaFilter] = useState<LifeArea | null>(null);
  const items = getInboxTasks(state);
  const visibleItems = filterTasksByLifeArea(items, areaFilter);
  const today = new Date();
  const date = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const mode = getDayMode(state, date);
  const modeSource = getModeSource(state, date);
  const sortedItems = sortTasksForMode(visibleItems, state, date, mode);
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
      lifeArea: null,
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
        <div className="mb-4">
          <LifeAreaFilterMenu value={areaFilter} onChange={setAreaFilter} />
        </div>

        {items.length === 0 ? (
          <p className="a-subheadline text-label-secondary">
            Nada capturado.
          </p>
        ) : (
          <div className="space-y-4">
            {visibleItems.length === 0 && (
              <p className="a-subheadline text-label-secondary">
                Nenhuma tarefa nesta área.
              </p>
            )}
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

function LifeAreaFilterMenu({
  value,
  onChange,
}: {
  value: LifeArea | null;
  onChange: (area: LifeArea | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedLabel = value ? LIFE_AREA_LABEL[value] : "Todos";
  const selectedColor = value ? LIFE_AREA_COLOR[value] : "var(--label-secondary)";

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  const choose = (area: LifeArea | null) => {
    onChange(area);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={`Filtrar Inbox por área: ${selectedLabel}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="a-caption inline-flex min-h-[44px] w-full items-center justify-between rounded-full border border-separator bg-fill-subtle px-3 text-left transition-colors hover-bg-fill-subtle"
        style={{ color: selectedColor }}
      >
        <span className="truncate">{selectedLabel}</span>
        <svg
          viewBox="0 0 12 12"
          className="h-3 w-3 shrink-0 opacity-70"
          fill="none"
          aria-hidden
        >
          <path
            d="M3 4.5L6 7.5L9 4.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Filtrar Inbox por área"
          className="absolute right-0 top-full z-[70] mt-2 w-full min-w-56 rounded-2xl border border-[rgba(255,255,255,.16)] bg-[rgba(12,12,16,.94)] p-1.5 shadow-[0_24px_72px_rgba(0,0,0,.58)] backdrop-blur-[18px] backdrop-saturate-[130%]"
        >
          <LifeAreaFilterOption
            selected={!value}
            label="Todos"
            color="var(--label)"
            onSelect={() => choose(null)}
          />
          {LIFE_AREA_ORDER.map((area) => (
            <LifeAreaFilterOption
              key={area}
              selected={value === area}
              label={LIFE_AREA_LABEL[area]}
              color={LIFE_AREA_COLOR[area]}
              onSelect={() => choose(area)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LifeAreaFilterOption({
  selected,
  label,
  color,
  onSelect,
}: {
  selected: boolean;
  label: string;
  color: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={onSelect}
      className="a-caption flex min-h-[44px] w-full items-center gap-2 rounded-xl px-3 text-left text-label-secondary transition-colors hover-bg-fill-subtle"
      style={{
        color: selected ? color : "var(--label-secondary)",
        background: selected
          ? `color-mix(in oklab, ${color} 10%, transparent)`
          : "transparent",
      }}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {selected && (
        <span className="text-label" aria-hidden>
          ✓
        </span>
      )}
    </button>
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
          <li key={task.id} className="space-y-2 py-3">
            <div className="min-w-0">
              <span className="a-body block truncate text-label">{task.title}</span>
            </div>
            <div className="flex min-h-[44px] items-center justify-between gap-3">
              <span className="a-caption text-label-secondary">
                {getFitLabel(mode, group)}
              </span>
              <div className="flex shrink-0 items-center gap-2">
                <LifeAreaMenu
                  value={task.lifeArea}
                  onChange={(area) => onSetArea(task.id, area)}
                  label={`Área de ${task.title}`}
                  compact
                />
                <button
                  type="button"
                  onClick={() => onRemove(task.id)}
                  aria-label={`Remover ${task.title}`}
                  className="a-subheadline flex h-11 w-11 shrink-0 items-center justify-center text-label-secondary transition-colors hover-text-danger"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
