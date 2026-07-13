"use client";

import { useQuiz, getProgress } from "@/lib/store";

const STEP_LABELS: Record<string, string> = {
  welcome: "Início",
  quantitative: "Valores",
  qualitative: "Reflexão",
  narrative: "Narrativa",
  environment: "Ambiente",
  smart: "Metas",
  result: "Resultado",
};

export default function ProgressBar() {
  const { state } = useQuiz();
  const { completed, total } = getProgress(state);
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  const steps = Object.entries(STEP_LABELS);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium tracking-wide text-[#8A7F75] uppercase">
          {completed} de {total}
        </span>
        <span className="text-xs font-mono tabular-nums text-[#B8392E]">
          {pct}%
        </span>
      </div>
      <div className="h-[3px] w-full bg-[#D4C9B5] overflow-hidden rounded-full">
        <div
          className="h-full bg-[#B8392E] rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="hidden sm:flex items-center justify-between mt-4">
        {steps.map(([key, label], i) => {
          const isActive = state.step === key;
          const isPast = i < completed;
          return (
            <div key={key} className="flex items-center gap-1">
              {i > 0 && (
                <div
                  className={`h-px w-6 transition-colors duration-500 ${isPast ? "bg-[#B8392E]" : "bg-[#D4C9B5]"}`}
                />
              )}
              <div className="flex items-center gap-1.5">
                <div
                  className={`h-1.5 w-1.5 rounded-full transition-colors duration-500 ${
                    isActive
                      ? "bg-[#B8392E] scale-150"
                      : isPast
                        ? "bg-[#B8392E]"
                        : "bg-[#D4C9B5]"
                  }`}
                />
                <span
                  className={`text-[10px] tracking-wide transition-colors duration-500 ${
                    isActive
                      ? "text-[#1A1715] font-semibold"
                      : isPast
                        ? "text-[#4A433D]"
                        : "text-[#8A7F75]"
                  }`}
                >
                  {label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
