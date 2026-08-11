"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePlanner, addMinutes, getTimeBlockForTask } from "@/lib/planner-store";
import type { TimeBlock } from "@/lib/planner-types";
import {
  DAY_MODE_RULES,
  getDayMode,
  getScheduleSuggestion,
  inferTaskFitCategory,
} from "@/lib/day-mode";
import { Clock3, X } from "lucide-react";

const DURATIONS = [15, 25, 30, 45, 60, 90] as const;
const START_TIMES = Array.from({ length: 31 }, (_, index) => {
  const totalMinutes = 7 * 60 + index * 30;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
});

/**
 * Gatilho de agendamento, sempre em linha com o título: sem bloco, um ícone
 * de relógio; com bloco, o horário aparece como texto colorido. O formulário
 * em si (ScheduleForm) é responsabilidade de quem chama.
 */
export function ScheduleTaskControl({
  taskId,
  onFocus,
  onOpenSchedule,
}: {
  taskId: string;
  onFocus: (taskId: string) => void;
  onOpenSchedule: () => void;
}) {
  const { state, dispatch } = usePlanner();
  const block = getTimeBlockForTask(state, taskId);

  if (block) {
    return (
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => onFocus(taskId)}
          className="a-caption tabular min-h-[44px] min-w-[44px] shrink-0 px-1 text-accent transition-opacity hover:opacity-75"
          aria-label={`Iniciar foco agendado para ${block.startTime}`}
        >
          {block.startTime}
        </button>
        {block.protected && (
          <span className="a-caption hidden rounded-full bg-fill-subtle px-2 py-1 text-accent sm:inline-flex">
            Foco protegido
          </span>
        )}
        <button
          type="button"
          onClick={() => dispatch({ type: "REMOVE_TIME_BLOCK", id: block.id })}
          aria-label="Remover agendamento"
          className="flex h-11 w-11 shrink-0 items-center justify-center text-label-secondary transition-colors hover-text-danger"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenSchedule}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-label-secondary transition-colors hover-bg-fill-subtle hover-text-accent"
      style={{ color: "var(--label-secondary)" }}
      aria-label="Agendar tarefa"
    >
      <Clock3 size={19} />
    </button>
  );
}

