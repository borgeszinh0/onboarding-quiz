"use client";

import type { ReactNode } from "react";
import { useState } from "react";
import {
  usePlanner,
  weekDates,
  todayISO,
  dayCompletion,
  habitCompletion,
  occupiedMinutes,
  isPerfectDay,
  getActiveHabits,
  isHabitDone,
  getCurrentQuarterGoals,
  getWeekRocks,
  mondayOf,
} from "@/lib/planner-store";
import type { WeekRock } from "@/lib/planner-types";
import { Card, PageTitle } from "@/components/apple/ui";
import Link from "next/link";
import {
  Activity,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  ListChecks,
  Target,
  Timer,
  Trash2,
} from "lucide-react";

const WEEKDAY_LABEL = ["S", "T", "Q", "Q", "S", "S", "D"];
const WEEKDAY_FULL_LABEL = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];

interface DayStats {
  date: string;
  label: string;
  fullLabel: string;
  isToday: boolean;
  plannedMinutes: number;
  focusedMinutes: number;
  plannedTasks: number;
  tasksDone: number;
  habitsDone: number;
  habitsTotal: number;
  habitDots: boolean[];
  perfect: boolean;
  active: boolean;
  focusSessionsDone: number;
}

type MetricTone = "focus" | "tasks" | "plan" | "habits" | "consistency" | "energy";

const TONE_COLOR: Record<MetricTone, string> = {
  focus: "var(--metric-focus)",
  tasks: "var(--metric-tasks)",
  plan: "var(--metric-plan)",
  habits: "var(--metric-habits)",
  consistency: "var(--metric-consistency)",
  energy: "var(--metric-energy)",
};

