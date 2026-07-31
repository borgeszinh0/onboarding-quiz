"use client";

import { useState } from "react";
import { usePlanner } from "@/lib/planner-store";
import { Card } from "@/components/apple/ui";

export function DailyPlanning({ date }: { date: string }) {
  const { state, dispatch } = usePlanner();
  const [intention, setIntention] = useState("");
  const [energy, setEnergy] = useState<"low" | "medium" | "high" | undefined>();

  const dayLog = state.dayLogs.find((l) => l.date === date);
  const isPlanned = !!dayLog?.plannedAt;

  if (isPlanned) {
    if (!dayLog.intention) return null;
    return (
      <section className="mb-6">
        <p className="a-subheadline text-[color:var(--label-secondary)]">Intenção do dia</p>
        <p className="a-body mt-1 text-[color:var(--label)]">“{dayLog.intention}”</p>
      </section>
    );
  }

  const handlePlan = () => {
    dispatch({ type: "PLAN_DAY", date, payload: { intention, energy } });
  };

  const handleSkip = () => {
    dispatch({ type: "PLAN_DAY", date, payload: {} });
  };

  return (
    <section className="mb-6">
      <Card className="p-5">
        <h2 className="a-headline mb-4 text-[color:var(--label)]">Planejar hoje</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="intention" className="a-subheadline mb-1.5 block text-[color:var(--label-secondary)]">Qual a intenção principal?</label>
            <input
              id="intention"
              type="text"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="Ex: Focar apenas no lançamento"
              className="a-body w-full rounded-xl bg-[color:var(--fill-subtle)] px-4 py-3"
            />
          </div>
          <div>
            <span className="a-subheadline mb-1.5 block text-[color:var(--label-secondary)]">Nível de energia</span>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as const).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setEnergy(level)}
                  className="a-body flex-1 rounded-lg py-2 transition-colors duration-200"
                  style={{
                    backgroundColor: energy === level ? "var(--color-accent)" : "var(--fill-subtle)",
                    color: energy === level ? "#fff" : "var(--label)",
                  }}
                >
                  {level === "low" ? "Baixa" : level === "medium" ? "Média" : "Alta"}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={handlePlan}
              className="a-btn a-btn-primary w-full min-h-[50px]"
            >
              Começar o dia
            </button>
            <button
              type="button"
              onClick={handleSkip}
              className="a-btn a-btn-secondary w-full"
            >
              Pular
            </button>
          </div>
        </div>
      </Card>
    </section>
  );
}
