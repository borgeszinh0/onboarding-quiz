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
    <main className="page-with-bottom-dock mx-auto w-full max-w-xl px-5 pt-8">
      <PageTitle eyebrow="Dados" title="Backup e sincronização" />

      {msg && (
        <div
          role="status"
          className="a-subheadline mb-6 rounded-2xl px-4 py-3"
          style={{
            background: "var(--fill-subtle)",
            color: msg.kind === "ok" ? "var(--label)" : "var(--danger-text)",
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
            <p className="a-title-2 tabular">
              {hydrated ? s.n : "—"}
            </p>
            <p className="a-caption text-label-secondary">{s.l}</p>
          </Card>
        ))}
      </div>

      <section className="mb-6">
        <SectionLabel>Nuvem</SectionLabel>
        <Card className="mt-3 p-5">
          {!configured ? (
            <p className="a-subheadline text-label-secondary">
              Backend não configurado. Use exportar e importar abaixo para mover
              seus dados entre dispositivos.
            </p>
          ) : user ? (
            <p className="a-subheadline">
              Conectado como <strong>{user.email}</strong>. Seus dados sincronizam
              automaticamente.
            </p>
          ) : (
            <p className="a-subheadline text-label-secondary">
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
          <p className="a-caption mt-3 text-label-secondary">
            Importar substitui os dados atuais deste dispositivo.
          </p>
        </Card>
      </section>

      {autoBackups.length > 0 && (
        <section>
          <SectionLabel>Backups automáticos</SectionLabel>
          <Card className="mt-3 p-5">
            <p className="a-caption mb-4 text-label-secondary">
              Snapshots salvos localmente, últimos 7 dias.
            </p>
            <ul className="divide-y divide-separator">
              {autoBackups.map((b) => (
                <li
                  key={b.key}
                  className="flex min-h-[44px] items-center justify-between gap-3"
                >
                  <span className="a-subheadline tabular">{b.date}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const bk = readAutoBackup(b.key);
                      if (bk) restore(bk);
                    }}
                    className="a-subheadline a-hit-44 text-accent"
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
