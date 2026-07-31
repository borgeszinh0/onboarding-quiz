"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  usePlanner,
  getTimeBlockForTask,
  minutesBetween,
  todayISO,
} from "@/lib/planner-store";
import { Button } from "@/components/apple/ui";

const TICK_MS = 1000;
const FALLBACK_MINUTES = 25;

function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const m = String(Math.floor(safe / 60)).padStart(2, "0");
  const s = String(safe % 60).padStart(2, "0");
  return `${m}:${s}`;
}

/**
 * Relógio de parede como store externo — nunca lido durante o render, só via
 * subscribe (chamado depois do commit). Evita a regra de pureza do React e
 * qualquer descompasso de hidratação.
 */
function useWallClock(active: boolean): number | null {
  const snapshot = useRef<number | null>(null);

  const subscribe = useCallback(
    (onChange: () => void) => {
      snapshot.current = Date.now();
      onChange();
      if (!active) return () => {};
      const id = setInterval(() => {
        snapshot.current = Date.now();
        onChange();
      }, TICK_MS);
      return () => clearInterval(id);
    },
    [active]
  );

  return useSyncExternalStore(subscribe, () => snapshot.current, () => null);
}

/**
 * Tela cheia de execução. Some o resto do app de propósito — o "A" do TEA é
 * atenção, e atenção não convive com distração na tela.
 */
export function FocusMode({
  taskId,
  onClose,
}: {
  taskId: string;
  onClose: () => void;
}) {
  const { state, dispatch } = usePlanner();
  const task = state.tasks.find((t) => t.id === taskId);
  const block = getTimeBlockForTask(state, taskId);

  const [status, setStatus] = useState<"running" | "paused">("running");
  const [accumulatedMs, setAccumulatedMs] = useState(0);
  const [sessionStartedAt] = useState(() => Date.now());
  const [resumeAt, setResumeAt] = useState<number | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- o cronômetro precisa de um timestamp real de início; Date.now() no corpo do render seria impuro
    setResumeAt(Date.now());
  }, []);

  useEffect(() => {
    if (!task) onClose();
  }, [task, onClose]);

  const now = useWallClock(status === "running");

  if (!task) return null;

  const totalMs =
    (block ? minutesBetween(block.startTime, block.endTime) : FALLBACK_MINUTES) *
    60_000;
  const runningMs = status === "running" && resumeAt && now ? now - resumeAt : 0;
  const elapsedMs = accumulatedMs + runningMs;
  const reached = elapsedMs >= totalMs;

  const togglePause = () => {
    if (status === "running") {
      const stoppedAt = Date.now();
      setAccumulatedMs((prev) => prev + (resumeAt ? stoppedAt - resumeAt : 0));
      setStatus("paused");
    } else {
      setResumeAt(Date.now());
      setStatus("running");
    }
  };

  const saveAndClose = (isCompleted: boolean) => {
    const finalRunningMs = status === "running" && resumeAt && now ? now - resumeAt : 0;
    const finalElapsedMs = accumulatedMs + finalRunningMs;

    dispatch({
      type: "SAVE_FOCUS_SESSION",
      session: {
        taskId: task.id,
        date: task.date || todayISO(),
        startedAt: sessionStartedAt,
        endedAt: Date.now(),
        elapsedMs: finalElapsedMs,
        completed: isCompleted,
      },
    });
    onClose();
  };

  const complete = () => {
    if (task.status !== "done") {
      dispatch({ type: "TOGGLE_TASK_DONE", id: task.id });
    }
    saveAndClose(true);
  };

  const displaySeconds = reached
    ? elapsedMs / 1000
    : (totalMs - elapsedMs) / 1000;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center px-6"
      style={{ background: "var(--bg)" }}
    >
      <p className="a-subheadline text-[color:var(--label-secondary)]">
        {reached ? "Alvo batido" : status === "paused" ? "Pausado" : "Em foco"}
      </p>
      <h1 className="a-title-2 mt-3 max-w-xs text-center">
        {task.title}
      </h1>
      <p className="a-large-title tabular mt-12">
        {formatClock(displaySeconds)}
      </p>

      <div className="mt-14 flex w-full max-w-xs flex-col gap-3">
        <Button onClick={complete}>Concluir tarefa</Button>
        <Button variant="secondary" onClick={togglePause}>
          {status === "running" ? "Pausar" : "Retomar"}
        </Button>
      </div>

      <button
        type="button"
        onClick={() => saveAndClose(false)}
        className="a-subheadline a-hit-44 mt-10 text-[color:var(--label-secondary)]"
      >
        Sair do foco
      </button>
    </div>
  );
}
