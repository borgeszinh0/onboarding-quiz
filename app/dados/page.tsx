"use client";

import { useRef, useState, useEffect } from "react";
import { useQuiz } from "@/lib/store";
import { use12WY } from "@/lib/12wy-store";
import { useDaily } from "@/lib/daily-store";
import { useAuth } from "@/lib/auth-context";
import {
  buildBackup,
  downloadBackup,
  parseBackup,
  listAutoBackups,
  readAutoBackup,
  type Backup,
} from "@/lib/backup";

export default function DadosPage() {
  const { state: quiz, dispatch: quizD } = useQuiz();
  const { state: plan, dispatch: planD } = use12WY();
  const { state: daily, dispatch: dailyD } = useDaily();
  const { user, configured } = useAuth();

  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [autoBackups, setAutoBackups] = useState<{ date: string; key: string }[]>([]);

  useEffect(() => setAutoBackups(listAutoBackups()), []);

  const restore = (b: Backup) => {
    quizD({ type: "HYDRATE", state: b.quiz });
    planD({ type: "HYDRATE", state: b.plan });
    dailyD({ type: "HYDRATE", state: b.daily });
    setMsg({ kind: "ok", text: "Dados restaurados com sucesso." });
  };

  const handleExport = () => {
    downloadBackup(buildBackup(quiz, plan, daily));
    setMsg({ kind: "ok", text: "Backup exportado." });
  };

  const handleImportFile = async (file: File) => {
    try {
      const b = parseBackup(await file.text());
      restore(b);
    } catch (e) {
      setMsg({
        kind: "err",
        text: e instanceof Error ? e.message : "Falha ao importar.",
      });
    }
  };

  const itemCount = daily.items.length;
  const tacticCount = plan.tactics.length;
  const goalCount = quiz.goals.length;

  return (
    <div className="bg-[#F5F0E6] text-[#1A1715]">
      <div className="max-w-2xl mx-auto px-5 py-8 sm:py-12 step-enter">
        <span className="text-[10px] font-mono font-bold tracking-widest text-[#B8392E]">
          DADOS
        </span>
        <h1 className="text-2xl font-bold mt-1 mb-6">Backup & sincronização</h1>

        {msg && (
          <div
            role="status"
            className={`rounded-xl px-4 py-3 text-sm mb-6 ${
              msg.kind === "ok"
                ? "bg-[#2D7A4E]/10 text-[#1A1715]"
                : "bg-[#B8392E]/10 text-[#B8392E]"
            }`}
          >
            {msg.text}
          </div>
        )}

        {/* Resumo */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { n: goalCount, l: "metas" },
            { n: tacticCount, l: "táticas" },
            { n: itemCount, l: "itens" },
          ].map((s) => (
            <div
              key={s.l}
              className="rounded-2xl border border-[#D4C9B5] bg-white/50 p-4 text-center"
            >
              <p className="text-2xl font-bold text-[#1A1715] tabular-nums">{s.n}</p>
              <p className="text-[10px] uppercase tracking-wide text-[#8A7F75]">
                {s.l}
              </p>
            </div>
          ))}
        </div>

        {/* Nuvem */}
        <div className="rounded-2xl border border-[#D4C9B5] bg-white/50 p-5 mb-6">
          <h2 className="text-sm font-bold mb-2">Nuvem</h2>
          {!configured ? (
            <p className="text-xs text-[#8A7F75] leading-relaxed">
              Backend não configurado. Use export/import abaixo para mover seus
              dados entre dispositivos.
            </p>
          ) : user ? (
            <p className="text-xs text-[#2D7A4E] leading-relaxed">
              ✓ Conectado como <strong>{user.email}</strong>. Seus dados
              sincronizam automaticamente.
            </p>
          ) : (
            <p className="text-xs text-[#8A7F75] leading-relaxed">
              Entre para sincronizar em todos os dispositivos.
            </p>
          )}
        </div>

        {/* Export / Import */}
        <div className="rounded-2xl border border-[#D4C9B5] bg-white/50 p-5 mb-6">
          <h2 className="text-sm font-bold mb-4">Arquivo local</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleExport}
              className="px-5 py-2.5 rounded-full bg-[#B8392E] text-[#F5F0E6] text-sm font-semibold hover:bg-[#8B2A22] transition-colors"
            >
              ↓ Exportar JSON
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="px-5 py-2.5 rounded-full border border-[#D4C9B5] text-sm font-semibold text-[#1A1715] hover:border-[#B8392E] transition-colors"
            >
              ↑ Importar JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleImportFile(f);
                e.target.value = "";
              }}
            />
          </div>
          <p className="text-[11px] text-[#8A7F75] mt-3 leading-relaxed">
            Importar substitui os dados atuais deste dispositivo.
          </p>
        </div>

        {/* Auto-backup */}
        {autoBackups.length > 0 && (
          <div className="rounded-2xl border border-[#D4C9B5] bg-white/50 p-5">
            <h2 className="text-sm font-bold mb-1">Backups automáticos</h2>
            <p className="text-[11px] text-[#8A7F75] mb-4">
              Snapshots salvos localmente (últimos 7 dias).
            </p>
            <div className="space-y-2">
              {autoBackups.map((b) => (
                <div
                  key={b.key}
                  className="flex items-center justify-between border-b border-[#D4C9B5]/40 pb-2 last:border-0"
                >
                  <span className="text-xs font-mono text-[#4A433D]">{b.date}</span>
                  <button
                    onClick={() => {
                      const bk = readAutoBackup(b.key);
                      if (bk) restore(bk);
                    }}
                    className="text-[11px] font-semibold text-[#B8392E] hover:text-[#8B2A22] transition-colors"
                  >
                    Restaurar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
