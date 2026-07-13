"use client";

import { useState } from "react";
import { useQuiz } from "@/lib/store";
import { DOMAINS, DIMENSIONS } from "@/lib/data";
import { Slider, NavButtons, StepHeader } from "@/components/ui";
import type { Dimension } from "@/lib/types";

export default function QuantitativeStep() {
  const { state, dispatch } = useQuiz();
  const [domainIdx, setDomainIdx] = useState(0);
  const domain = DOMAINS[domainIdx];
  const isLast = domainIdx === DOMAINS.length - 1;

  const setScore = (dim: Dimension, value: number) => {
    dispatch({
      type: "SET_SCORE",
      domainId: domain.id,
      dimension: dim,
      value,
    });
  };

  const allFilled = DIMENSIONS.every(
    (d) => state.scores[domain.id][d.key] > 0
  );

  const handleNext = () => {
    if (isLast) {
      dispatch({ type: "SET_STEP", step: "qualitative" });
    } else {
      setDomainIdx((i) => i + 1);
    }
  };

  const handleBack = () => {
    if (domainIdx === 0) {
      dispatch({ type: "SET_STEP", step: "welcome" });
    } else {
      setDomainIdx((i) => i - 1);
    }
  };

  return (
    <div className="step-enter">
      <StepHeader
        number={`${String(domainIdx + 1).padStart(2, "0")} / 12`}
        eyebrow="Avaliação de Valores"
        title={`${domain.icon} ${domain.name}`}
        subtitle={domain.description}
      />

      {/* Domain navigation */}
      <div className="flex flex-wrap gap-1.5 mb-8">
        {DOMAINS.map((d, i) => {
          const filled = DIMENSIONS.every(
            (dim) => state.scores[d.id][dim.key] > 0
          );
          return (
            <button
              key={d.id}
              onClick={() => setDomainIdx(i)}
              className={`h-8 w-8 rounded-full text-[10px] font-bold transition-all ${
                i === domainIdx
                  ? "bg-[#B8392E] text-[#F5F0E6] scale-110"
                  : filled
                    ? "bg-[#B8392E]/20 text-[#B8392E]"
                    : i < domainIdx
                      ? "bg-[#D4C9B5] text-[#8A7F75]"
                      : "bg-[#D4C9B5]/50 text-[#8A7F75]"
              }`}
            >
              {i + 1}
            </button>
          );
        })}
      </div>

      <div className="space-y-7">
        {DIMENSIONS.map((dim) => (
          <Slider
            key={dim.key}
            label={dim.label}
            description={dim.description}
            value={state.scores[domain.id][dim.key]}
            onChange={(v) => setScore(dim.key, v)}
          />
        ))}
      </div>

      <NavButtons
        onBack={handleBack}
        onNext={handleNext}
        nextDisabled={!allFilled}
        nextLabel={isLast ? "Continuar →" : "Próximo domínio →"}
      />
    </div>
  );
}