export default function SemanaPage() {
  const { state, hydrated } = usePlanner();

  if (!hydrated) {
    return <main className="mx-auto w-full max-w-xl px-5 py-12" aria-busy="true" />;
  }

  const today = todayISO();
  const dates = weekDates(today);
  const activeHabits = getActiveHabits(state);
  const stats = dates.map((date, index): DayStats => {
    const tasks = dayCompletion(state, date);
    const habits = habitCompletion(state, date);
    const focusedMs = state.focusSessions
      .filter((session) => session.date === date)
      .reduce((sum, session) => sum + session.elapsedMs, 0);
    const focusSessionsDone = state.focusSessions.filter(
      (session) => session.date === date && session.completed
    ).length;
    const plannedMinutes = occupiedMinutes(state, date);
    const focusedMinutes = Math.round(focusedMs / 60000);
    const perfect = isPerfectDay(state, date);

    return {
      date,
      label: WEEKDAY_LABEL[index],
      fullLabel: WEEKDAY_FULL_LABEL[index],
      isToday: date === today,
      plannedMinutes,
      focusedMinutes,
      plannedTasks: tasks.total,
      tasksDone: tasks.done,
      habitsDone: habits.done,
      habitsTotal: habits.total,
      habitDots: activeHabits.map((habit) => isHabitDone(state, habit.id, date)),
      perfect,
      active: plannedMinutes > 0 || focusedMinutes > 0 || tasks.done > 0 || habits.done > 0,
      focusSessionsDone,
    };
  });

  const focusedMinutes = stats.reduce((sum, day) => sum + day.focusedMinutes, 0);
  const tasksDone = stats.reduce((sum, day) => sum + day.tasksDone, 0);
  const tasksTotal = stats.reduce((sum, day) => sum + day.plannedTasks, 0);
  const habitsDone = stats.reduce((sum, day) => sum + day.habitsDone, 0);
  const habitsTotal = stats.reduce((sum, day) => sum + day.habitsTotal, 0);
  const activeDays = stats.filter((day) => day.active).length;
  const focusSessionsDone = stats.reduce((sum, day) => sum + day.focusSessionsDone, 0);

  return (
    <main className="page-shell page-with-dock mx-auto w-full max-w-xl px-5 sm:max-w-3xl">
      <PageTitle eyebrow="Esta semana" title="Ritmo" />

      <RocksSection weekStart={dates[0]} />

      <WeekCloseCard today={today} />

      <p className="a-body -mt-5 mb-6 text-label-secondary">
        Cada card mostra um dado diferente: tendência, volume, comparação, recorrência,
        cumprimento diário e sessões.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <MetricCard
          icon={<Timer size={20} />}
          title="Foco semanal"
          period="Semana"
          value={formatMinutes(focusedMinutes)}
          caption={focusedMinutes > 0 ? "Minutos focados" : "Sem foco registrado"}
          tone="focus"
          chart={
            <TrendLineChart
              days={stats}
              values={stats.map((day) => day.focusedMinutes)}
              color="var(--metric-focus)"
              getLabel={(day) => `${day.fullLabel}: ${formatMinutes(day.focusedMinutes)}`}
            />
          }
        />

        <MetricCard
          icon={<CheckCircle2 size={20} />}
          title="Tarefas concluídas"
          period="Semana"
          value={`${tasksDone}/${tasksTotal}`}
          caption={getTaskCaption(tasksDone, tasksTotal)}
          tone="tasks"
          chart={
            <VerticalProgressBars
              days={stats}
              values={stats.map((day) => day.tasksDone)}
              color="var(--metric-tasks)"
              getLabel={(day) => `${day.fullLabel}: ${day.tasksDone} concluídas`}
            />
          }
        />

        <MetricCard
          icon={<ListChecks size={20} />}
          title="Planejado vs realizado"
          period="Semana"
          value={`${tasksDone}/${tasksTotal}`}
          caption="Tarefas feitas / planejadas"
          tone="plan"
          chart={
            <DualMarkerBars
              days={stats}
              planned={stats.map((day) => day.plannedTasks)}
              done={stats.map((day) => day.tasksDone)}
              color="var(--metric-plan)"
            />
          }
        />

        <MetricCard
          icon={<CalendarCheck2 size={20} />}
          title="Hábitos"
          period="Semana"
          value={`${habitsDone}/${habitsTotal}`}
          caption={
            habitsTotal > 0
              ? `${activeHabits.length} ${activeHabits.length === 1 ? "hábito ativo" : "hábitos ativos"}`
              : "Nenhum hábito ativo"
          }
          tone="habits"
          chart={<DotMatrix days={stats} />}
        />

        <MetricCard
          icon={<Activity size={20} />}
          title="Consistência"
          period="Semana"
          value={formatDays(activeDays)}
          caption="Dias com ritmo mantido"
          tone="consistency"
          chart={<DailyRings days={stats} color="var(--metric-consistency)" />}
        />

        <MetricCard
          icon={<Clock3 size={20} />}
          title="Blocos de foco"
          period="Semana"
          value={String(focusSessionsDone)}
          caption={focusSessionsDone > 0 ? "Sessões concluídas" : "Sem sessões concluídas"}
          tone="energy"
          chart={<SegmentedBars days={stats} color="var(--metric-energy)" />}
        />
      </div>
    </main>
  );
}

function MetricCard({
  icon,
  title,
  period,
  value,
  caption,
  tone,
  chart,
}: {
  icon: ReactNode;
  title: string;
  period: string;
  value: string;
  caption: string;
  tone: MetricTone;
  chart: ReactNode;
}) {
  const color = TONE_COLOR[tone];

  return (
    <Card
      className="metric-card"
      style={{
        minHeight: 148,
        padding: 20,
        borderRadius: 20,
        borderColor: "var(--separator)",
        background: "var(--metric-card-bg)",
        boxShadow: "var(--metric-card-shadow)",
      }}
    >
      <div className="mb-7 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{
              color,
              background: "color-mix(in oklab, currentColor 12%, transparent)",
            }}
          >
            {icon}
          </span>
          <h2 className="a-headline truncate text-label">{title}</h2>
        </div>
        <span className="a-subheadline shrink-0 text-label-secondary">{period}</span>
      </div>

      <div
        className="metric-card-layout"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          alignItems: "end",
          gap: 16,
        }}
      >
        <div className="min-w-0">
          <p className="text-[34px] font-semibold leading-[40px] tracking-normal text-label tabular">
            {value}
          </p>
          <p className="a-subheadline mt-1 text-label-secondary">{caption}</p>
        </div>
        <div
          className="metric-chart"
          style={{ justifySelf: "end", width: "min(144px, 100%)" }}
        >
          {chart}
        </div>
      </div>
    </Card>
  );
}

