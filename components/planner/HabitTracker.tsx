"use client";

import { useState } from "react";
import {
  usePlanner,
  getActiveHabits,
  isHabitDone,
  todayISO,
  toISODate,
  weekDates,
} from "@/lib/planner-store";
import { Card, SectionLabel, BottomSheet } from "@/components/apple/ui";
import type { Habit } from "@/lib/planner-types";
import { Check, Flame, MoreHorizontal, Plus } from "lucide-react";

export function HabitTracker() {
  const { state } = usePlanner();
  const [managing, setManaging] = useState(false);
  const habits = getActiveHabits(state);
  const today = todayISO();
  const weekDays = getWeekHabitDays(today);
  const streakDays = getRecentDays(28);
  const weekScores = weekDays.map((day) => ({
    ...day,
    score: getHabitCompletionRatio(state, habits, day.iso),
  }));
  const maintainedDays = weekScores.filter((day) => day.score > 0).length;

  return (
    <section className="space-y-4">
      <HabitRhythmCard
        habits={habits}
        days={weekScores}
        maintainedDays={maintainedDays}
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
            O gráfico e os anéis aparecem assim que você marcar o primeiro dia.
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
            <HabitCard
              key={habit.id}
              habit={habit}
              today={today}
              weekDays={weekDays}
              streakDays={streakDays}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function HabitRhythmCard({
  habits,
  days,
  maintainedDays,
  onManage,
}: {
  habits: Habit[];
  days: HabitScoreDay[];
  maintainedDays: number;
  onManage: () => void;
}) {
  const hasLogs = days.some((day) => day.score > 0);

  return (
    <Card
      className="metric-card"
      style={{
        minHeight: 180,
        padding: 20,
        borderRadius: 20,
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
          <h2 className="a-headline truncate text-label">Ritmo</h2>
        </div>
        <span className="a-subheadline shrink-0 text-label-secondary">Semana</span>
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-5">
        <div className="min-w-0">
          <p className="text-[34px] font-semibold leading-[40px] tracking-normal text-label tabular">
            {maintainedDays} {maintainedDays === 1 ? "dia" : "dias"}
          </p>
          <p className="a-subheadline mt-1 text-label-secondary">
            {hasLogs ? "Hábitos mantidos nesta semana" : "Marque um hábito hoje para iniciar seu ritmo."}
          </p>
        </div>
        <HabitPointsChart days={days} disabled={habits.length === 0} />
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <p className="a-subheadline text-label-secondary">
          {habits.length > 0 ? "Tendência semanal" : "Gráfico aguardando dados"}
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

function HabitCard({
  habit,
  today,
  weekDays,
  streakDays,
}: {
  habit: Habit;
  today: string;
  weekDays: HabitDay[];
  streakDays: HabitDay[];
}) {
  const { state, dispatch } = usePlanner();
  const [menuOpen, setMenuOpen] = useState(false);
  const [draftTitle, setDraftTitle] = useState(habit.title);
  const doneToday = isHabitDone(state, habit.id, today);
  const completed = weekDays.filter((day) => isHabitEligibleForDate(habit, day.iso) && isHabitDone(state, habit.id, day.iso)).length;
  const possible = weekDays.filter((day) => isHabitEligibleForDate(habit, day.iso)).length;
  const ratio = possible > 0 ? completed / possible : 0;
  const streak = getCurrentSingleHabitStreak(habit, streakDays, (date) => isHabitDone(state, habit.id, date));
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
        borderRadius: 20,
        borderColor: "var(--separator)",
        background: "var(--metric-card-bg)",
        boxShadow: "var(--metric-card-shadow)",
      }}
    >
      <div className="grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-3">
        <HabitProgressRing ratio={ratio} muted={!habit.isActive} />

        <div className="min-w-0">
          <h3 className="a-headline text-label">{habit.title}</h3>
          <p className="a-caption mt-1 text-label-secondary">
            {completed}/{possible} esta semana
          </p>
          <p className="a-caption mt-1 text-label-secondary">
            Sequência de {streak} {streak === 1 ? "dia" : "dias"}
          </p>
        </div>

        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen((value) => !value)}
            aria-expanded={menuOpen}
            aria-label={`Ações de ${habit.title}`}
            className="a-hit-44 flex shrink-0 items-center justify-center rounded-full text-label-secondary"
          >
            <MoreHorizontal size={22} />
          </button>
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
  label?: string;
}

interface HabitScoreDay extends HabitDay {
  label: string;
  score: number;
}

function HabitPointsChart({ days, disabled }: { days: HabitScoreDay[]; disabled: boolean }) {
  const width = 172;
  const height = 70;
  const chartHeight = 60;
  const horizontalPadding = 8;
  const today = todayISO();
  const points = days.map((day, index) => {
    const x =
      horizontalPadding +
      (index / Math.max(1, days.length - 1)) * (width - horizontalPadding * 2);
    const y = getHabitPointY(day.score, chartHeight);
    return { ...day, x, y };
  });
  const visiblePoints = points.filter((point) => point.iso <= today);
  const linePath = getSmoothPath(visiblePoints);
  const baseY = chartHeight - 2;
  const areaPath =
    visiblePoints.length > 0 && linePath
      ? `${linePath} L ${visiblePoints[visiblePoints.length - 1].x} ${baseY} L ${visiblePoints[0].x} ${baseY} Z`
      : "";
  const hasVisibleData = visiblePoints.some((point) => point.score > 0);
  const currentPoint = visiblePoints[visiblePoints.length - 1];

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-[70px] w-[172px]"
        role="img"
        aria-label="Pontuação semanal dos hábitos"
      >
        <defs>
          <linearGradient id="habit-rhythm-area" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--metric-habits)" stopOpacity="0.22" />
            <stop offset="72%" stopColor="var(--metric-habits)" stopOpacity="0.08" />
            <stop offset="100%" stopColor="var(--metric-habits)" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[14, 34, 54].map((y) => (
          <line
            key={y}
            x1={horizontalPadding}
            x2={width - horizontalPadding}
            y1={y}
            y2={y}
            stroke="var(--metric-track)"
            strokeWidth="1"
            opacity="0.55"
          />
        ))}
        {!disabled && hasVisibleData && (
          <>
            <path
              d={areaPath}
              fill="url(#habit-rhythm-area)"
            />
            <path
              d={linePath}
              fill="none"
              stroke="color-mix(in oklab, var(--metric-habits) 42%, transparent)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.22"
            />
            <path
              d={linePath}
              fill="none"
              stroke="var(--metric-habits)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </>
        )}
        {visiblePoints.map((point) => {
          const active = point.score > 0;
          const complete = point.score >= 1;

          return (
            <circle
              key={point.iso}
              cx={point.x}
              cy={point.y}
              r={point.iso === currentPoint?.iso ? 5 : complete ? 4.5 : 4}
              fill={active ? "var(--metric-habits)" : "var(--metric-track)"}
              stroke={
                point.iso === currentPoint?.iso
                  ? "var(--metric-card-bg)"
                  : complete
                    ? "color-mix(in oklab, var(--metric-habits) 28%, var(--bg))"
                    : "transparent"
              }
              strokeWidth={point.iso === currentPoint?.iso || complete ? 2 : 0}
            >
              <title>{`${point.label}: ${Math.round(point.score * 100)}%`}</title>
            </circle>
          );
        })}
      </svg>
      <div className="mt-2 flex justify-between gap-[10px]">
        {days.map((day) => (
          <span
            key={day.iso}
            className="a-caption block w-[10px] text-center uppercase text-label-secondary"
          >
            {day.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function getSmoothPath(points: Array<HabitScoreDay & { x: number; y: number }>): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;

    const previous = points[index - 1];
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX} ${previous.y}, ${controlX} ${point.y}, ${point.x} ${point.y}`;
  }, "");
}

function HabitProgressRing({ ratio, muted }: { ratio: number; muted: boolean }) {
  const size = 44;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, ratio));
  const strokeDashoffset = circumference * (1 - progress);
  const complete = progress >= 1;
  const color = muted ? "var(--metric-muted)" : "var(--metric-habits)";

  return (
    <span className="relative flex h-11 w-11 shrink-0 items-center justify-center">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="-rotate-90 h-11 w-11"
        role="img"
        aria-label={`${Math.round(progress * 100)}% concluído nesta semana`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--metric-track)"
          strokeWidth={strokeWidth}
        />
        {progress > 0 && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        )}
      </svg>
      {complete && !muted && (
        <Check
          aria-hidden
          size={15}
          strokeWidth={2.6}
          className="absolute text-[color:var(--metric-habits)]"
        />
      )}
    </span>
  );
}

function getHabitPointY(score: number, height: number): number {
  if (score <= 0) return height - 8;
  if (score < 0.5) return height - 28;
  return 14;
}

function getWeekHabitDays(anchor: string): HabitScoreDay[] {
  return weekDates(anchor).map((iso, index) => ({
    iso,
    label: ["S", "T", "Q", "Q", "S", "S", "D"][index],
    score: 0,
  }));
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
