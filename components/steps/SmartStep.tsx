"use client";

import { useState, useEffect } from "react";
import { useQuiz, getTopPriorityDomains } from "@/lib/store";
import { SMART_FIELDS } from "@/lib/data";
import { NavButtons, StepHeader } from "@/components/ui";
import type { SmartGoal } from "@/lib/types";

function buildGoal(g: SmartGoal): string {
  const s = g.specific.trim();
  const m = g.measurable.trim();
  const a = g.achievable.trim();
  const r = g.relevant.trim();
  const t = g.timeBound.trim();

  if (!s) return "";

  // Template: "Vou [o quê] [quanto] até [quando]. Para isso, [como]. Isso importa porque [por que]."
  let sentence = `Vou ${s}`;

  if (m) sentence += `, ${m}`;
  if (t) sentence += ` até ${t}`;
  sentence += ".";

  if (a) sentence += ` Para isso, vou ${a}.`;
  if (r) sentence += ` Isso importa porque ${r}.`;

  return sentence;
}

export default function SmartStep() {
  const { state, dispatch } = useQuiz();
  const priorities = getTopPriorityDomains(state, 3);

  const [goals, setGoals] = useState<SmartGoal[]>(
    priorities.map((p) => ({
      goal: "",
      specific: "",
      measurable: "",
      achievable: "",
      relevant: "",
      timeBound: "",
      linkedDomainId: p.domainId,
    }))
  );

  useEffect(() => {
    setGoals((prev) =>
      priorities.map((p, i) => {
        const existing = prev[i];
        return existing
          ? { ...existing, linkedDomainId: p.domainId }
          : {
              goal: "",
              specific: "",
              measurable: "",
              achievable: "",
              relevant: "",
              timeBound: "",
              linkedDomainId: p.domainId,
            };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateGoal = (idx: number, field: keyof SmartGoal, value: string) => {
    setGoals((prev) =>
      prev.map((g, i) =>
        i === idx ? { ...g, [field]: value, goal: buildGoal({ ...g, [field]: value }) } : g
      )
    );
  };

  const allFilled = goals.every(
    (g) => g.specific.trim() && g.measurable.trim() && g.timeBound.trim()
  );

  const handleNext = () => {
    const goalsWithText = goals.map((g) => ({ ...g, goal: buildGoal(g) }));
    dispatch({ type: "SET_GOALS", goals: goalsWithText });
    dispatch({ type: "SET_STEP", step: "result" });
  };

  return (
    <div className="step-enter">
      <StepHeader
        number="05"
        eyebrow="Metas SMART"
        title="Transforme gaps em metas."
        subtitle="Responda as perguntas. A meta se monta sozinha abaixo — em tempo real."
      />

      <div className="space-y-8">
        {goals.map((goal, idx) => {
          const p = priorities[idx];
          const hasPreview = goal.specific || goal.measurable || goal.achievable || goal.relevant || goal.timeBound;

          return (
            <div
              key={idx}
              className="rounded-2xl border border-[#D4C9B5] bg-white/50 p-5 sm:p-6"
            >
              <div className="flex items-center gap-2.5 mb-5 pb-4 border-b border-[#D4C9B5]/60">
                <div className="w-8 h-8 rounded-full bg-[#B8392E] flex items-center justify-center text-sm font-bold text-[#F5F0E6]">
                  {idx + 1}
                </div>
                <span className="text-sm font-bold text-[#1A1715]">
                  {p?.icon} {p?.domainName}
                </span>
                <span className="text-[10px] font-mono text-[#B8392E] ml-auto">
                  gap {p?.gap.toFixed(1)}
                </span>
              </div>

              <div className="space-y-4">
                {SMART_FIELDS.map((field) => (
                  <div key={field.key}>
                    <div className="flex items-baseline justify-between mb-1 gap-2">
                      <label className="text-xs font-bold uppercase tracking-wide text-[#1A1715]">
                        {field.label}
                      </label>
                      <span className="text-[10px] text-[#8A7F75] text-right max-w-[60%] leading-tight">
                        {field.description}
                      </span>
                    </div>
                    <input
                      type="text"
                      value={goal[field.key]}
                      onChange={(e) =>
                        updateGoal(idx, field.key, e.target.value)
                      }
                      placeholder={field.placeholder}
                      className="w-full rounded-lg bg-[#F5F0E6] border border-[#D4C9B5] px-3 py-2.5 text-sm text-[#1A1715] placeholder:text-[#8A7F75]/50 focus:border-[#B8392E] focus:ring-2 focus:ring-[#B8392E]/10 focus:outline-none transition-all"
                    />
                  </div>
                ))}
              </div>

              {/* Live preview */}
              {hasPreview && (
                <div className="mt-5 rounded-xl bg-[#B8392E]/5 border border-[#B8392E]/20 p-4">
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#B8392E]">
                      ✓ Meta montada
                    </span>
                  </div>
                  <p className="text-sm text-[#1A1715] leading-relaxed">
                    {buildGoal(goal) || "Continue respondendo pra ver a meta se formar..."}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <NavButtons
        onBack={() => dispatch({ type: "SET_STEP", step: "environment" })}
        onNext={handleNext}
        nextDisabled={!allFilled}
        nextLabel="Ver resultado →"
      />
    </div>
  );
}
