"use client";

import { useState, useEffect } from "react";
import { useQuiz } from "@/lib/store";
import { ENVIRONMENT_QUESTIONS } from "@/lib/data";
import { TextBox, NavButtons, StepHeader } from "@/components/ui";
import type { EnvironmentEntry } from "@/lib/types";

export default function EnvironmentStep() {
  const { state, dispatch } = useQuiz();
  const [entries, setEntries] = useState<EnvironmentEntry[]>(
    ENVIRONMENT_QUESTIONS.map((q, i) => ({
      question: q,
      answer: state.environment[i]?.answer ?? "",
    }))
  );

  useEffect(() => {
    setEntries((prev) =>
      ENVIRONMENT_QUESTIONS.map((q, i) => ({
        question: q,
        answer: prev[i]?.answer ?? state.environment[i]?.answer ?? "",
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateAnswer = (idx: number, answer: string) => {
    setEntries((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, answer } : e))
    );
  };

  const allFilled = entries.every((e) => e.answer.trim().length >= 5);

  const handleNext = () => {
    dispatch({ type: "SET_ENVIRONMENT", entries });
    dispatch({ type: "SET_STEP", step: "smart" });
  };

  return (
    <div className="step-enter">
      <StepHeader
        number="04"
        eyebrow="Ambiente"
        title="Seu ambiente facilita ou sabota?"
        subtitle="O cérebro aprende por contexto. Seja honesto — ninguém vai ler isso além de você."
      />

      <div className="space-y-6">
        {entries.map((entry, i) => (
          <div key={i}>
            <div className="flex items-start gap-2.5 mb-2">
              <span className="text-xs font-mono font-bold text-[#B8392E] mt-0.5 shrink-0">
                Q{i + 1}
              </span>
              <p className="text-sm font-medium text-[#1A1715] leading-snug">
                {entry.question}
              </p>
            </div>
            <TextBox
              value={entry.answer}
              onChange={(v) => updateAnswer(i, v)}
              rows={3}
              placeholder="Pense em objetos, rotinas, pessoas, apps, horários..."
            />
          </div>
        ))}
      </div>

      <NavButtons
        onBack={() => dispatch({ type: "SET_STEP", step: "narrative" })}
        onNext={handleNext}
        nextDisabled={!allFilled}
        nextLabel="Construir metas →"
      />
    </div>
  );
}
