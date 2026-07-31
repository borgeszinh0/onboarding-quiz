"use client";

import { useState } from "react";
import { usePlanner, addMinutes, getTimeBlockForTask } from "@/lib/planner-store";
import type { TimeBlock } from "@/lib/planner-types";

const DURATIONS = [15, 30, 45, 60, 90] as const;

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
          className="a-caption tabular min-h-[44px] rounded-full bg-[color:var(--fill-subtle)] px-2.5 text-[color:var(--accent-text)]"
        >
          {block.startTime}
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "REMOVE_TIME_BLOCK", id: block.id })}
          aria-label="Remover agendamento"
          className="a-caption flex h-11 w-11 shrink-0 items-center justify-center text-[color:var(--label-secondary)]"
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
      className="a-caption min-h-[44px] shrink-0 rounded-full border px-2.5 transition-colors duration-200"
      style={{ borderColor: "var(--separator)", color: "var(--label-secondary)" }}
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
  
  const [start, setStart] = useState("09:00");
  const [duration, setDuration] = useState<number>(task?.estimatedMinutes || DURATIONS[1]);
  const [conflict, setConflict] = useState<TimeBlock | null>(null);

  const end = addMinutes(start, duration);

  const submit = () => {
    dispatch({
      type: "ADD_TIME_BLOCK",
      taskId,
      date,
      startTime: start,
      endTime: end,
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
      <div
        className="flex flex-col gap-3 rounded-xl p-3"
        style={{ background: "var(--fill-subtle)" }}
      >
        <p className="a-subheadline text-[color:var(--danger-text)]">
          Conflita com {conflict.startTime}-{conflict.endTime}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={replaceConflict}
            className="a-caption min-h-[36px] rounded-lg bg-[color:var(--color-danger)] px-3 text-white transition-opacity hover:opacity-90"
          >
            Substituir
          </button>
          <button
            type="button"
            onClick={submit}
            className="a-caption min-h-[36px] rounded-lg border border-[color:var(--separator)] bg-[color:var(--bg)] px-3 text-[color:var(--label)] transition-colors hover:bg-[color:var(--fill-subtle)]"
          >
            Agendar mesmo
          </button>
          <button
            type="button"
            onClick={() => setConflict(null)}
            className="a-caption min-h-[36px] rounded-lg px-3 text-[color:var(--label-secondary)] hover:text-[color:var(--label)]"
          >
            Outro horário
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-wrap items-center gap-2 rounded-xl p-2.5"
      style={{ background: "var(--fill-subtle)" }}
    >
      <input
        type="time"
        value={start}
        onChange={(e) => setStart(e.target.value)}
        aria-label="Horário de início"
        className="a-subheadline min-h-[44px] w-[104px] rounded-lg bg-[color:var(--bg)] px-2"
      />
      <select
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
        aria-label="Duração"
        className="a-subheadline min-h-[44px] rounded-lg bg-[color:var(--bg)] px-2"
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
          className="a-caption a-hit-44 text-[color:var(--label-secondary)]"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={confirm}
          className="a-subheadline a-hit-44 text-[color:var(--accent-text)]"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}
