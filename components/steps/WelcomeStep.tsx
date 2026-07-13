"use client";

import { useState } from "react";
import { useQuiz } from "@/lib/store";

export default function WelcomeStep() {
  const { state, dispatch } = useQuiz();
  const [name, setName] = useState(state.username);

  const handleStart = () => {
    dispatch({ type: "SET_USERNAME", name });
    dispatch({ type: "SET_STEP", step: "quantitative" });
  };

  return (
    <div className="step-enter flex flex-col items-center justify-center min-h-[75vh] text-center">
      {/* Iceberg metaphor badge */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-full bg-[#B8392E] flex items-center justify-center shadow-lg">
          <span className="text-3xl">🧭</span>
        </div>
        <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#F5F0E6] border-2 border-[#D4C9B5] flex items-center justify-center">
          <span className="text-[8px]">⛰️</span>
        </div>
      </div>

      <h1 className="text-3xl sm:text-4xl font-bold text-[#1A1715] leading-tight mb-4 max-w-md">
        Antes das metas,
        <br />
        <span className="text-[#B8392E]">os valores.</span>
      </h1>

      <p className="text-[#4A433D] max-w-sm leading-relaxed mb-10 text-sm">
        Um onboarding em 5 etapas para mapear seus valores, auditar seu ambiente
        e construir metas que se sustentam.
      </p>

      {/* Step pills */}
      <div className="flex items-center gap-1 mb-10">
        {[
          { label: "Valores", n: "01" },
          { label: "Reflexão", n: "02" },
          { label: "Narrativa", n: "03" },
          { label: "Ambiente", n: "04" },
          { label: "Metas", n: "05" },
        ].map((s, i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-mono text-[#8A7F75]">{s.n}</span>
              <span className="text-[10px] font-medium text-[#4A433D]">
                {s.label}
              </span>
            </div>
            {i < 4 && <div className="w-4 h-px bg-[#D4C9B5] mx-1.5 mb-3" />}
          </div>
        ))}
      </div>

      <div className="w-full max-w-xs space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleStart()}
          placeholder="Seu primeiro nome"
          className="w-full rounded-full bg-white/70 border border-[#D4C9B5] px-5 py-3 text-center text-[#1A1715] text-sm placeholder:text-[#8A7F75]/60 focus:border-[#B8392E] focus:ring-2 focus:ring-[#B8392E]/10 focus:outline-none transition-all"
        />
        <button
          onClick={handleStart}
          disabled={!name.trim()}
          className="w-full px-6 py-3.5 rounded-full bg-[#B8392E] text-[#F5F0E6] font-semibold tracking-wide text-sm hover:bg-[#8B2A22] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
        >
          Começar →
        </button>
      </div>

      <p className="text-[10px] tracking-wide text-[#8A7F75] mt-10">
        Baseado na metodologia ACT • ~10 minutos
      </p>
    </div>
  );
}
