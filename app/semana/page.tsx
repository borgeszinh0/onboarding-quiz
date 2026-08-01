"use client";

import { useState, useEffect } from "react";

import {
  usePlanner,
  weekDates,
  todayISO,
  dayCompletion,
  occupiedMinutes,
  isPerfectDay,
} from "@/lib/planner-store";
import { SCHEDULE_END_HOUR, SCHEDULE_START_HOUR } from "@/lib/planner-data";
import { Card, PageTitle } from "@/components/apple/ui";

const WEEKDAY_LABEL = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
const RULER_MINUTES = (SCHEDULE_END_HOUR - SCHEDULE_START_HOUR) * 60;
const BAR_HEIGHT = 96;

export default function SemanaPage() {
  const { state, hydrated } = usePlanner();

  const today = todayISO();
  const dates = weekDates(today);
  const perfectDays = dates.filter((d) => isPerfectDay(state, d)).length;

  return (
    <main className="mx-auto w-full max-w-xl px-5 pb-32 pt-8">
      <PageTitle
        eyebrow="Semana"
        title="Ocupação"
        subtitle="Quanto do dia foi para bloco protegido, e quantas tarefas do funil fecharam."
      />

      <Card className="p-5">
        <div className="flex items-end justify-between gap-1.5">
          {dates.map((date, i) => {
            const minutes = occupiedMinutes(state, date);
            const fill = Math.min(1, minutes / RULER_MINUTES);
            const { done, total } = dayCompletion(state, date);
            const isToday = date === today;
            const perfect = isPerfectDay(state, date);

            return (
              <div key={date} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="flex w-full items-end justify-center rounded-lg"
                  style={{ height: BAR_HEIGHT, background: "var(--fill-subtle)" }}
                  title={`${minutes} min agendados`}
                >
                  <div
                    className="w-full rounded-lg transition-[height] duration-500"
                    style={{
                      height: fill * BAR_HEIGHT,
                      background: isToday
                        ? "var(--color-accent)"
                        : "color-mix(in oklab, var(--color-accent) 60%, var(--label-secondary))",
                      transitionTimingFunction: "var(--ease-standard)",
                    }}
                  />
                </div>
                <span
                  className="a-caption uppercase"
                  style={{ color: isToday ? "var(--accent-text)" : "var(--label-secondary)" }}
                >
                  {WEEKDAY_LABEL[i]}
                </span>
                <span className="a-caption tabular">
                  {total > 0 ? `${done}/${total}` : "—"}
                </span>
                <span
                  aria-hidden
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: perfect ? "var(--success-fill)" : "transparent" }}
                />
              </div>
            );
          })}
        </div>
      </Card>

      <p className="a-caption mt-4 text-[color:var(--label-secondary)]">
        {perfectDays} de 7 dias com todos os hábitos cumpridos.
      </p>
    </main>
  );
}
