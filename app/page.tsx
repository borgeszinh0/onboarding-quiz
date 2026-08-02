"use client";

import { useState } from "react";
import Link from "next/link";
import { todayISO } from "@/lib/planner-store";
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
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const [view, setView] = useState<"funnel" | "schedule">("funnel");
  const date = todayISO();

  return (
    <>
      <main className="page-shell page-with-dock mx-auto w-full max-w-xl px-5">
        <header className="mb-6">
          <p className="a-subheadline text-label-secondary" suppressHydrationWarning>
            {WEEKDAYS[new Date().getDay()]}
          </p>
          <h1 className="a-large-title mt-1" suppressHydrationWarning>
            {greeting(new Date().getHours())}
          </h1>
          <DailyProgress date={date} />
        </header>

        <DailyPlanning date={date} />

        <DailySummary date={date} />

        <div className="liquid-segment mt-6 flex rounded-full p-1 backdrop-blur-[20px] backdrop-brightness-[1.01] backdrop-saturate-[170%] backdrop-contrast-[1.08]">
          <button
            type="button"
            onClick={() => setView("funnel")}
            className={`a-subheadline min-h-[44px] flex-1 rounded-full font-medium transition-colors duration-200 ${
              view === "funnel" ? "liquid-segment-active" : ""
            }`}
            style={
              view === "funnel"
                ? { color: "var(--label)" }
                : { color: "var(--label-secondary)" }
            }
          >
            Funil
          </button>
          <button
            type="button"
            onClick={() => setView("schedule")}
            className={`a-subheadline min-h-[44px] flex-1 rounded-full font-medium transition-colors duration-200 ${
              view === "schedule" ? "liquid-segment-active" : ""
            }`}
            style={
              view === "schedule"
                ? { color: "var(--label)" }
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

        <nav className="mt-14">
          <Link href="/inbox" className="a-btn a-btn-secondary backdrop-blur-[18px] backdrop-brightness-[1.01] backdrop-saturate-[165%] backdrop-contrast-[1.08]">
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
