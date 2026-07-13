"use client";

import { useState, useEffect } from "react";
import { useQuiz } from "@/lib/store";
import { DOMAINS } from "@/lib/data";
import { NavButtons, StepHeader } from "@/components/ui";
import type { NarrativeEntry } from "@/lib/types";

export default function NarrativeStep() {
  const { state, dispatch } = useQuiz();
  const scoredDomains = DOMAINS.filter(
    (d) => state.scores[d.id].generalImportance >= 5
  );

  const [entries, setEntries] = useState<NarrativeEntry[]>(
    scoredDomains.map((d) => ({
      domainId: d.id,
      text: state.narratives.find((n) => n.domainId === d.id)?.text ?? "",
    }))
  );

  useEffect(() => {
    setEntries((prev) =>
      scoredDomains.map((d) => {
        const existing = prev.find((e) => e.domainId === d.id);
        const saved = state.narratives.find((n) => n.domainId === d.id);
        return existing ?? saved ?? { domainId: d.id, text: "" };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateText = (domainId: string, text: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.domainId === domainId ? { ...e, text } : e))
    );
  };

  const allFilled = entries.every((e) => e.text.trim().length >= 5);

  const handleNext = () => {
    dispatch({ type: "SET_NARRATIVE", entries });
    dispatch({ type: "SET_STEP", step: "environment" });
  };

  return (
    <div className="step-enter">
      <StepHeader
        number="03"
        eyebrow="Narrativa"
        title="Uma frase. Uma direção."
        subtitle="Resuma cada domínio em uma frase — não um destino, uma bússola."
      />

      <div className="space-y-6">
        {entries.map((entry, i) => {
          const domain = scoredDomains[i];
          return (
            <div key={entry.domainId}>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-base">{domain.icon}</span>
                <span className="text-xs font-bold uppercase tracking-wide text-[#8A7F75]">
                  {domain.name}
                </span>
              </div>
              <input
                type="text"
                value={entry.text}
                onChange={(e) => updateText(entry.domainId, e.target.value)}
                placeholder={getPlaceholder(entry.domainId)}
                className="w-full rounded-lg bg-white/60 border border-[#D4C9B5] px-4 py-3 text-sm text-[#1A1715] italic placeholder:text-[#8A7F75]/50 placeholder:not-italic focus:border-[#B8392E] focus:ring-2 focus:ring-[#B8392E]/10 focus:outline-none transition-all"
              />
            </div>
          );
        })}
      </div>

      <NavButtons
        onBack={() => dispatch({ type: "SET_STEP", step: "qualitative" })}
        onNext={handleNext}
        nextDisabled={!allFilled}
        nextLabel="Continuar →"
      />
    </div>
  );
}

function getPlaceholder(domainId: string): string {
  const placeholders: Record<string, string> = {
    family: "Ser um filho presente que cuida da família sem precisarem pedir.",
    intimate: "Comunicar meus sentimentos com clareza e construir confiança diária.",
    parenting: "Ser paciente e curioso, criar um ambiente seguro para meu filho.",
    friends: "Ser o amigo que initiative contato e cuida das relações ativamente.",
    career: "Construir expertise no que faço e ter autonomia nas minhas decisões.",
    education: "Aprender algo novo a cada trimestre e aplicar no mesmo mês.",
    recreation: "Ter hobbies ativos que me tiram das telas e me dão energia.",
    spirituality: "Reservar momentos de silêncio diário para reconectar com meu propósito.",
    community: "Participar ativamente de causas que cuidam de pessoas ao meu redor.",
    physical: "Cuidar do meu corpo como instrumento, não como enfeite.",
    environment: "Consumir de forma consciente e reduzir meu impacto diário.",
    aesthetics: "Reservar tempo semanal para criar, não apenas consumir arte.",
  };
  return placeholders[domainId] || "Uma frase que resume sua direção neste domínio.";
}