export function ScheduleForm({
  taskId,
  date,
  onDone,
}: {
  taskId: string;
  date: string;
  onDone: () => void;
}) {
  const { state, dispatch } = usePlanner();
  const task = state.tasks.find((t) => t.id === taskId);
  const dayMode = getDayMode(state, date);
  const taskCategory = task ? inferTaskFitCategory(task) : "medium";
  const suggestedDuration = DAY_MODE_RULES[dayMode].defaultBlockMinutes[taskCategory];
  const isProtectedFocus = dayMode === "focus" && taskCategory === "big";
  
  const [start, setStart] = useState("09:00");
  const [duration, setDuration] = useState<number>(task?.estimatedMinutes || suggestedDuration);
  const [conflict, setConflict] = useState<TimeBlock | null>(null);

  const end = addMinutes(start, duration);

  const submit = () => {
    dispatch({
      type: "ADD_TIME_BLOCK",
      taskId,
      date,
      startTime: start,
      endTime: end,
      protected: isProtectedFocus,
    });
    onDone();
  };

  const confirm = () => {
    const dateBlocks = state.timeBlocks.filter((b) => b.date === date && b.taskId !== taskId);
    const overlapping = dateBlocks.find((b) => start < b.endTime && end > b.startTime);

    if (overlapping) {
      setConflict(overlapping);
      return;
    }
    
    submit();
  };

  const replaceConflict = () => {
    if (conflict) {
      dispatch({ type: "REMOVE_TIME_BLOCK", id: conflict.id });
    }
    submit();
  };

  if (conflict) {
    return (
      <div className="liquid-panel relative flex flex-col gap-3 rounded-xl p-3 backdrop-blur-[26px] backdrop-brightness-[1.02] backdrop-saturate-[180%] backdrop-contrast-[1.08]">
        <p className="a-subheadline text-danger">
          Conflita com {conflict.startTime}-{conflict.endTime}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={replaceConflict}
            className="a-caption min-h-[36px] rounded-lg bg-danger-fill px-3 text-white transition-opacity hover:opacity-90"
          >
            Substituir
          </button>
          <button
            type="button"
            onClick={submit}
            className="a-caption min-h-[36px] rounded-lg border border-separator bg-page px-3 text-label transition-colors hover-bg-fill-subtle"
          >
            Agendar mesmo
          </button>
          <button
            type="button"
            onClick={() => setConflict(null)}
            className="a-caption min-h-[36px] rounded-lg px-3 text-label-secondary hover-text-label"
          >
            Outro horário
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="liquid-panel schedule-menu-panel relative flex flex-wrap items-center gap-2 rounded-xl p-2.5 backdrop-blur-[26px] backdrop-brightness-[1.02] backdrop-saturate-[180%] backdrop-contrast-[1.08]">
      <p className="a-caption relative z-10 w-full text-label-secondary" role="status">
        {getScheduleSuggestion(dayMode, taskCategory)}
      </p>
      <ScheduleOptionMenu
        label="Horário de início"
        value={start}
        options={START_TIMES.map((time) => ({ value: time, label: time }))}
        onChange={setStart}
      />
      <ScheduleOptionMenu
        label="Duração"
        value={duration}
        options={DURATIONS.map((minutes) => ({ value: minutes, label: `${minutes} min` }))}
        onChange={setDuration}
      />
      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          onClick={onDone}
          className="a-caption a-hit-44 text-label-secondary"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={confirm}
          className="a-subheadline a-hit-44 text-accent"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}

function ScheduleOptionMenu<T extends string | number>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  const [open, setOpen] = useState(false);
  const [placement, setPlacement] = useState<"top" | "bottom">("bottom");
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];

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

  useEffect(() => {
    if (!open) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.requestAnimationFrame(() => {
      const rect = rootRef.current?.getBoundingClientRect();
      if (rect) {
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        setPlacement(spaceBelow < 292 && spaceAbove > spaceBelow ? "top" : "bottom");
      }
      rootRef.current?.scrollIntoView({
        block: "center",
        inline: "nearest",
        behavior: reduceMotion ? "auto" : "smooth",
      });
    });
  }, [open]);

  const choose = (nextValue: T) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative z-20">
      <button
        type="button"
        aria-label={`${label}: ${selected.label}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className="a-subheadline inline-flex min-h-[44px] min-w-[96px] items-center justify-between gap-2 rounded-lg bg-page px-3 text-label transition-colors hover-bg-fill-subtle"
      >
        <span className="tabular">{selected.label}</span>
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
          id={id}
          role="listbox"
          aria-label={label}
          className={`absolute left-0 z-[80] max-h-64 w-36 overflow-y-auto rounded-2xl border border-[rgba(255,255,255,.16)] bg-[rgba(12,12,16,.94)] p-1.5 shadow-[0_24px_72px_rgba(0,0,0,.58)] backdrop-blur-[18px] backdrop-saturate-[130%] ${
            placement === "top" ? "bottom-full mb-2" : "top-full mt-2"
          }`}
        >
          {options.map((option) => {
            const selectedOption = option.value === value;
            return (
              <button
                key={String(option.value)}
                type="button"
                role="option"
                aria-selected={selectedOption}
                onClick={() => choose(option.value)}
                className="a-caption flex min-h-[44px] w-full items-center justify-between rounded-xl px-3 text-left transition-colors hover-bg-fill-subtle"
                style={{
                  color: selectedOption ? "var(--accent)" : "var(--label-secondary)",
                  background: selectedOption
                    ? "color-mix(in oklab, var(--accent) 12%, transparent)"
                    : "transparent",
                }}
              >
                <span className="tabular">{option.label}</span>
                {selectedOption && (
                  <span className="text-label" aria-hidden>
                    ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