function VerticalProgressBars({
  days,
  values,
  color,
  getLabel,
}: {
  days: DayStats[];
  values: number[];
  color: string;
  getLabel: (day: DayStats) => string;
}) {
  const maxValue = Math.max(...values, 1);

  return (
    <div>
      <div className="flex h-14 items-end justify-between gap-[10px]">
        {days.map((day, index) => {
          const value = values[index];
          const height = value > 0 ? Math.max(6, (value / maxValue) * 56) : 0;

          return (
            <span
              key={day.date}
              className="flex h-14 w-2 items-end rounded-full"
              style={{ background: "var(--metric-track)" }}
              title={getLabel(day)}
            >
              <span
                aria-hidden
                className="block w-2 rounded-full"
                style={{ height, background: value > 0 ? color : "transparent" }}
              />
            </span>
          );
        })}
      </div>
      <WeekLabels days={days} />
    </div>
  );
}

function DualMarkerBars({
  days,
  planned,
  done,
  color,
}: {
  days: DayStats[];
  planned: number[];
  done: number[];
  color: string;
}) {
  const maxValue = Math.max(...planned, ...done, 1);

  return (
    <div>
      <div className="flex h-14 items-end justify-between gap-[10px]">
        {days.map((day, index) => {
          const plannedBottom = Math.max(0, (planned[index] / maxValue) * 38);
          const doneBottom = Math.max(0, (done[index] / maxValue) * 38);

          return (
            <span
              key={day.date}
              className="relative block h-14 w-[6px] rounded-full"
              style={{ background: "var(--metric-track)" }}
              title={`${day.fullLabel}: ${done[index]}/${planned[index]} tarefas`}
            >
              {planned[index] > 0 && (
                <span
                  aria-hidden
                  className="absolute block h-[18px] w-[6px] rounded-full"
                  style={{
                    bottom: plannedBottom,
                    background: `color-mix(in oklab, ${color} 28%, transparent)`,
                  }}
                />
              )}
              {done[index] > 0 && (
                <span
                  aria-hidden
                  className="absolute block h-[18px] w-[6px] rounded-full"
                  style={{ bottom: doneBottom, background: color }}
                />
              )}
            </span>
          );
        })}
      </div>
      <WeekLabels days={days} />
    </div>
  );
}

function TrendLineChart({
  days,
  values,
  color,
  getLabel,
}: {
  days: DayStats[];
  values: number[];
  color: string;
  getLabel: (day: DayStats) => string;
}) {
  const width = 132;
  const height = 64;
  const maxValue = Math.max(...values, 1);
  const points = values.map((value, index) => {
    const x = (index / Math.max(1, values.length - 1)) * width;
    const y = height - (value / maxValue) * 48 - 8;
    return { x, y, value };
  });
  const line = points.map((point) => `${point.x},${point.y}`).join(" ");
  const area = `0,${height} ${line} ${width},${height}`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-16 w-[132px]"
        role="img"
        aria-label={values.some(Boolean) ? "Tendência semanal de foco" : "Sem dados nesta semana"}
      >
        <defs>
          <linearGradient id="focus-trend-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        {values.some(Boolean) && (
          <>
            <polygon points={area} fill="url(#focus-trend-fill)" />
            <polyline
              points={line}
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {points.map((point, index) => (
              <circle key={days[index].date} cx={point.x} cy={point.y} r="2.5" fill={color}>
                <title>{getLabel(days[index])}</title>
              </circle>
            ))}
          </>
        )}
      </svg>
      <WeekLabels days={days} />
    </div>
  );
}

