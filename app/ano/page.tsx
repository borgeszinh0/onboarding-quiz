"use client";

import { useState } from "react";
import { usePlanner } from "@/lib/planner-store";
import { QUARTERS, QUARTER_LABEL } from "@/lib/planner-data";
import type { Quarter } from "@/lib/planner-types";
import { Card, PageTitle } from "@/components/apple/ui";

/**
 * Mural de foco anual: 4 trimestres, 1-2 frases cada. Só consulta — não
 * interage com o calendário nem com as tarefas do dia.
 */
export default function AnoPage() {
  const { hydrated } = usePlanner();
  const [year, setYear] = useState(() => new Date().getFullYear());

  if (!hydrated) {
    return <main className="mx-auto w-full max-w-xl px-5 py-12" aria-busy="true" />;
  }

  return (
    <main className="mx-auto w-full max-w-xl px-5 pb-20 pt-8">
      <div className="mb-8 flex items-start justify-between">
        <PageTitle eyebrow="Ano" title={String(year)} />
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setYear((y) => y - 1)}
            aria-label="Ano anterior"
            className="flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--label-secondary)] transition-colors hover:bg-[color:var(--fill-subtle)]"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => setYear((y) => y + 1)}
            aria-label="Próximo ano"
            className="flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--label-secondary)] transition-colors hover:bg-[color:var(--fill-subtle)]"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {QUARTERS.map((quarter) => (
          <QuarterCard key={quarter} year={year} quarter={quarter} />
        ))}
      </div>
    </main>
  );
}

function QuarterCard({ year, quarter }: { year: number; quarter: Quarter }) {
  const { state, dispatch } = usePlanner();
  const text = state.yearFocus[year]?.[quarter] ?? "";

  return (
    <Card className="p-5">
      <h2 className="text-[15px] font-semibold">{quarter}</h2>
      <p className="mb-3 text-[13px] text-[color:var(--label-secondary)]">
        {QUARTER_LABEL[quarter]}
      </p>
      <textarea
        value={text}
        onChange={(e) => dispatch({ type: "SET_YEAR_FOCUS", year, quarter, text: e.target.value })}
        placeholder="Uma ou duas frases de foco para este trimestre."
        rows={3}
        className="w-full resize-none rounded-xl bg-[color:var(--fill-subtle)] px-3 py-2.5 text-[15px] leading-snug"
      />
    </Card>
  );
}
