"use client";

import { useState } from "react";
import { usePlanner, addMinutes, getTimeBlockForTask } from "@/lib/planner-store";

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
          className="tabular min-h-[44px] rounded-full bg-[color:var(--fill-subtle)] px-2.5 text-[13px] font-medium text-[color:var(--accent-text)]"
        >
          {block.startTime}
        </button>
        <button
          type="button"
          onClick={() => dispatch({ type: "REMOVE_TIME_BLOCK", id: block.id })}
          aria-label="Remover agendamento"
          className="flex h-11 w-11 shrink-0 items-center justify-center text-[13px] text-[color:var(--label-secondary)]"
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
      className="min-h-[44px] shrink-0 rounded-full border px-2.5 text-[13px] font-medium transition-colors duration-200"
      style={{ borderColor: "var(--separator)", color: "var(--label-secondary)" }}
    >
      Agendar
    </button>
  );
}

/** Formulário de horário, renderizado abaixo da linha da tarefa quando aberto. */
export function ScheduleForm({
  taskId,
  date,
  onDone,
}: {
  taskId: string;
  date: string;
  onDone: () => void;
}) {
  const { dispatch } = usePlanner();
  const [start, setStart] = useState("09:00");
  const [duration, setDuration] = useState<number>(DURATIONS[1]);

  const confirm = () => {
    dispatch({
      type: "ADD_TIME_BLOCK",
      taskId,
      date,
      startTime: start,
      endTime: addMinutes(start, duration),
    });
    onDone();
  };

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
        className="min-h-[44px] w-[104px] rounded-lg bg-[color:var(--bg)] px-2 text-[14px]"
      />
      <select
        value={duration}
        onChange={(e) => setDuration(Number(e.target.value))}
        aria-label="Duração"
        className="min-h-[44px] rounded-lg bg-[color:var(--bg)] px-2 text-[14px]"
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
          className="a-hit-44 text-[13px] text-[color:var(--label-secondary)]"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={confirm}
          className="a-hit-44 text-[15px] font-medium text-[color:var(--accent-text)]"
        >
          Confirmar
        </button>
      </div>
    </div>
  );
}
