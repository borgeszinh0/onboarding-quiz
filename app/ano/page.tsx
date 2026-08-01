"use client";

import { useState } from "react";
import { usePlanner, minutesBetween } from "@/lib/planner-store";
import {
  CATEGORY_LABEL,
  CATEGORY_ORDER,
  QUARTER_LABEL,
  QUARTERS,
} from "@/lib/planner-data";
import type { Quarter, TaskCategory } from "@/lib/planner-types";
import { Card, PageTitle } from "@/components/apple/ui";

type FunnelCategory = Exclude<TaskCategory, "inbox">;

interface QuarterStats {
  quarter: Quarter;
  total: number;
  done: number;
  pending: number;
  focusMinutes: number;
  byCategory: Record<FunnelCategory, number>;
}

export default function AnoPage() {
  const { state, hydrated } = usePlanner();
  const [year, setYear] = useState(() => new Date().getFullYear());

  if (!hydrated) {
    return <main className="mx-auto w-full max-w-xl px-5 py-12" aria-busy="true" />;
  }

  const quarterStats = QUARTERS.map((quarter) =>
    getQuarterStats({
      quarter,
      year,
      tasks: state.tasks,
      timeBlocks: state.timeBlocks,
    })
  );
  const annualTotal = quarterStats.reduce((sum, stats) => sum + stats.total, 0);
  const annualDone = quarterStats.reduce((sum, stats) => sum + stats.done, 0);
  const annualFocusMinutes = quarterStats.reduce(
    (sum, stats) => sum + stats.focusMinutes,
    0
  );
  const completion = annualTotal > 0 ? Math.round((annualDone / annualTotal) * 100) : 0;

  return (
    <main className="page-with-bottom-dock mx-auto w-full max-w-xl px-5 pt-8">
      <div className="mb-8 flex items-start justify-between">
        <PageTitle
          eyebrow="Visão Anual"
          title={String(year)}
          subtitle="Quantidade de tarefas e foco agendado por trimestre."
        />
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setYear((y) => y - 1)}
            aria-label="Ano anterior"
            className="flex h-11 w-11 items-center justify-center rounded-full text-label-secondary transition-colors hover-bg-fill-subtle"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setYear((y) => y + 1)}
            aria-label="Próximo ano"
            className="flex h-11 w-11 items-center justify-center rounded-full text-label-secondary transition-colors hover-bg-fill-subtle"
          >
            ›
          </button>
        </div>
      </div>

      <Card className="mb-4 p-5">
        <div className="grid grid-cols-3 gap-3 text-center">
          <Metric label="tarefas" value={String(annualTotal)} />
          <Metric label="concluídas" value={`${completion}%`} />
          <Metric label="foco" value={formatMinutes(annualFocusMinutes)} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4">
        {quarterStats.map((stats) => (
          <QuarterCard key={stats.quarter} stats={stats} maxTotal={annualTotal} />
        ))}
      </div>
    </main>
  );
}

function QuarterCard({
  stats,
  maxTotal,
}: {
  stats: QuarterStats;
  maxTotal: number;
}) {
  const donePercent = stats.total > 0 ? Math.round((stats.done / stats.total) * 100) : 0;
  const relativeWidth = maxTotal > 0 ? Math.max(8, (stats.total / maxTotal) * 100) : 0;

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="a-headline text-label">{stats.quarter}</h2>
          <p className="a-caption text-label-secondary">{QUARTER_LABEL[stats.quarter]}</p>
        </div>
        <div className="text-right">
          <p className="a-title-3 tabular text-label">{stats.total}</p>
          <p className="a-caption text-label-secondary">tarefas</p>
        </div>
      </div>

      <div
        aria-label={`${stats.total} tarefas no ${stats.quarter}`}
        className="mb-4 h-2 overflow-hidden rounded-full bg-fill-subtle"
      >
        <div
          className="h-full rounded-full bg-gemini"
          style={{ width: `${relativeWidth}%` }}
        />
      </div>

      <div className="mb-4 grid grid-cols-3 gap-2">
        <Metric label="concluídas" value={String(stats.done)} />
        <Metric label="pendentes" value={String(stats.pending)} />
        <Metric label="foco" value={formatMinutes(stats.focusMinutes)} />
      </div>

      <div className="space-y-2">
        {CATEGORY_ORDER.map((category) => (
          <CategoryRow
            key={category}
            label={CATEGORY_LABEL[category]}
            count={stats.byCategory[category]}
            total={stats.total}
          />
        ))}
      </div>

      <p className="a-caption mt-4 text-label-secondary">
        {stats.total > 0
          ? `${donePercent}% das tarefas planejadas neste trimestre foram concluídas.`
          : "Nenhuma tarefa planejada neste trimestre ainda."}
      </p>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-fill-subtle px-2 py-3">
      <p className="a-headline tabular text-label">{value}</p>
      <p className="a-caption truncate uppercase text-label-secondary">{label}</p>
    </div>
  );
}

function CategoryRow({
  label,
  count,
  total,
}: {
  label: string;
  count: number;
  total: number;
}) {
  const width = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="grid grid-cols-[72px_1fr_32px] items-center gap-3">
      <span className="a-caption text-label-secondary">{label}</span>
      <span className="h-2 overflow-hidden rounded-full bg-fill-subtle">
        <span
          className="block h-full rounded-full bg-label-secondary"
          style={{ width: `${width}%` }}
        />
      </span>
      <span className="a-caption tabular text-right text-label">{count}</span>
    </div>
  );
}

function getQuarterStats({
  quarter,
  year,
  tasks,
  timeBlocks,
}: {
  quarter: Quarter;
  year: number;
  tasks: ReturnType<typeof usePlanner>["state"]["tasks"];
  timeBlocks: ReturnType<typeof usePlanner>["state"]["timeBlocks"];
}): QuarterStats {
  const quarterTasks = tasks.filter((task) => {
    if (task.category === "inbox" || !task.date) return false;
    return getYear(task.date) === year && getQuarter(task.date) === quarter;
  });
  const quarterBlocks = timeBlocks.filter(
    (block) => getYear(block.date) === year && getQuarter(block.date) === quarter
  );

  return {
    quarter,
    total: quarterTasks.length,
    done: quarterTasks.filter((task) => task.status === "done").length,
    pending: quarterTasks.filter((task) => task.status !== "done").length,
    focusMinutes: quarterBlocks.reduce(
      (sum, block) => sum + Math.max(0, minutesBetween(block.startTime, block.endTime)),
      0
    ),
    byCategory: {
      big: quarterTasks.filter((task) => task.category === "big").length,
      medium: quarterTasks.filter((task) => task.category === "medium").length,
      small: quarterTasks.filter((task) => task.category === "small").length,
    },
  };
}

function getYear(date: string): number {
  return Number(date.slice(0, 4));
}

function getQuarter(date: string): Quarter {
  const month = Number(date.slice(5, 7));
  if (month <= 3) return "Q1";
  if (month <= 6) return "Q2";
  if (month <= 9) return "Q3";
  return "Q4";
}

function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h${mins}` : `${hours}h`;
}
