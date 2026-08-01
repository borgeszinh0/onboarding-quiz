"use client";

import { useState, useEffect } from "react";
import {
  usePlanner,
  getActiveHabits,
  isHabitDone,
  weekDates,
  todayISO,
} from "@/lib/planner-store";
import { Card, SectionLabel, BottomSheet } from "@/components/apple/ui";
import { Plus } from "lucide-react";

const WEEKDAY_LABEL = ["S", "T", "Q", "Q", "S", "S", "D"];

export function HabitTracker() {
  const { state } = usePlanner();
  const [managing, setManaging] = useState(false);
  const habits = getActiveHabits(state);
  const today = todayISO();
  const dates = weekDates(today);

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionLabel>Hábitos Ativos</SectionLabel>
        <button
          type="button"
          onClick={() => setManaging(!managing)}
          className="a-caption text-[color:var(--accent-text)] transition-opacity hover:opacity-70"
        >
          {managing ? "Concluído" : "Gerenciar"}
        </button>
      </div>

      <BottomSheet isOpen={managing} onClose={() => setManaging(false)}>
        <h2 className="a-title-2 mb-4">Gerenciar Hábitos</h2>
        <HabitManager onClose={() => setManaging(false)} />
      </BottomSheet>

      {habits.length === 0 && !managing ? (
        <p className="a-subheadline mt-4 text-[color:var(--label-secondary)]">
          Você não tem hábitos ativos no momento. Clique em Gerenciar para criar um.
        </p>
      ) : (
        <div className="space-y-4">
          {habits.map((habit) => (
            <Card key={habit.id} className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="a-headline truncate text-[color:var(--label)]">
                    {habit.title}
                  </h3>
                  
                  {/* Gráfico de Consistência (últimos 14 dias) */}
                  <div className="mt-4">
                    <HabitChart habitId={habit.id} />
                  </div>
                </div>

                <div className="flex shrink-0 items-center">
                  <CheckTodayButton habitId={habit.id} date={today} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

function CheckTodayButton({ habitId, date }: { habitId: string; date: string }) {
  const { state, dispatch } = usePlanner();
  const done = isHabitDone(state, habitId, date);

  return (
    <button
      type="button"
      onClick={() => dispatch({ type: "TOGGLE_HABIT_LOG", habitId, date })}
      aria-pressed={done}
      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-all duration-300 active:scale-95"
      style={{
        background: done ? "var(--gemini-grad)" : "var(--fill-subtle)",
        color: done ? "var(--success-label)" : "var(--label-secondary)",
      }}
    >
      {done ? (
        <svg viewBox="0 0 14 14" className="h-6 w-6" fill="none">
          <path
            d="M2 7.5L5.5 11L12 3.5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <div className="h-5 w-5 rounded-full border-2 border-currentColor" />
      )}
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
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Novo hábito"
          className="a-subheadline min-h-[44px] min-w-0 flex-1 rounded-xl bg-[color:var(--fill-subtle)] px-3"
        />
        <button
          type="button"
          onClick={add}
          disabled={!title.trim()}
          aria-label="Adicionar hábito"
          className="a-hit-44 shrink-0 rounded-xl px-4 text-[color:var(--accent-text)] disabled:opacity-30"
        >
          <Plus size={24} />
        </button>
      </div>

      {state.habits.length > 0 && (
        <ul className="space-y-1">
          {state.habits.map((habit) => (
            <li key={habit.id} className="flex min-h-[44px] items-center gap-3">
              <button
                type="button"
                onClick={() => dispatch({ type: "TOGGLE_HABIT_ACTIVE", id: habit.id })}
                className="a-subheadline min-h-[44px] min-w-0 flex-1 text-left"
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
                className="a-caption a-hit-44 shrink-0 px-2 text-[color:var(--label-secondary)] hover:text-[color:var(--danger-text)]"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function HabitChart({ habitId }: { habitId: string }) {
  const { state } = usePlanner();
  const today = new Date();
  
  // Últimos 7 dias
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - 6 + i);
    const iso = d.toISOString().split("T")[0];
    return {
      iso,
      done: isHabitDone(state, habitId, iso),
      label: d.toLocaleDateString("pt-BR", { weekday: "narrow" })[0],
    };
  });

  // Cálculo de Streak (Dias consecutivos)
  let streak = 0;
  for (let i = days.length - 1; i >= 0; i--) {
    if (days[i].done) {
      streak++;
    } else {
      // Se não fez hoje, não perde o streak ainda (pode fazer até meia-noite).
      // Mas se não fez ontem, perdeu.
      if (i !== days.length - 1) break;
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span className="a-caption text-[color:var(--label-secondary)]">
          Últimos 7 dias
        </span>
        {streak > 0 && (
          <span className="a-caption ml-auto flex items-center gap-1 rounded-full bg-[color:var(--fill-subtle)] px-2 py-0.5 font-medium text-[color:var(--label)]">
            🔥 {streak} {streak === 1 ? "dia" : "dias"}
          </span>
        )}
      </div>
      <div className="flex h-14 items-end justify-between gap-1">
        {days.map((day, i) => (
          <div key={day.iso} className="flex flex-1 flex-col justify-end items-center gap-1.5 h-full">
            <div
              className="w-full rounded-sm transition-all duration-300"
              style={{
                height: day.done ? "100%" : "20%",
                background: day.done
                  ? "var(--gemini-grad)"
                  : "var(--fill-subtle)",
                opacity: day.done ? 1 : 0.5,
              }}
            />
            {/* Mostrar a letra de todos os dias */}
            <span
              className="text-[11px] leading-none font-medium text-[color:var(--label-secondary)] w-full text-center"
              style={{
                visibility: "visible",
                color: i === days.length - 1 ? "var(--label)" : "var(--label-secondary)",
              }}
            >
              {day.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
