"use client";

import { usePlanner, getTasksForSlot } from "@/lib/planner-store";
import { Card, SectionLabel } from "@/components/apple/ui";

export function DailySummary({ date }: { date: string }) {
  const { state } = usePlanner();

  const big = getTasksForSlot(state, date, "big").length;
  const medium = getTasksForSlot(state, date, "medium").length;
  const small = getTasksForSlot(state, date, "small").length;

  return (
    <section>
      <SectionLabel>Plano de hoje</SectionLabel>
      <Card className="mt-3 flex items-center justify-around p-4">
        <div className="flex flex-col items-center gap-0.5">
          <span className="a-title-2" style={{ color: "var(--danger-text)" }}>{big}</span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--label-secondary)]">Grande</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="a-title-2" style={{ color: "var(--attention-text)" }}>{medium}</span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--label-secondary)]">Médias</span>
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="a-title-2" style={{ color: "var(--accent-text)" }}>{small}</span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-[color:var(--label-secondary)]">Pequenas</span>
        </div>
      </Card>
    </section>
  );
}
