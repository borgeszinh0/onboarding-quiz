"use client";

import { useState } from "react";
import {
  usePlanner,
  getActiveHabits,
  isHabitDone,
  todayISO,
  toISODate,
} from "@/lib/planner-store";
import { Card, SectionLabel, BottomSheet } from "@/components/apple/ui";
import type { Habit } from "@/lib/planner-types";
import { Check, Flame, MoreHorizontal, Plus } from "lucide-react";

export function HabitTracker() {
  const { state } = usePlanner();
  const [managing, setManaging] = useState(false);
  const habits = getActiveHabits(state);
  const today = todayISO();
  const days = getRecentDays(28);
  const currentStreak = getCurrentHabitStreak(habits, days, (habit, date) =>
    isHabitDone(state, habit.id, date)
  );
  const totalCompleted = days.reduce(
    (sum, day) =>
      sum + habits.filter((habit) => isHabitEligibleForDate(habit, day.iso) && isHabitDone(state, habit.id, day.iso)).length,
    0
  );
  const totalPossible = days.reduce(
    (sum, day) => sum + habits.filter((habit) => isHabitEligibleForDate(habit, day.iso)).length,
    0
  );

  return (
    <section className="space-y-4">
      <HabitRhythmCard
        habits={habits}
        days={days}
        streak={currentStreak}
        completed={totalCompleted}
        possible={totalPossible}
        onManage={() => setManaging(true)}
      />

      <div className="flex items-center justify-between">
        <SectionLabel>Hábitos Ativos</SectionLabel>
        <button
          type="button"
          onClick={() => setManaging(!managing)}
          className="a-caption a-hit-44 -mr-3 px-3 text-accent transition-opacity hover:opacity-70"
        >
          {managing ? "Concluído" : "Gerenciar"}
        </button>
      </div>

      <BottomSheet isOpen={managing} onClose={() => setManaging(false)}>
        <h2 className="a-title-2 mb-4">Gerenciar Hábitos</h2>
        <HabitManager />
      </BottomSheet>

      {habits.length === 0 && !managing ? (
        <Card className="p-5">
          <p className="a-headline text-label">Comece com um hábito pequeno.</p>
          <p className="a-subheadline mt-2 text-label-secondary">
            A matriz aparece assim que você marcar o primeiro dia.
          </p>
          <button
            type="button"
            onClick={() => setManaging(true)}
            className="a-subheadline a-hit-44 mt-4 rounded-full bg-fill-subtle px-4 font-medium text-accent"
          >
            Criar hábito
          </button>
        </Card>
      ) : (
        <div className="space-y-4">
          {habits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} today={today} days={days} />
          ))}
        </div>
      )}
    </section>
  );
}

function HabitRhythmCard({
  habits,
  days,
  streak,
  completed,
  possible,
  onManage,
}: {
  habits: Habit[];
  days: HabitDay[];
  streak: number;
  completed: number;
  possible: number;
  onManage: () => void;
}) {
  const { state } = usePlanner();
  const hasLogs = completed > 0;

  return (
    <Card
      className="metric-card"
      style={{
        minHeight: 180,
        padding: 20,
        borderRadius: 28,
        borderColor: "var(--separator)",
        background: "var(--metric-card-bg)",
        boxShadow: "var(--metric-card-shadow)",
      }}
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
            style={{
              color: "var(--metric-streak)",
              background: "color-mix(in oklab, var(--metric-streak) 13%, transparent)",
            }}
          >
            <Flame size={19} />
          </span>
          <h2 className="a-headline truncate text-label">Ritmo de hábitos</h2>
        </div>
        <span className="a-subheadline shrink-0 text-label-secondary">Semana</span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-5">
        <div className="min-w-0">
          <p className="text-[34px] font-semibold leading-[40px] tracking-normal text-label tabular">
            {streak} {streak === 1 ? "dia" : "dias"}
          </p>
          <p className="a-subheadline mt-1 text-label-secondary">
            {hasLogs ? "Sequência atual" : "Marque um hábito hoje para iniciar seu ritmo."}
          </p>
        </div>
        <HabitHeatmap
          days={days}
          dotSize={8}
          dotGap={6}
          getRatio={(day) => getHabitCompletionRatio(state, habits, day.iso)}
          getDisabled={(day) => habits.length === 0 || !habits.some((habit) => isHabitEligibleForDate(habit, day.iso))}
          label="Mapa dos últimos 28 dias de hábitos"
        />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="a-subheadline text-label-secondary">
          {habits.length > 0 ? `${completed}/${possible} concluídos` : "Matriz fantasma"}
        </p>
        {habits.length === 0 && (
          <button
            type="button"
            onClick={onManage}
            className="a-subheadline a-hit-44 rounded-full bg-fill-subtle px-4 font-medium text-accent"
          >
            Criar hábito
          </button>
        )}
      </div>
    </Card>
  );
}