function DailyRings({ days, color }: { days: DayStats[]; color: string }) {
  return (
    <div>
      <div className="flex h-14 items-center justify-between gap-[10px]">
        {days.map((day) => (
          <span key={day.date} className="flex flex-col items-center gap-1">
            <span
              className="flex h-[14px] items-center justify-center text-[14px] leading-none"
              style={{ color: day.active ? color : "var(--label-secondary)" }}
              aria-hidden
            >
              {day.active ? "✓" : "·"}
            </span>
            <svg
              viewBox="0 0 24 24"
              className="h-6 w-6 -rotate-90"
              role="img"
              aria-label={`${day.fullLabel}: ${day.active ? "ritmo mantido" : "sem progresso registrado"}`}
            >
              <circle
                cx="12"
                cy="12"
                r="8.5"
                fill="none"
                stroke="var(--metric-track)"
                strokeWidth="3"
              />
              {day.active && (
                <circle
                  cx="12"
                  cy="12"
                  r="8.5"
                  fill="none"
                  stroke={color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray="53.41 53.41"
                />
              )}
            </svg>
          </span>
        ))}
      </div>
      <WeekLabels days={days} />
    </div>
  );
}

function DotMatrix({ days }: { days: DayStats[] }) {
  const maxRows = Math.min(Math.max(...days.map((day) => day.habitDots.length), 0), 3);
  const rowIndexes = Array.from({ length: maxRows || 1 }, (_, index) => index);

  return (
    <div>
      <div className="flex h-14 items-center justify-between gap-3">
        {days.map((day) => (
          <span
            key={day.date}
            className="grid gap-[10px]"
            title={`${day.fullLabel}: ${day.habitsDone}/${day.habitsTotal} hábitos`}
          >
            {rowIndexes.map((habitIndex) => (
              <span
                key={habitIndex}
                aria-hidden
                className="h-[10px] w-[10px] rounded-full"
                style={{
                  background: day.habitDots[habitIndex]
                    ? "var(--metric-habits)"
                    : "var(--metric-track)",
                }}
              />
            ))}
          </span>
        ))}
      </div>
      <WeekLabels days={days} />
    </div>
  );
}

function SegmentedBars({ days, color }: { days: DayStats[]; color: string }) {
  return (
    <div>
      <div className="flex h-14 items-end justify-between gap-[10px]">
        {days.map((day) => {
          const activeSegments = Math.min(day.focusSessionsDone, 3);

          return (
            <span
              key={day.date}
              className="grid h-14 w-[10px] content-end gap-0.5"
              title={`${day.fullLabel}: ${day.focusSessionsDone} sessões concluídas`}
            >
              {[2, 1, 0].map((segment) => (
                <span
                  key={segment}
                  aria-hidden
                  className="h-[17px] w-[10px] rounded-full"
                  style={{
                    background:
                      activeSegments > segment
                        ? `color-mix(in oklab, ${color} ${35 + (2 - segment) * 30}%, transparent)`
                        : "var(--metric-track)",
                  }}
                />
              ))}
            </span>
          );
        })}
      </div>
      <WeekLabels days={days} />
    </div>
  );
}

function WeekLabels({ days }: { days: DayStats[] }) {
  return (
    <div className="mt-2 flex justify-between gap-[10px]">
      {days.map((day) => (
        <span
          key={day.date}
          className="a-caption block w-[10px] text-center uppercase"
          style={{ color: day.isToday ? "var(--accent-text)" : "var(--label-secondary)" }}
        >
          {day.label}
        </span>
      ))}
    </div>
  );
}

function getTaskCaption(done: number, total: number): string {
  if (total === 0) return "Sem dados nesta semana";
  const ratio = done / total;
  if (ratio >= 0.75) return "Ritmo bom";
  if (ratio >= 0.4) return "Em andamento";
  return "Atenção amanhã";
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
}

function formatDays(days: number): string {
  return `${days} ${days === 1 ? "dia" : "dias"}`;
}

/**
 * Pedras da semana: a tarefa única que mais move cada meta ativa. Comprometer
 * uma pedra cria a tarefa grande do dia escolhido, já ligada à meta — ela fica
 * pinada no topo do slot Grande do funil.
 */
function RocksSection({ weekStart }: { weekStart: string }) {
  const { state } = usePlanner();
  const goals = getCurrentQuarterGoals(state);
  const rocks = getWeekRocks(state, weekStart);

  if (goals.length === 0) {
    return (
      <Card className="mb-6 p-5">
        <p className="a-subheadline text-label-secondary">
          Sem metas ativas neste trimestre. Defina até 3 em Objetivos para planejar
          a pedra da semana de cada uma.
        </p>
      </Card>
    );
  }

  return (
    <section className="mb-6 space-y-3">
      <div className="flex items-center gap-2">
        <Target size={18} style={{ color: "var(--accent)" }} />
        <h2 className="a-headline text-label">Pedras da semana</h2>
      </div>
      <p className="a-caption -mt-1 mb-1 text-label-secondary">
        Uma pedra por meta: a única coisa que, se feita, move mais a meta esta semana.
      </p>
      {goals.map((goal) => {
        const rock = rocks.find((r) => r.goalId === goal.id);
        return (
          <RockRow
            key={goal.id}
            goal={goal}
            rock={rock}
            weekStart={weekStart}
          />
        );
      })}
    </section>
  );
}

function RockRow({
  goal,
  rock,
  weekStart,
}: {
  goal: { id: string; title: string };
  rock: WeekRock | undefined;
  weekStart: string;
}) {
  const { state, dispatch } = usePlanner();
  const dates = weekDates(weekStart);
  const [text, setText] = useState("");
  const [day, setDay] = useState(todayISO());
  const task = rock?.taskId ? state.tasks.find((t) => t.id === rock.taskId) : undefined;

  const commit = () => {
    if (!text.trim()) return;
    const id = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    dispatch({
      type: "ADD_TASK",
      id,
      title: text.trim(),
      category: "big",
      date: day,
      goalId: goal.id,
    });
    dispatch({
      type: "ADD_WEEK_ROCK",
      goalId: goal.id,
      weekStart,
      text: text.trim(),
      taskId: id,
    });
    setText("");
  };

  if (rock) {
    return (
      <Card className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="a-caption text-accent">{goal.title}</p>
            <p className="a-body text-label">{task?.title ?? rock.text}</p>
            {task && (
              <p className="a-caption mt-1 text-label-secondary">
                {task.status === "done" ? "✓ Concluída" : "Pendente"}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              dispatch({ type: "REMOVE_WEEK_ROCK", id: rock.id });
              if (task) dispatch({ type: "REMOVE_TASK", id: task.id });
            }}
            aria-label="Remover pedra"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-label-secondary transition-colors hover-text-danger"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <p className="a-caption mb-2 text-accent">{goal.title}</p>
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && commit()}
          placeholder="A única coisa que mais move essa meta..."
          className="a-body min-h-[44px] min-w-0 flex-1 rounded-xl bg-fill-subtle px-3"
        />
        <button
          type="button"
          onClick={commit}
          disabled={!text.trim()}
          className="a-subheadline shrink-0 rounded-xl px-4 text-accent disabled:opacity-30"
        >
          Comprometer
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {dates.map((date) => {
          const selected = day === date;
          return (
            <button
              key={date}
              type="button"
              aria-pressed={selected}
              onClick={() => setDay(date)}
              className="a-caption min-h-[36px] rounded-full border px-3"
              style={{
                borderColor: selected
                  ? "color-mix(in oklab, var(--accent) 42%, transparent)"
                  : "var(--separator)",
                color: selected ? "var(--label)" : "var(--label-secondary)",
              }}
            >
              {date === todayISO()
                ? "Hoje"
                : WEEKDAY_FULL_LABEL[new Date(`${date}T12:00:00`).getDay()]}
            </button>
          );
        })}
      </div>
    </Card>
  );
}

/**
 * Fechamento do ciclo semanal. A partir de quinta (ou com a semana anterior
 * aberta), a Semana propõe a rodada de Revisão. Sem pedra comprometida,
 * não há rodada a fechar — o usuário pode pular e o banner some.
 */
function WeekCloseCard({ today }: { today: string }) {
  const { state, dispatch } = usePlanner();
  const weekStart = mondayOf(today);
  const dates = weekDates(weekStart);
  const dayIndex = dates.indexOf(today);
  const currentRocks = getWeekRocks(state, weekStart).filter((r) => r.committed);
  const currentReviewed = state.weekLogs.some((w) => w.weekStart === weekStart);

  const lastWeekDate = new Date(`${today}T12:00:00`);
  lastWeekDate.setDate(lastWeekDate.getDate() - 7);
  const lastWeekStart = mondayOf(
    `${lastWeekDate.getFullYear()}-${String(lastWeekDate.getMonth() + 1).padStart(2, "0")}-${String(lastWeekDate.getDate()).padStart(2, "0")}`
  );
  const lastRocks = getWeekRocks(state, lastWeekStart).filter((r) => r.committed);
  const lastReviewed = state.weekLogs.some((w) => w.weekStart === lastWeekStart);

  const doneOf = (rocks: WeekRock[]) =>
    rocks.filter(
      (r) => r.taskId && state.tasks.find((t) => t.id === r.taskId)?.status === "done"
    ).length;

  let variant: { kind: "current" | "lastweek"; weekStart: string; rocks: WeekRock[] } | null =
    null;
  if (dayIndex >= 4 && !currentReviewed) {
    variant = { kind: "current", weekStart, rocks: currentRocks };
  } else if (lastRocks.length > 0 && !lastReviewed) {
    variant = { kind: "lastweek", weekStart: lastWeekStart, rocks: lastRocks };
  }
  if (!variant) return null;

  const done = doneOf(variant.rocks);
  const hasRocks = variant.rocks.length > 0;

  const summary = hasRocks
    ? variant.kind === "current"
      ? `${done} de ${variant.rocks.length} ${variant.rocks.length === 1 ? "pedra concluída" : "pedras concluídas"} esta semana. A Revisão decide o destino de cada meta.`
      : `${done} de ${variant.rocks.length} ${variant.rocks.length === 1 ? "pedra concluída" : "pedras concluídas"} na semana passada, sem revisão registrada.`
    : "Nenhuma pedra comprometida esta semana — não há rodada de revisão a fazer.";

  return (
    <Card className="mb-6 p-5">
      <div className="flex items-start gap-3">
        <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <h2 className="a-headline text-label">
            {variant.kind === "current" ? "Encerrar a semana" : "Revisão da semana passada"}
          </h2>
          <p className="a-caption mt-1 text-label-secondary">{summary}</p>
        </div>
      </div>
      <div className="mt-4">
        {hasRocks ? (
          <Link href="/revisao" className="a-btn a-btn-primary flex min-h-[44px] w-full items-center justify-center">
            Ir para Revisão
          </Link>
        ) : (
          <button
            type="button"
            onClick={() =>
              dispatch({ type: "COMPLETE_WEEK_REVIEW", weekStart: variant.weekStart, decisions: [] })
            }
            className="a-btn a-btn-secondary min-h-[44px] w-full"
          >
            Pular revisão
          </button>
        )}
      </div>
    </Card>
  );
}
