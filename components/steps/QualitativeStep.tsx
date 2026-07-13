"use client";

import { useState, useEffect } from "react";
import { useQuiz, getTopPriorityDomains } from "@/lib/store";
import { TextBox, NavButtons, StepHeader } from "@/components/ui";
import type { QualitativeEntry } from "@/lib/types";

export default function QualitativeStep() {
  const { state, dispatch } = useQuiz();
  const priorities = getTopPriorityDomains(state, 5);
  const [entries, setEntries] = useState<QualitativeEntry[]>(
    priorities.map((p) => ({
      domainId: p.domainId,
      text: state.qualitative.find((q) => q.domainId === p.domainId)?.text ?? "",
    }))
  );

  useEffect(() => {
    setEntries((prev) =>
      priorities.map((p) => {
        const existing = prev.find((e) => e.domainId === p.domainId);
        const saved = state.qualitative.find((q) => q.domainId === p.domainId);
        return existing ?? saved ?? { domainId: p.domainId, text: "" };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateText = (domainId: string, text: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.domainId === domainId ? { ...e, text } : e))
    );
  };

  const allFilled = entries.every((e) => e.text.trim().length >= 10);

  const handleNext = () => {
    dispatch({ type: "SET_QUALITATIVE", entries });
    dispatch({ type: "SET_STEP", step: "narrative" });
  };

  const handleBack = () => {
    dispatch({ type: "SET_STEP", step: "quantitative" });
  };

  const domainMap = Object.fromEntries(priorities.map((p) => [p.domainId, p]));

  return (
    <div className="step-enter">
      <StepHeader
        number="02"
        eyebrow="Reflexão"
        title="Que tipo de pessoa você quer ser?"
        subtitle="Seus 5 domínios com maior gap apareceram. Finge que tudo é possível — escreva sem filtro."
      />

      <div className="space-y-6">
        {entries.map((entry, i) => {
          const p = domainMap[entry.domainId];
          const domain = [...priorities].find((x) => x.domainId === entry.domainId);
          return (
            <div key={entry.domainId} className="relative">
              <div className="flex items-center gap-2.5 mb-2">
                <span className="text-lg">{domain?.icon}</span>
                <span className="text-sm font-bold text-[#1A1715]">
                  {domain?.domainName}
                </span>
                <div className="ml-auto flex items-center gap-1.5 text-[10px]">
                  <span className="px-2 py-0.5 rounded-full bg-[#B8392E]/10 text-[#B8392E] font-mono font-bold">
                    gap {p.gap.toFixed(1)}
                  </span>
                </div>
              </div>
              <TextBox
                value={entry.text}
                onChange={(v) => updateText(entry.domainId, v)}
                rows={3}
                placeholder={getPromptForDomain(entry.domainId)}
              />
            </div>
          );
        })}
      </div>

      <NavButtons
        onBack={handleBack}
        onNext={handleNext}
        nextDisabled={!allFilled}
        nextLabel="Continuar →"
      />
    </div>
  );
}

function getPromptForDomain(domainId: string): string {
  const prompts: Record<string, string> = {
    family: "Quero ser um filho presente, que liga toda semana e aparece sem precisar de motivo...",
    intimate: "Quero ser alguém que comunica sentimentos diretamente, sem jogos...",
    parenting: "Quero ser paciente, escutar antes de reagir, criar um ambiente seguro...",
    friends: "Quero ser o amigo que initiative contato, não só responde...",
    career: "Quero fazer trabalho que importe, ter autonomia, construir expertise...",
    education: "Quero aprender uma nova habilidade por trimestre...",
    recreation: "Quero ter hobbies que não envolvam tela...",
    spirituality: "Quero ter momentos de silêncio diário...",
    community: "Quero participar ativamente de grupos que cuidam de...",
    physical: "Quero dormir 7h+, treinar 3x por semana...",
    environment: "Quero reduzir meu consumo de plástico...",
    aesthetics: "Quero dedicar tempo semanal para criar, não apenas consumir...",
  };
  return prompts[domainId] || "Descreva o que você quer para esta área...";
}
