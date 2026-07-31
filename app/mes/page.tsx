"use client";

import { useState } from "react";
import {
  usePlanner,
  todayISO,
  dayCompletion,
  isPerfectDay,
} from "@/lib/planner-store";
import { Card, PageTitle } from "@/components/apple/ui";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** Grade mensal. Dias com todos os hábitos cumpridos ganham destaque — o streak visual. */
export default function MesPage() {
  const { state, hydrated } = usePlanner();
  const today = new Date();
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  if (!hydrated) {
    return <main className="mx-auto w-full max-w-xl px-5 py-12" aria-busy="true" />;
  }

  const startOffset = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const todayISOValue = todayISO();

  const changeMonth = (delta: number) => {
    const d = new Date(viewYear, viewMonth + delta, 1);
    setViewMonth(d.getMonth());
    setViewYear(d.getFullYear());
  };

  const monthDates = Array.from({ length: daysInMonth }, (_, i) =>
    `${viewYear}-${pad(viewMonth + 1)}-${pad(i + 1)}`
  );
  const perfectCount = monthDates.filter((d) => isPerfectDay(state, d)).length;

  return (
    <main className="mx-auto w-full max-w-xl px-5 pb-20 pt-8">
      <PageTitle eyebrow="Mês" title="Streaks" />

      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Mês anterior"
            className="flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--label-secondary)] transition-colors hover:bg-[color:var(--fill-subtle)]"
          >
            ‹
          </button>
          <span className="text-[17px] font-medium">
            {MONTHS[viewMonth]} {viewYear}
          </span>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Próximo mês"
            className="flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--label-secondary)] transition-colors hover:bg-[color:var(--fill-subtle)]"
          >
            ›
          </button>
        </div>

        <div className="mb-1 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d, i) => (
            <div
              key={i}
              aria-hidden
              className="pb-1 text-center text-[11px] font-medium text-[color:var(--label-secondary)]"
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startOffset }, (_, i) => (
            <div key={`pad-${i}`} />
          ))}
          {monthDates.map((dateStr, i) => {
            const day = i + 1;
            const isToday = dateStr === todayISOValue;
            const perfect = isPerfectDay(state, dateStr);
            const { total } = dayCompletion(state, dateStr);

            return (
              <div
                key={dateStr}
                title={perfect ? "Todos os hábitos cumpridos" : undefined}
                className="relative flex aspect-square flex-col items-center justify-center rounded-xl text-[15px]"
                style={
                  perfect
                    ? { background: "var(--color-energia)", color: "#fff", fontWeight: 600 }
                    : isToday
                      ? { color: "var(--accent-text)", fontWeight: 600 }
                      : undefined
                }
              >
                <span>{day}</span>
                {total > 0 && !perfect && (
                  <span
                    aria-hidden
                    className="absolute bottom-1.5 h-1 w-1 rounded-full"
                    style={{ background: "var(--label-secondary)" }}
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      <p className="mt-4 text-[13px] text-[color:var(--label-secondary)]">
        {perfectCount} {perfectCount === 1 ? "dia perfeito" : "dias perfeitos"} em{" "}
        {MONTHS[viewMonth].toLowerCase()}.
      </p>
    </main>
  );
}