function HabitCard({ habit, today, days }: { habit: Habit; today: string; days: HabitDay[] }) {
  const { state, dispatch } = usePlanner();
  const [menuOpen, setMenuOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState(habit.title);
  const doneToday = isHabitDone(state, habit.id, today);
  const completed = days.filter((day) => isHabitEligibleForDate(habit, day.iso) && isHabitDone(state, habit.id, day.iso)).length;
  const possible = days.filter((day) => isHabitEligibleForDate(habit, day.iso)).length;
  const streak = getCurrentSingleHabitStreak(habit, days, (date) => isHabitDone(state, habit.id, date));
  const saveTitle = () => {
    const title = draftTitle.trim();
    if (!title || title === habit.title) return;
    dispatch({ type: "UPDATE_HABIT", id: habit.id, title });
  };

  return (
    <Card
      className="metric-card"
      style={{
        minHeight: 104,
        padding: 16,
        borderRadius: 24,
        borderColor: "var(--separator)",
        background: "var(--metric-card-bg)",
        boxShadow: "var(--metric-card-shadow)",
      }}
    >
      <div className="space-y-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="a-headline text-label">{habit.title}</h3>
            <p className="a-caption mt-1 text-label-secondary">
              {streak} {streak === 1 ? "dia" : "dias"} de sequência
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-label={`Ações de ${habit.title}`}
            className="a-hit-44 -mr-2 -mt-2 flex shrink-0 items-center justify-center rounded-full text-label-secondary"
          >
            <MoreHorizontal size={22} />
          </button>
        </div>

        <div className="flex items-end justify-between gap-4">
          <p className="a-caption min-w-0 text-label-secondary">
            {completed}/{possible} dias concluídos
          </p>
          <div className="flex shrink-0 items-center gap-3">
            <HabitHeatmap
              days={days}
              dotSize={6}
              dotGap={4}
              getRatio={(day) => {
                if (!isHabitEligibleForDate(habit, day.iso)) return 0;
                return isHabitDone(state, habit.id, day.iso) ? 1 : 0;
              }}
              getDisabled={(day) => !isHabitEligibleForDate(habit, day.iso)}
              label={`Mapa dos últimos 28 dias de ${habit.title}`}
            />
            <button
              type="button"
              onClick={() => dispatch({ type: "TOGGLE_HABIT_LOG", habitId: habit.id, date: today })}
              aria-pressed={doneToday}
              aria-label={doneToday ? `Desmarcar ${habit.title} hoje` : `Marcar ${habit.title} hoje`}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform duration-200 active:scale-95"
              style={{
                background: doneToday ? "var(--metric-habits)" : "var(--fill-subtle)",
                color: doneToday ? "var(--success-label)" : "var(--label-secondary)",
              }}
            >
              <Check size={22} strokeWidth={2.6} />
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="mt-4 rounded-2xl bg-fill-subtle p-3">
          <label className="a-caption block text-label-secondary" htmlFor={`habit-title-${habit.id}`}>
            Editar hábito
          </label>
          <input
            id={`habit-title-${habit.id}`}
            type="text"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            onBlur={saveTitle}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                saveTitle();
                setMenuOpen(false);
              }
            }}
            className="a-subheadline mt-1 min-h-[44px] w-full rounded-xl bg-bg px-3 text-label"
          />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => dispatch({ type: "TOGGLE_HABIT_ACTIVE", id: habit.id })}
              className="a-caption a-hit-44 rounded-xl bg-bg px-3 font-medium text-label"
            >
              Pausar
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "REMOVE_HABIT", id: habit.id })}
              className="a-caption a-hit-44 rounded-xl bg-bg px-3 font-medium text-danger-text"
            >
              Remover
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}

