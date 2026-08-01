"use client";

import { useState } from "react";
import { usePlanner, addMinutes, getTimeBlockForTask } from "@/lib/planner-store";
import type { TimeBlock } from "@/lib/planner-types";
import {
  DAY_MODE_RULES,
  getDayMode,
  getScheduleSuggestion,
  inferTaskFitCategory,
} from "@/lib/day-mode";

const DURATIONS = [15, 25, 30, 45, 60, 90] as const;

/**
 * Gatilho de agendamento, sempre em linha com o título: sem bloco, um chip
 * contorno "Agendar"; com bloco, o horário vira chip preenchido. O formulário
 * em si (ScheduleForm) é responsabilidade de quem chama — ele precisa de
 * largura própria e não pode brigar com um título longo na mesma linha.
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
          className="a-caption liquid-control tabular min-h-[44px] rounded-full px-2.5 text-accent backdrop-blur-[18px] backdrop-brightness-[1.01] backdrop-saturate-[165%] backdrop-contrast-[1.08]"
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
          className="a-caption flex h-11 w-11 shrink-0 items-center justify-center text-label-secondary"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenSchedule}
      className="a-caption liquid-control min-h-[44px] shrink-0 rounded-full px-2.5 backdrop-blur-[18px] backdrop-brightness-[1.01] backdrop-saturate-[165%] backdrop-contrast-[1.08] transition-colors duration-200"
      style={{ color: "var(--label-secondary)" }}
    >
      Agendar
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
  const isProtectedFocus = dayMode === "high" && taskCategory === "big";
  
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
    <div className="liquid-panel relative flex flex-wrap items-center gap-2 rounded-xl p-2.5 backdrop-blur-[26px] backdrop-brightness-[1.02] backdrop-saturate-[180%] backdrop-contrast-[1.08]">
      <p className="a-caption relative z-10 w-full text-label-secondary" role="status">
        {getScheduleSuggestion(dayMode, taskCategory)}
      </p>
      <input
        type="time"
        value={start}
        onChange={(e) => setStart(e.target.value)}
        aria-label="Horário de início"
        className="a-subheadline min-h-[44px] w-[104px] rounded-lg bg-page px-2"
      />
      <select
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
        aria-label="Duração"
        className="a-subheadline min-h-[44px] rounded-lg bg-page px-2"
      >
        {DURATIONS.map((d) => (
          <option key={d} value={d}>
            {d} min
          </option>
        ))}
      </select>
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
