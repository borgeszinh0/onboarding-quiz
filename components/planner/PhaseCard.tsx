"use client";

import { getQuarterInfo } from "@/lib/planner-store";
import { Card } from "@/components/apple/ui";

const PHASE_TITLE = {
  estabelecer: "Estabelecer",
  consolidar: "Consolidar",
  execucao: "Execução",
} as const;

const PHASE_DESC = {
  estabelecer: "Semanas 1–3: crie a base e proteja o hábito do que importa.",
  consolidar: "Semanas 4–7: transforme o plano em ritmo e ajuste o que não sobreviveu.",
  execucao: "Semanas 8–13: execute com o plano consolidado e feche o trimestre.",
} as const;

export function PhaseCard() {
  const { quarter, weekOfQuarter, totalWeeks, phase } = getQuarterInfo();

  return (
    <Card className="mb-4 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="a-caption" style={{ color: "var(--accent)" }} suppressHydrationWarning>
            Fase do trimestre {quarter} · sem. {weekOfQuarter}/{totalWeeks}
          </p>
          <p className="a-subheadline mt-0.5 text-label">{PHASE_TITLE[phase]}</p>
          <p className="a-caption mt-0.5 text-label-secondary">{PHASE_DESC[phase]}</p>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--metric-track)]">
        <div
          className="h-full rounded-full"
          style={{
            width: `${Math.round((Math.min(weekOfQuarter, totalWeeks) / totalWeeks) * 100)}%`,
            background: "var(--accent-2)",
          }}
        />
      </div>
    </Card>
  );
}