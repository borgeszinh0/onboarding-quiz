"use client";

import { useState } from "react";
import { useQuiz } from "@/lib/store";
import { use12WY } from "@/lib/12wy-store";
import { DOMAINS } from "@/lib/data";

export default function PlanSetup() {
  const { state: quizState } = useQuiz();
  const { state: wyState, dispatch } = use12WY();
  const [newTactics, setNewTactics] = useState<Record<string, string>>({});

  const goals = quizState.goals.filter((g) => g.goal.trim());

  if (goals.length === 0) {
    return (
      <div className="step-enter text-center py-20">
        <div className="text-4xl mb-4">📋</div>
        <h2 className="text-xl font-bold text-[#1A1715] mb-2">
          Você ainda não tem metas
        </h2>
        <p className="text-sm text-[#4A433D] max-w-sm mx-auto">
          Complete o quiz primeiro para definir suas metas SMART. Depois volte
          aqui para transformá-las em um plano de 12 semanas.
        </p>
        <a
          href="/quiz"
          className="inline-block mt-6 px-6 py-3 rounded-full bg-[#B8392E] text-[#F5F0E6] text-sm font-semibold hover:bg-[#8B2A22] transition-colors"
        >
          Fazer o quiz →
        </a>
      </div>
    );
  }

  const handleAddTactic = (goalId: string) => {
    const desc = (newTactics[goalId] ?? "").trim();
    if (!desc) return;
    dispatch({ type: "ADD_TACTIC", goalId, description: desc });
    setNewTactics((prev) => ({ ...prev, [goalId]: "" }));
  };

  const handleStart = () => {
    const today = new Date().toISOString().slice(0, 10);
    dispatch({ type: "SET_START_DATE", date: today });
    dispatch({ type: "SET_CURRENT_WEEK", week: 1 });
    window.location.href = "/plano/dashboard";
  };

  const hasTactics = wyState.tactics.length > 0;

  return (
    <div className="step-enter">
      {/* Header */}
      <div className="mb-8">
        <span className="text-[10px] font-mono font-bold tracking-widest text-[#B8392E]">
          12 WEEK YEAR
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#1A1715] leading-tight mt-1">
          Transforme metas em táticas.
        </h2>
        <p className="text-sm text-[#4A433D] mt-2 max-w-lg leading-relaxed">
          Cada meta vira 3-5 ações semanais. São essas ações que você executa
          toda semana durante 12 semanas. Sem débito — só crédito.
        </p>
      </div>

      {/* Metas + Táticas */}
      <div className="space-y-6 mb-8">
        {goals.map((g, i) => {
          const domain = DOMAINS.find((d) => d.id === g.linkedDomainId);
          const tactics = wyState.tactics.filter((t) => t.goalId === g.goal || t.goalId === `goal_${i}`);
          return (
            <div
              key={i}
              className="rounded-2xl border border-[#D4C9B5] bg-white/50 p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-[#B8392E] flex items-center justify-center text-[10px] font-bold text-[#F5F0E6]">
                  {i + 1}
                </div>
                <span className="text-sm font-bold text-[#1A1715]">
                  {domain?.icon} {domain?.name}
                </span>
              </div>

              <p className="text-xs text-[#1A1715] leading-relaxed bg-[#B8392E]/5 border border-[#B8392E]/20 rounded-lg p-3 mb-4">
                {g.goal}
              </p>

              {/* Táticas existentes */}
              {tactics.length > 0 && (
                <div className="space-y-2 mb-3">
                  {tactics.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center gap-2 group"
                    >
                      <span className="text-[#B8392E] text-sm">▸</span>
                      <span className="text-sm text-[#1A1715] flex-1">
                        {t.description}
                      </span>
                      <button
                        onClick={() =>
                          dispatch({ type: "REMOVE_TACTIC", tacticId: t.id })
                        }
                        className="text-[10px] text-[#8A7F75] hover:text-[#B8392E] opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        remover
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Adicionar tática */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTactics[`goal_${i}`] ?? ""}
                  onChange={(e) =>
                    setNewTactics((p) => ({
                      ...p,
                      [`goal_${i}`]: e.target.value,
                    }))
                  }
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleAddTactic(`goal_${i}`)
                  }
                  placeholder="Nova tática semanal..."
                  className="flex-1 rounded-lg bg-[#F5F0E6] border border-[#D4C9B5] px-3 py-2 text-sm text-[#1A1715] placeholder:text-[#8A7F75]/50 focus:border-[#B8392E] focus:ring-2 focus:ring-[#B8392E]/10 focus:outline-none transition-all"
                />
                <button
                  onClick={() => handleAddTactic(`goal_${i}`)}
                  className="px-4 rounded-lg bg-[#B8392E]/10 text-[#B8392E] text-sm font-medium hover:bg-[#B8392E]/20 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Start button */}
      <div className="flex flex-col items-center gap-3 mt-10">
        <button
          onClick={handleStart}
          disabled={!hasTactics}
          className="px-8 py-3.5 rounded-full bg-[#B8392E] text-[#F5F0E6] text-sm font-semibold tracking-wide hover:bg-[#8B2A22] disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          Iniciar 12 semanas →
        </button>
        {!hasTactics && (
          <p className="text-[10px] text-[#8A7F75]">
            Adicione pelo menos uma tática para começar
          </p>
        )}
        {hasTactics && (
          <p className="text-[10px] text-[#8A7F75]">
            {wyState.tactics.length} tática{wyState.tactics.length > 1 ? "s" : ""} •{" "}
            {12} semanas • scorecard semanal
          </p>
        )}
      </div>
    </div>
  );
}
