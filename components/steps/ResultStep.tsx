"use client";

import { useQuiz, getGaps, getTopPriorityDomains } from "@/lib/store";
import { DOMAINS } from "@/lib/data";

export default function ResultStep() {
  const { state, dispatch } = useQuiz();
  const gaps = getGaps(state);
  const priorities = getTopPriorityDomains(state, 3);

  const radarData = DOMAINS.map((d) => {
    const s = state.scores[d.id];
    return {
      name: d.shortName,
      icon: d.icon,
      importance: (s.currentImportance + s.generalImportance) / 2,
      action: s.action,
    };
  });

  return (
    <div className="step-enter">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-full bg-[#B8392E] mx-auto mb-4 flex items-center justify-center">
          <span className="text-2xl">🧭</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1A1715]">
          {state.username ? `${state.username}, ` : ""}aqui está seu mapa.
        </h1>
        <p className="text-sm text-[#4A433D] mt-2 max-w-md mx-auto leading-relaxed">
          Valores claros. Ambiente auditado. Metas construídas. Esta é sua base de partida.
        </p>
      </div>

      {/* Gap Chart */}
      <div className="rounded-2xl border border-[#D4C9B5] bg-white/50 p-5 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-bold text-[#1A1715]">
            Importância vs Ação
          </h3>
          <span className="text-[10px] font-mono uppercase tracking-wide text-[#8A7F75]">
            12 domínios
          </span>
        </div>
        <p className="text-xs text-[#8A7F75] mb-5">
          Barras maiores = maior gap entre o que importa e o que você faz.
        </p>

        <div className="space-y-2">
          {radarData
            .slice()
            .sort((a, b) => b.importance - b.action - (a.importance - a.action))
            .map((d) => {
              const gap = d.importance - d.action;
              const isPriority = gap > 2 && d.importance >= 5;
              return (
                <div key={d.name} className="flex items-center gap-3">
                  <div className="w-20 flex items-center gap-1 shrink-0">
                    <span className="text-xs">{d.icon}</span>
                    <span className="text-[10px] text-[#4A433D] truncate">
                      {d.name}
                    </span>
                  </div>
                  <div className="flex-1 h-6 bg-[#F5F0E6] rounded-md relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-md bg-[#B8392E]/15"
                      style={{ width: `${(d.importance / 10) * 100}%` }}
                    />
                    <div
                      className="absolute inset-y-0 left-0 rounded-md bg-[#B8392E] transition-all duration-700"
                      style={{ width: `${(d.action / 10) * 100}%`, opacity: 0.85 }}
                    />
                  </div>
                  <div className="w-12 text-right shrink-0">
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        isPriority ? "text-[#B8392E]" : "text-[#8A7F75]"
                      }`}
                    >
                      {d.action.toFixed(0)}/{d.importance.toFixed(0)}
                    </span>
                  </div>
                </div>
              );
            })}
        </div>

        <div className="flex items-center gap-4 mt-5 pt-4 border-t border-[#D4C9B5]/60">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#B8392E]/15" />
            <span className="text-[10px] text-[#8A7F75]">Importância</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-[#B8392E]" />
            <span className="text-[10px] text-[#8A7F75]">Ação</span>
          </div>
        </div>
      </div>

      {/* Top 3 Priorities */}
      <div className="rounded-2xl border border-[#D4C9B5] bg-white/50 p-5 sm:p-6 mb-6">
        <h3 className="text-sm font-bold text-[#1A1715] mb-4">
          Top 3 prioridades
        </h3>
        <div className="grid sm:grid-cols-3 gap-3">
          {priorities.map((p, i) => (
            <div
              key={p.domainId}
              className="rounded-xl bg-[#F5F0E6] border border-[#D4C9B5]/60 p-4"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl">{p.icon}</span>
                <span className="text-[9px] font-mono uppercase tracking-widest text-[#B8392E] font-bold">
                  #{i + 1}
                </span>
              </div>
              <p className="text-sm font-bold text-[#1A1715]">{p.domainName}</p>
              <p className="text-[10px] text-[#8A7F75] mt-1">
                Gap de {p.gap.toFixed(1)} pontos
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Narratives */}
      {state.narratives.length > 0 && (
        <div className="rounded-2xl border border-[#D4C9B5] bg-white/50 p-5 sm:p-6 mb-6">
          <h3 className="text-sm font-bold text-[#1A1715] mb-4">
            Suas bússolas
          </h3>
          <div className="space-y-3">
            {state.narratives
              .filter((n) => n.text.trim())
              .map((n) => {
                const domain = DOMAINS.find((d) => d.id === n.domainId);
                return (
                  <div key={n.domainId} className="flex items-start gap-2.5">
                    <span className="text-sm mt-0.5">{domain?.icon}</span>
                    <p className="text-sm text-[#1A1715] italic flex-1 leading-relaxed">
                      &ldquo;{n.text}&rdquo;
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Environment */}
      {state.environment.length > 0 && (
        <div className="rounded-2xl border border-[#D4C9B5] bg-white/50 p-5 sm:p-6 mb-6">
          <h3 className="text-sm font-bold text-[#1A1715] mb-4">
            Auditoria de ambiente
          </h3>
          <div className="space-y-3">
            {state.environment.map((e, i) => (
              <div key={i} className="border-l-2 border-[#B8392E]/30 pl-3">
                <p className="text-[10px] text-[#8A7F75] mb-1 uppercase tracking-wide">
                  {e.question}
                </p>
                <p className="text-sm text-[#1A1715]">{e.answer}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SMART Goals */}
      {state.goals.length > 0 && (
        <div className="rounded-2xl border border-[#D4C9B5] bg-white/50 p-5 sm:p-6 mb-6">
          <h3 className="text-sm font-bold text-[#1A1715] mb-4">
            Suas metas
          </h3>
          <div className="space-y-4">
            {state.goals.map((g, i) => {
              const domain = DOMAINS.find((d) => d.id === g.linkedDomainId);
              return (
                <div
                  key={i}
                  className="rounded-xl bg-[#F5F0E6] border border-[#D4C9B5]/60 p-4"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-[#B8392E] flex items-center justify-center text-[10px] font-bold text-[#F5F0E6]">
                      {i + 1}
                    </div>
                    <span className="text-sm font-bold text-[#1A1715]">
                      {domain?.icon} {domain?.name}
                    </span>
                  </div>
                  {/* Meta montada em destaque */}
                  {g.goal && (
                    <p className="text-sm text-[#1A1715] leading-relaxed bg-[#B8392E]/5 border border-[#B8392E]/20 rounded-lg p-3 mb-3">
                      {g.goal}
                    </p>
                  )}
                  {/* Detalhes quebrados */}
                  <details className="group">
                    <summary className="text-[10px] font-bold uppercase tracking-widest text-[#8A7F75] cursor-pointer hover:text-[#B8392E] transition-colors select-none">
                      Ver detalhes SMART →
                    </summary>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs mt-3 pt-3 border-t border-[#D4C9B5]/40">
                      {g.specific && (
                        <div>
                          <dt className="font-bold text-[#B8392E] uppercase tracking-wide text-[9px]">Específica</dt>
                          <dd className="text-[#1A1715] mt-0.5">{g.specific}</dd>
                        </div>
                      )}
                      {g.measurable && (
                        <div>
                          <dt className="font-bold text-[#B8392E] uppercase tracking-wide text-[9px]">Mensurável</dt>
                          <dd className="text-[#1A1715] mt-0.5">{g.measurable}</dd>
                        </div>
                      )}
                      {g.achievable && (
                        <div>
                          <dt className="font-bold text-[#B8392E] uppercase tracking-wide text-[9px]">Atingível</dt>
                          <dd className="text-[#1A1715] mt-0.5">{g.achievable}</dd>
                        </div>
                      )}
                      {g.relevant && (
                        <div>
                          <dt className="font-bold text-[#B8392E] uppercase tracking-wide text-[9px]">Relevante</dt>
                          <dd className="text-[#1A1715] mt-0.5">{g.relevant}</dd>
                        </div>
                      )}
                      {g.timeBound && (
                        <div>
                          <dt className="font-bold text-[#B8392E] uppercase tracking-wide text-[9px]">Temporal</dt>
                          <dd className="text-[#1A1715] mt-0.5">{g.timeBound}</dd>
                        </div>
                      )}
                    </dl>
                  </details>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Export */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
        <a
          href="/plano"
          className="px-7 py-3.5 rounded-full bg-[#B8392E] text-[#F5F0E6] text-sm font-semibold tracking-wide hover:bg-[#8B2A22] transition-all shadow-sm text-center"
        >
          Criar plano de 12 semanas →
        </a>
        <button
          onClick={() => {
            const data = JSON.stringify(state, null, 2);
            const blob = new Blob([data], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `meus-valores-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
          className="px-5 py-2.5 rounded-full border border-[#D4C9B5] bg-[#F5F0E6] text-sm font-medium text-[#4A433D] hover:border-[#B8392E] hover:text-[#B8392E] transition-colors"
        >
          Exportar dados (JSON)
        </button>
        <button
          onClick={() => dispatch({ type: "RESET" })}
          className="px-5 py-2.5 rounded-full border border-[#D4C9B5] bg-[#F5F0E6] text-sm font-medium text-[#4A433D] hover:border-[#B8392E] hover:text-[#B8392E] transition-colors"
        >
          Refazer
        </button>
      </div>

      <div className="text-center mt-10 pt-6 border-t border-[#D4C9B5]/40">
        <p className="text-sm font-bold text-[#B8392E] tracking-wide">
          Voe alto e seja leve.
        </p>
        <p className="text-[10px] text-[#8A7F75] mt-1">
          Valores não são metas — são direções. Reaproveite este exercício a cada 3 meses.
        </p>
      </div>
    </div>
  );
}
