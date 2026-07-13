"use client";

import Link from "next/link";
import { useQuiz } from "@/lib/store";
import { DOMAINS } from "@/lib/data";
import ResultStep from "@/components/steps/ResultStep";

export default function ResultadoPage() {
  const { state } = useQuiz();

  const hasData =
    state.goals.length > 0 ||
    DOMAINS.some((d) => {
      const s = state.scores[d.id];
      return s && (s.currentImportance > 0 || s.action > 0 || s.generalImportance > 0);
    });

  return (
    <div className="bg-[#F5F0E6] text-[#1A1715]">
      <div className="max-w-2xl mx-auto px-5 py-8 sm:py-12">
        {hasData ? (
          <ResultStep />
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-full bg-[#D4C9B5]/40 mx-auto mb-5 flex items-center justify-center text-2xl">
              🧭
            </div>
            <h1 className="text-xl font-bold mb-2">Seu mapa ainda está vazio</h1>
            <p className="text-sm text-[#8A7F75] max-w-xs mx-auto mb-6 leading-relaxed">
              Faça o onboarding para mapear seus valores e gerar seu mapa.
            </p>
            <Link
              href="/quiz"
              className="inline-block px-6 py-3 rounded-full bg-[#B8392E] text-[#F5F0E6] font-semibold hover:bg-[#8B2A22] transition-all"
            >
              Começar onboarding →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
