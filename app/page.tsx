"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePlanner, todayISO } from "@/lib/planner-store";
import { DailyFunnel } from "@/components/planner/DailyFunnel";
import { DailySummary } from "@/components/planner/DailySummary";
import { DailyProgress } from "@/components/planner/DailyProgress";
import { DailyPlanning } from "@/components/planner/DailyPlanning";
import { DailyShutdown } from "@/components/planner/DailyShutdown";
import { ScheduleRuler } from "@/components/planner/ScheduleRuler";

import { FocusMode } from "@/components/planner/FocusMode";

const WEEKDAYS = [
  "domingo",
  "segunda",
  "terça",
  "quarta",
  "quinta",
  "sexta",
  "sábado",
];

function greeting(hour: number): string {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

export default function Home() {
  const { hydrated } = usePlanner();
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const [view, setView] = useState<"funnel" | "schedule">("funnel");
  const date = todayISO();

  return (
    <>
      <main className="mx-auto w-full max-w-xl px-5 pb-32 pt-8">
        <header className="mb-6">
          <p className="a-subheadline text-[color:var(--label-secondary)]" suppressHydrationWarning>
            {WEEKDAYS[new Date().getDay()]}
          </p>
          <h1 className="a-large-title mt-1" suppressHydrationWarning>
            {greeting(new Date().getHours())}
          </h1>
          <DailyProgress date={date} />
        </header>

        <DailyPlanning date={date} />

        <DailySummary date={date} />

        <div className="mt-6 flex rounded-xl bg-[color:var(--fill-subtle)] p-1">
          <button
            type="button"
            onClick={() => setView("funnel")}
            className="a-subheadline flex-1 rounded-lg py-1.5 font-medium transition-colors duration-200"
            style={
              view === "funnel"
                ? { background: "var(--bg)", color: "var(--label)", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }
                : { color: "var(--label-secondary)" }
            }
          >
            Funil
          </button>
          <button
            type="button"
            onClick={() => setView("schedule")}
            className="a-subheadline flex-1 rounded-lg py-1.5 font-medium transition-colors duration-200"
            style={
              view === "schedule"
                ? { background: "var(--bg)", color: "var(--label)", boxShadow: "0 1px 3px rgba(0,0,0,0.12)" }
                : { color: "var(--label-secondary)" }
            }
          >
            Agenda
          </button>
        </div>

        <div className="mt-6">
          {view === "funnel" ? (
            <DailyFunnel date={date} onFocus={setFocusTaskId} />
          ) : (
            <ScheduleRuler date={date} onFocus={setFocusTaskId} />
          )}
        </div>

        <DailyShutdown date={date} />

        <nav className="mt-8">
          <Link href="/inbox" className="a-btn a-btn-secondary">
            Ver Inbox
          </Link>
        </nav>
      </main>

      {focusTaskId && (
        <FocusMode taskId={focusTaskId} onClose={() => setFocusTaskId(null)} />
      )}
    </>
  );
}
