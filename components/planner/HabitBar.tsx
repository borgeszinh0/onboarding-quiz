"use client";

import { useState } from "react";
import { usePlanner, getActiveHabits, isHabitDone } from "@/lib/planner-store";

/**
 * Barra fixa no rodapé da Visão Diária. Um toque marca o hábito do dia — sem
 * navegar, sem abrir tela. "Gerenciar" expande o cadastro no lugar.
 */
export function HabitBar({ date }: { date: string }) {
  const { state } = usePlanner();
  const [managing, setManaging] = useState(false);
  const habits = getActiveHabits(state);

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-xl"
      style={{
        borderColor: "var(--separator)",
        background: "color-mix(in oklab, var(--bg) 88%, transparent)",
      }}
    >
      <div className="mx-auto max-w-xl px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
        {managing && <HabitManager onClose={() => setManaging(false)} />}

        <div className="flex items-center gap-2 overflow-x-auto">
          {habits.length === 0 && !managing && (
            <p className="text-[13px] text-[color:var(--label-secondary)]">
              Nenhum hábito ativo.
            </p>
          )}
          {habits.map((habit) => (
            <HabitChip key={habit.id} habitId={habit.id} title={habit.title} date={date} />
          ))}
          <button
            type="button"
            onClick={() => setManaging((v) => !v)}
            aria-expanded={managing}
            aria-label="Gerenciar hábitos"
            className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[15px] text-[color:var(--label-secondary)] transition-colors hover:bg-[color:var(--fill-subtle)]"
          >
            ⚙
          </button>
        </div>
      </div>
    </div>
  );
}

function HabitChip({
  habitId,
  title,
  date,
}: {
  habitId: string;
  title: string;
  date: string;
}) {
  const { state, dispatch } = usePlanner();
  const done = isHabitDone(state, habitId, date);

  return (
    <button
      type="button"
      onClick={() => dispatch({ type: "TOGGLE_HABIT_LOG", habitId, date })}
      aria-pressed={done}
      className="flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors duration-200"
      style={
        done
          ? { background: "var(--success-fill)", color: "var(--success-label)" }
          : { background: "var(--fill-subtle)", color: "var(--label)" }
      }
    >
      {done && "✓ "}
      {title}
    </button>
  );
}

function HabitManager({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = usePlanner();
  const [title, setTitle] = useState("");

  const add = () => {
    if (!title.trim()) return;
    dispatch({ type: "ADD_HABIT", title: title.trim() });
    setTitle("");
  };

  return (
    <div className="mb-3 space-y-3 border-b border-[color:var(--separator)] pb-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Novo hábito"
          className="min-h-[44px] min-w-0 flex-1 rounded-xl bg-[color:var(--fill-subtle)] px-3 text-[15px]"
        />
        <button
          type="button"
          onClick={add}
          disabled={!title.trim()}
          aria-label="Adicionar hábito"
          className="a-hit-44 shrink-0 rounded-xl px-4 text-[18px] font-medium leading-none text-[color:var(--accent-text)] disabled:opacity-30"
        >
          +
        </button>
      </div>

      {state.habits.length > 0 && (
        <ul className="space-y-1">
          {state.habits.map((habit) => (
            <li key={habit.id} className="flex min-h-[44px] items-center gap-3">
              <button
                type="button"
                onClick={() => dispatch({ type: "TOGGLE_HABIT_ACTIVE", id: habit.id })}
                className="min-h-[44px] min-w-0 flex-1 text-left text-[15px]"
                style={
                  habit.isActive ? undefined : { color: "var(--label-secondary)" }
                }
              >
                {habit.title}
                {!habit.isActive && " · pausado"}
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "REMOVE_HABIT", id: habit.id })}
                aria-label={`Remover ${habit.title}`}
                className="a-hit-44 shrink-0 px-2 text-[13px] text-[color:var(--label-secondary)] hover:text-[color:var(--danger-text)]"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={onClose}
        className="a-hit-44 text-[13px] text-[color:var(--label-secondary)]"
      >
        Fechar
      </button>
    </div>
  );
}