function HabitManager() {
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
          className="a-subheadline min-h-[44px] min-w-0 flex-1 rounded-xl bg-fill-subtle px-3"
        />
        <button
          type="button"
          onClick={add}
          disabled={!title.trim()}
          aria-label="Adicionar hábito"
          className="a-hit-44 shrink-0 rounded-xl px-4 text-accent disabled:opacity-30"
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
                className="a-caption a-hit-44 shrink-0 px-2 text-label-secondary hover-text-danger"
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

interface HabitDay {
  iso: string;
}

function HabitHeatmap({
  days,
  dotSize,
  dotGap,
  getRatio,
  getDisabled,
  label,
}: {
  days: HabitDay[];
  dotSize: number;
  dotGap: number;
  getRatio: (day: HabitDay) => number;
  getDisabled: (day: HabitDay) => boolean;
  label: string;
}) {
  return (
    <div
      role="img"
      aria-label={label}
      className="grid grid-flow-col grid-rows-4"
      style={{ gap: dotGap }}
    >
      {days.map((day) => {
        const ratio = getRatio(day);
        const disabled = getDisabled(day);
        return (
          <span
            key={day.iso}
            title={`${day.iso}: ${Math.round(ratio * 100)}%`}
            className="rounded-full"
            style={{
              width: dotSize,
              height: dotSize,
              opacity: disabled ? 0.45 : 1,
              background: getHeatmapColor(ratio, disabled),
            }}
          />
        );
      })}
    </div>
  );
}

function getRecentDays(count: number): HabitDay[] {
  const today = new Date();
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() - (count - 1 - index));
    return {
      iso: toISODate(date),
    };
  });
}

function getHabitCompletionRatio(state: ReturnType<typeof usePlanner>["state"], habits: Habit[], date: string): number {
  const eligible = habits.filter((habit) => isHabitEligibleForDate(habit, date));
  if (eligible.length === 0) return 0;
  const done = eligible.filter((habit) => isHabitDone(state, habit.id, date)).length;
  return done / eligible.length;
}

function isHabitEligibleForDate(habit: Habit, date: string): boolean {
  return habit.createdAt <= new Date(`${date}T23:59:59`).getTime();
}

function getCurrentHabitStreak(
  habits: Habit[],
  days: HabitDay[],
  isDone: (habit: Habit, date: string) => boolean
): number {
  let streak = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    const eligible = habits.filter((habit) => isHabitEligibleForDate(habit, days[index].iso));
    if (eligible.length === 0) continue;
    if (eligible.some((habit) => isDone(habit, days[index].iso))) streak += 1;
    else if (index !== days.length - 1) break;
  }
  return streak;
}

function getCurrentSingleHabitStreak(
  habit: Habit,
  days: HabitDay[],
  isDone: (date: string) => boolean
): number {
  let streak = 0;
  for (let index = days.length - 1; index >= 0; index -= 1) {
    if (!isHabitEligibleForDate(habit, days[index].iso)) continue;
    if (isDone(days[index].iso)) streak += 1;
    else if (index !== days.length - 1) break;
  }
  return streak;
}

function getHeatmapColor(ratio: number, disabled: boolean): string {
  if (disabled) return "color-mix(in oklab, var(--metric-track) 62%, transparent)";
  if (ratio <= 0) return "var(--metric-track)";
  if (ratio < 0.5) return "color-mix(in oklab, var(--metric-habits) 30%, var(--metric-track))";
  if (ratio < 1) return "color-mix(in oklab, var(--metric-habits) 64%, var(--metric-track))";
  return "var(--metric-habits)";
}
