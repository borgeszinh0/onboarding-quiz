"use client";

import { useState, useEffect } from "react";
import {
  use12WY,
  getWeekCompletion,
  getOverallScore,
  getWeekFromDate,
} from "@/lib/12wy-store";
import { useQuiz } from "@/lib/store";
import { DOMAINS } from "@/lib/data";
import DayView from "./DayView";

export default function PlanDashboard() {
  const { state: wyState, dispatch } = use12WY();
  const { state: quizState } = useQuiz();
  const [view, setView] = useState<"day" | "week" | "overview">("day");
  const [editTacticId, setEditTacticId] = useState<string | null>(null);
  const [editTacticText, setEditTacticText] = useState("");

  // Sincroniza a semana atual com a data real de início (avança sozinha).
  useEffect(() => {
    const derived = getWeekFromDate(wyState.startDate);
    if (derived && derived !== wyState.currentWeek) {
      dispatch({ type: "SET_CURRENT_WEEK", week: derived });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wyState.startDate]);

  // If no start date, send to setup
  if (!wyState.startDate) {
    window.location.href = "/plano";
    return null;
  }

  const week = wyState.currentWeek;
  const completion = getWeekCompletion(wyState, week);
  const overall = getOverallScore(wyState);
  const goals = quizState.goals;

  // Goal map: tactic.goalId → goal index → domain
  const goalMap = new Map<string, { domainName: string; icon: string; goalText: string }>();
  goals.forEach((g, i) => {
    const domain = DOMAINS.find((d) => d.id === g.linkedDomainId);
    goalMap.set(`goal_${i}`, {
      domainName: domain?.name ?? "",
      icon: domain?.icon ?? "",
      goalText: g.goal,
    });
  });

  // Calculate start/end date for current week
  const start = new Date(wyState.startDate);
  const weekStart = new Date(start);
  weekStart.setDate(start.getDate() + (week - 1) * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  const fmt = (d: Date) =>
    d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

  // Score color
  const scoreColor =
    completion.pct >= 80
      ? "#2D7A4E"
      : completion.pct >= 50
        ? "#B8392E"
        : "#8A7F75";

  return (
    <div className="step-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-[10px] font-mono font-bold tracking-widest text-[#B8392E]">
            12 WEEK YEAR
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[#1A1715] leading-tight mt-0.5">
            {view === "day" ? "Dia" : view === "week" ? `Semana ${week}` : "Visão geral"}
          </h2>
          {view === "week" && (
            <p className="text-[10px] text-[#8A7F75] mt-0.5">
              {fmt(weekStart)} – {fmt(weekEnd)}
            </p>
          )}
        </div>

        {/* View toggle */}
        <div className="flex rounded-full bg-[#D4C9B5]/40 p-0.5">
          <button
            onClick={() => setView("day")}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${
              view === "day"
                ? "bg-[#B8392E] text-[#F5F0E6]"
                : "text-[#8A7F75] hover:text-[#1A1715]"
            }`}
          >
            Dia
          </button>
          <button
            onClick={() => setView("week")}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${
              view === "week"
                ? "bg-[#B8392E] text-[#F5F0E6]"
                : "text-[#8A7F75] hover:text-[#1A1715]"
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setView("overview")}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wide transition-all ${
              view === "overview"
                ? "bg-[#B8392E] text-[#F5F0E6]"
                : "text-[#8A7F75] hover:text-[#1A1715]"
            }`}
          >
            Visão
          </button>
        </div>
      </div>

      {/* ============ DAY VIEW ============ */}
      {view === "day" && <DayView />}

      {/* ============ WEEK VIEW ============ */}
      {view === "week" && (
        <>
          {/* Score circle */}
          <div className="rounded-2xl border border-[#D4C9B5] bg-white/50 p-5 sm:p-6 mb-6">
            <div className="flex items-center gap-5">
              {/* Circular progress */}
              <div className="relative w-20 h-20 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                  <circle cx="40" cy="40" r="34" fill="none" stroke="#D4C9B5" strokeWidth="6" />
                  <circle
                    cx="40" cy="40" r="34" fill="none"
                    stroke={scoreColor}
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 34}`}
                    strokeDashoffset={`${2 * Math.PI * 34 * (1 - completion.pct / 100)}`}
                    className="transition-all duration-700"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className="text-xl font-bold tabular-nums"
                    style={{ color: scoreColor }}
                  >
                    {completion.pct}%
                  </span>
                </div>
              </div>

              <div className="flex-1">
                <p className="text-sm font-bold text-[#1A1715]">
                  {completion.done} de {completion.total} táticas concluídas
                </p>
                <p className="text-xs text-[#8A7F75] mt-1">
                  {completion.pct >= 80
                    ? "Execução excelente. Você está no ritmo."
                    : completion.pct >= 50
                      ? "No caminho, mas precisa acelerar."
                      : "Abaixo do ideal. Refoque nas táticas desta semana."}
                </p>
              </div>
            </div>
          </div>

          {/* Checklist */}
          <div className="rounded-2xl border border-[#D4C9B5] bg-white/50 p-5 sm:p-6 mb-6">
            <h3 className="text-sm font-bold text-[#1A1715] mb-4">
              Táticas desta semana
            </h3>
            <div className="space-y-3">
              {wyState.tactics.map((t) => {
                const g = goalMap.get(t.goalId);
                const isDone = wyState.weeks[week]?.[t.id] ?? false;
                return (
                  <div
                    key={t.id}
                    className="flex items-start gap-3 group"
                  >
                    <button
                      onClick={() =>
                        dispatch({
                          type: "TOGGLE_TACTIC",
                          weekNumber: week,
                          tacticId: t.id,
                        })
                      }
                      aria-pressed={isDone}
                      aria-label={`Concluir tática: ${t.description}`}
                      className={`mt-0.5 w-5 h-5 rounded border-2 shrink-0 flex items-center justify-center transition-all cursor-pointer ${
                        isDone
                          ? "bg-[#B8392E] border-[#B8392E]"
                          : "border-[#D4C9B5] group-hover:border-[#B8392E]"
                      }`}
                    >
                      {isDone && (
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 5L4 7L8 3" stroke="#F5F0E6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1">
                      <p
                        className={`text-sm transition-all ${
                          isDone
                            ? "text-[#8A7F75] line-through"
                            : "text-[#1A1715]"
                        }`}
                      >
                        {t.description}
                      </p>
                      {g && (
                        <span className="text-[10px] text-[#8A7F75]">
                          {g.icon} {g.domainName}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Week navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() =>
                week > 1 && dispatch({ type: "SET_CURRENT_WEEK", week: week - 1 })
              }
              disabled={week === 1}
              className="text-sm font-medium text-[#8A7F75] hover:text-[#1A1715] disabled:opacity-30 transition-colors"
            >
              ← Semana {week - 1 > 0 ? week - 1 : ""}
            </button>
            <span className="text-[10px] font-mono text-[#8A7F75]">
              {week} / 12
            </span>
            <button
              onClick={() =>
                week < 12 &&
                dispatch({ type: "SET_CURRENT_WEEK", week: week + 1 })
              }
              disabled={week === 12}
              className="text-sm font-medium text-[#B8392E] hover:text-[#8B2A22] disabled:opacity-30 transition-colors"
            >
              Semana {week + 1 <= 12 ? week + 1 : ""} →
            </button>
          </div>
        </>
      )}

      {/* ============ OVERVIEW VIEW ============ */}
      {view === "overview" && (
        <>
          {/* Overall score */}
          <div className="rounded-2xl border border-[#D4C9B5] bg-white/50 p-5 sm:p-6 mb-6">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-[#1A1715]">
                Score geral
              </h3>
              <span className="text-2xl font-bold tabular-nums text-[#B8392E]">
                {overall.pct}%
              </span>
            </div>
            <p className="text-xs text-[#8A7F75] mb-4">
              {overall.done} de {overall.total} táticas concluídas em {12} semanas
            </p>
            <div className="h-2 bg-[#D4C9B5] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#B8392E] rounded-full transition-all duration-700"
                style={{ width: `${overall.pct}%` }}
              />
            </div>
          </div>

          {/* 12-week grid */}
          <div className="rounded-2xl border border-[#D4C9B5] bg-white/50 p-5 sm:p-6">
            <h3 className="text-sm font-bold text-[#1A1715] mb-4">
              Histórico semanal
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => {
                const c = getWeekCompletion(wyState, w);
                const isCurrent = w === wyState.currentWeek;
                return (
                  <button
                    key={w}
                    onClick={() => {
                      dispatch({ type: "SET_CURRENT_WEEK", week: w });
                      setView("week");
                    }}
                    className={`rounded-xl p-3 text-center transition-all border ${
                      isCurrent
                        ? "border-[#B8392E] bg-[#B8392E]/5"
                        : "border-[#D4C9B5]/60 bg-[#F5F0E6]"
                    } hover:border-[#B8392E]`}
                  >
                    <p className="text-[10px] font-mono text-[#8A7F75]">SEM</p>
                    <p className="text-base font-bold text-[#1A1715]">{w}</p>
                    <p
                      className="text-xs font-mono tabular-nums mt-1"
                      style={{
                        color:
                          c.pct >= 80
                            ? "#2D7A4E"
                            : c.pct >= 50
                              ? "#B8392E"
                              : "#8A7F75",
                      }}
                    >
                      {c.pct}%
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Metas + Táticas list */}
          <div className="rounded-2xl border border-[#D4C9B5] bg-white/50 p-5 sm:p-6 mt-6">
            <h3 className="text-sm font-bold text-[#1A1715] mb-4">
              Suas táticas
            </h3>
            <div className="space-y-4">
              {goals.map((g, i) => {
                const domain = DOMAINS.find((d) => d.id === g.linkedDomainId);
                const tactics = wyState.tactics.filter(
                  (t) => t.goalId === `goal_${i}`
                );
                if (tactics.length === 0) return null;
                return (
                  <div key={i}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm">{domain?.icon}</span>
                      <span className="text-xs font-bold text-[#1A1715]">
                        {domain?.name}
                      </span>
                    </div>
                    <div className="space-y-1.5 pl-6">
                      {tactics.map((t) =>
                        editTacticId === t.id ? (
                          <div key={t.id} className="flex gap-2">
                            <input
                              value={editTacticText}
                              autoFocus
                              onChange={(e) => setEditTacticText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && editTacticText.trim()) {
                                  dispatch({
                                    type: "UPDATE_TACTIC",
                                    tacticId: t.id,
                                    description: editTacticText.trim(),
                                  });
                                  setEditTacticId(null);
                                }
                                if (e.key === "Escape") setEditTacticId(null);
                              }}
                              aria-label="Editar tática"
                              className="flex-1 rounded-lg bg-[#F5F0E6] border border-[#D4C9B5] px-2 py-1 text-xs focus:border-[#B8392E] focus:outline-none"
                            />
                            <button
                              onClick={() => {
                                if (editTacticText.trim())
                                  dispatch({
                                    type: "UPDATE_TACTIC",
                                    tacticId: t.id,
                                    description: editTacticText.trim(),
                                  });
                                setEditTacticId(null);
                              }}
                              className="text-[11px] font-bold text-[#B8392E]"
                            >
                              OK
                            </button>
                          </div>
                        ) : (
                          <div
                            key={t.id}
                            className="flex items-center gap-2 group"
                          >
                            <span className="text-[#B8392E] text-xs">▸</span>
                            <span className="text-xs text-[#4A433D] flex-1">
                              {t.description}
                            </span>
                            <button
                              onClick={() => {
                                setEditTacticId(t.id);
                                setEditTacticText(t.description);
                              }}
                              aria-label="Editar tática"
                              className="text-[11px] text-[#8A7F75] hover:text-[#B8392E] opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ✎
                            </button>
                            <button
                              onClick={() => {
                                if (confirm("Remover esta tática?"))
                                  dispatch({ type: "REMOVE_TACTIC", tacticId: t.id });
                              }}
                              aria-label="Remover tática"
                              className="text-[11px] text-[#8A7F75] hover:text-[#B8392E] opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ✕
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Reset */}
      <div className="flex justify-center mt-10">
        <button
          onClick={() => {
            if (confirm("Resetar todo o plano de 12 semanas?")) {
              dispatch({ type: "RESET" });
              window.location.href = "/plano";
            }
          }}
          className="px-5 py-2 rounded-full border border-[#D4C9B5] text-xs font-medium text-[#8A7F75] hover:border-[#B8392E] hover:text-[#B8392E] transition-colors"
        >
          Resetar plano
        </button>
      </div>
    </div>
  );
}
