import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#F5F0E6] text-[#1A1715] flex items-center justify-center px-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Cover */}
        <div className="text-center mb-14">
          <div className="w-20 h-20 rounded-full bg-[#B8392E] mx-auto mb-6 flex items-center justify-center shadow-lg">
            <span className="text-3xl">🧭</span>
          </div>

          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[#8A7F75] mb-3">
            Onboarding
          </p>

          <h1 className="text-4xl sm:text-5xl font-bold leading-[1.1] mb-4">
            Antes das metas,
            <br />
            <span className="text-[#B8392E]">os valores.</span>
          </h1>

          <p className="text-[#4A433D] max-w-md mx-auto leading-relaxed">
            Um quiz interativo que mapeia seus valores, audita seu ambiente e
            constrói metas SMART que se sustentam no tempo.
          </p>
        </div>

        {/* Feature list */}
        <div className="grid sm:grid-cols-2 gap-3 mb-12">
          {[
            { n: "01", label: "Avaliação quantitativa", desc: "12 domínios × 6 dimensões" },
            { n: "02", label: "Reflexão guiada", desc: "Texto livre nos top 5 domínios" },
            { n: "03", label: "Auditoria de ambiente", desc: "Identifique sabotadores" },
            { n: "04", label: "Metas SMART", desc: "Construídas sobre valores reais" },
          ].map((f) => (
            <div
              key={f.n}
              className="rounded-2xl border border-[#D4C9B5] bg-white/40 p-4"
            >
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-[#B8392E]">
                  {f.n}
                </span>
                <h3 className="text-sm font-bold text-[#1A1715]">{f.label}</h3>
              </div>
              <p className="text-xs text-[#8A7F75]">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/quiz"
            className="inline-block px-8 py-4 rounded-full bg-[#B8392E] text-[#F5F0E6] font-semibold tracking-wide hover:bg-[#8B2A22] transition-all shadow-md hover:shadow-lg"
          >
            Começar onboarding →
          </Link>
        </div>

        <p className="text-center text-[10px] tracking-wide text-[#8A7F75] mt-10">
          Baseado na metodologia ACT • ~10 minutos
        </p>
      </div>
    </main>
  );
}
