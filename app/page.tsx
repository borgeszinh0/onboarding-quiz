"use client";

import { useState } from "react";
import Link from "next/link";
import { usePlanner, todayISO } from "@/lib/planner-store";
import { DailyFunnel } from "@/components/planner/DailyFunnel";
import { DailySummary } from "@/components/planner/DailySummary";
import { DailyProgress } from "@/components/planner/DailyProgress";
import { DailyPlanning } from "@/components/planner/DailyPlanning";
import { DailyShutdown } from "@/components/planner/DailyShutdown";
import { ScheduleRuler } from "@/components/planner/ScheduleRuler";
import { HabitBar } from "@/components/planner/HabitBar";
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
  const now = new Date();

  // Antes de hidratar não dá pra saber o que já foi planejado. Mostrar o
  // funil vazio aqui faria a tela piscar para quem já usa o app.
  if (!hydrated) {
    return <main className="mx-auto w-full max-w-xl px-5 py-12" aria-busy="true" />;
  }

  const date = todayISO();

  return (
    <>
      <main className="mx-auto w-full max-w-xl px-5 pb-44 pt-8 sm:pb-28">
        <header className="mb-6">
          <p className="a-subheadline text-[color:var(--label-secondary)]">
            {WEEKDAYS[now.getDay()]}
          </p>
          <h1 className="a-large-title mt-1">
            {greeting(now.getHours())}
          </h1>
          <DailyProgress date={date} />
        </header>

        <DailyPlanning date={date} />

        <DailySummary date={date} />

        <div className="mt-6">
          <ScheduleRuler date={date} onFocus={setFocusTaskId} />
        </div>

        <div className="mt-8">
          <DailyFunnel date={date} onFocus={setFocusTaskId} />
        </div>

        <DailyShutdown date={date} />

        <nav className="mt-8">
          <Link href="/inbox" className="a-btn a-btn-secondary">
            Ver Inbox
          </Link>
        </nav>
      </main>
      <HabitBar date={date} />

      {focusTaskId && (
        <FocusMode taskId={focusTaskId} onClose={() => setFocusTaskId(null)} />
      )}
    </>
  );
}
