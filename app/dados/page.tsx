"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { usePlanner } from "@/lib/planner-store";
import { useAuth } from "@/lib/auth-context";
import {
  buildBackup,
  downloadBackup,
  parseBackup,
  listAutoBackups,
  readAutoBackup,
  type Backup,
} from "@/lib/backup";
import { Button, Card, PageTitle, SectionLabel } from "@/components/apple/ui";

type AutoBackupEntry = { date: string; key: string };

/** localStorage é store externo — ler durante o render seria impuro. */
function useAutoBackups(version: number): AutoBackupEntry[] {
  const cache = useRef<AutoBackupEntry[]>([]);
  const cachedVersion = useRef(-1);

  const subscribe = useCallback((onChange: () => void) => {
    onChange();
    return () => {};
  }, []);

  return useSyncExternalStore(
    subscribe,
    () => {
      if (cachedVersion.current !== version) {
        cache.current = listAutoBackups();
        cachedVersion.current = version;
      }
      return cache.current;
    },
    () => cache.current
  );
}

export default function DadosPage() {
  const { state: planner, dispatch, hydrated } = usePlanner();
  const { user, configured } = useAuth();

  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const [backupsVersion, setBackupsVersion] = useState(0);
  const autoBackups = useAutoBackups(backupsVersion);

  const restore = (b: Backup) => {
    dispatch({ type: "HYDRATE", state: b.planner });
    setMsg({ kind: "ok", text: "Dados restaurados com sucesso." });
  };

  const handleExport = () => {
    downloadBackup(buildBackup(planner));
    setBackupsVersion((v) => v + 1);
    setMsg({ kind: "ok", text: "Backup exportado." });
  };

  const handleImportFile = async (file: File) => {
    try {
      restore(parseBackup(await file.text()));
    } catch (e) {
      setMsg({
        kind: "err",
        text: e instanceof Error ? e.message : "Falha ao importar.",
      });
    }
  };

  const taskCount = planner.tasks.length;
  const habitCount = planner.habits.length;
  const blockCount = planner.timeBlocks.length;

  return (
    <main className="mx-auto w-full max-w-xl px-5 pb-20 pt-8">
      <PageTitle eyebrow="Dados" title="Backup e sincronização" />

      {msg && (
        <div
          role="status"
          className="mb-6 rounded-2xl px-4 py-3 text-[15px]"
          style={{
            background: "var(--fill-subtle)",
            color: msg.kind === "ok" ? "var(--label)" : "var(--color-danger)",
          }}
        >
          {msg.text}
        </div>
      )}

      <div className="mb-8 grid grid-cols-3 gap-3">
        {[
          { n: taskCount, l: "tarefas" },
          { n: blockCount, l: "blocos" },
          { n: habitCount, l: "hábitos" },
        ].map((s) => (
          <Card key={s.l} className="p-4 text-center">
            <p className="tabular text-[28px] font-semibold">
              {hydrated ? s.n : "—"}
            </p>
            <p className="text-[13px] text-[color:var(--label-secondary)]">{s.l}</p>
          </Card>
        ))}
      </div>

      <section className="mb-6">
        <SectionLabel>Nuvem</SectionLabel>
        <Card className="mt-3 p-5">
          {!configured ? (
            <p className="text-[15px] leading-relaxed text-[color:var(--label-secondary)]">
              Backend não configurado. Use exportar e importar abaixo para mover
              seus dados entre dispositivos.
            </p>
          ) : user ? (
            <p className="text-[15px] leading-relaxed">
              Conectado como <strong>{user.email}</strong>. Seus dados sincronizam
              automaticamente.
            </p>
          ) : (
            <p className="text-[15px] leading-relaxed text-[color:var(--label-secondary)]">
              Entre para sincronizar em todos os dispositivos.
            </p>
          )}
        </Card>
      </section>

      <section className="mb-6">
        <SectionLabel>Arquivo local</SectionLabel>
        <Card className="mt-3 p-5">
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleExport}>Exportar JSON</Button>
            <Button variant="secondary" onClick={() => fileRef.current?.click()}>
              Importar JSON
            </Button>
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
          <p className="mt-3 text-[13px] leading-relaxed text-[color:var(--label-secondary)]">
            Importar substitui os dados atuais deste dispositivo.
          </p>
        </Card>
      </section>

      {autoBackups.length > 0 && (
        <section>
          <SectionLabel>Backups automáticos</SectionLabel>
          <Card className="mt-3 p-5">
            <p className="mb-4 text-[13px] text-[color:var(--label-secondary)]">
              Snapshots salvos localmente, últimos 7 dias.
            </p>
            <ul className="divide-y divide-[color:var(--separator)]">
              {autoBackups.map((b) => (
                <li
                  key={b.key}
                  className="flex min-h-[44px] items-center justify-between gap-3"
                >
                  <span className="tabular text-[15px]">{b.date}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const bk = readAutoBackup(b.key);
                      if (bk) restore(bk);
                    }}
                    className="text-[15px] font-medium text-[color:var(--accent-text)]"
                  >
                    Restaurar
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      )}
    </main>
  );
}
