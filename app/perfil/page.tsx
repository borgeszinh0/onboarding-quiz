"use client";

import { useState } from "react";
import Link from "next/link";
import { usePlanner } from "@/lib/planner-store";
import { useAuth } from "@/lib/auth-context";
import { Card, Button } from "@/components/apple/ui";
import { LifeAreasPanel } from "@/components/planner/LifeAreasPanel";
import { Trophy, CheckCircle2, Timer, UserCircle2 } from "lucide-react";

export default function PerfilPage() {
  const { state } = usePlanner();
  const { user, signOut, configured, signIn, signUp } = useAuth();

  // Métricas
  const tasksDone = state.tasks.filter((t) => t.status === "done").length;
  const habitsDone = state.habitLogs.filter((l) => l.done).length;
  const focusMs = state.focusSessions.reduce((acc, s) => acc + s.elapsedMs, 0);
  const focusHours = Math.floor(focusMs / (1000 * 60 * 60));
  const focusMins = Math.floor((focusMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <main className="page-with-bottom-dock mx-auto w-full max-w-5xl px-5 pt-8">
      <div className="mx-auto w-full max-w-xl">
        <Link href="/mais" className="mb-8 inline-flex a-hit-44 items-center -ml-2 a-caption text-label-secondary hover-text-label">
        ← Voltar
        </Link>

        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gemini text-white shadow-lg">
            <UserCircle2 size={48} />
          </div>
          <h1 className="a-title-2 text-label">Seu Perfil</h1>
          {user ? (
            <p className="a-subheadline text-label-secondary">{user.email}</p>
          ) : (
            <p className="a-subheadline text-label-secondary">Visitante (Offline)</p>
          )}
        </div>

        <section className="mb-8">
          <h2 className="a-headline mb-4 text-label">Estatísticas Vitalícias</h2>
          <div className="grid grid-cols-2 gap-4">
            <Card className="flex flex-col items-center justify-center p-5 text-center">
              <CheckCircle2 size={28} className="mb-2 text-accent" />
              <span className="a-large-title tabular">{tasksDone}</span>
              <span className="a-caption text-label-secondary">Tarefas Concluídas</span>
            </Card>
            
            <Card className="flex flex-col items-center justify-center p-5 text-center">
              <Trophy size={28} className="mb-2 text-[#fbbc04]" />
              <span className="a-large-title tabular">{habitsDone}</span>
              <span className="a-caption text-label-secondary">Hábitos Marcados</span>
            </Card>

            <Card className="col-span-2 flex flex-col items-center justify-center p-5 text-center">
              <Timer size={28} className="mb-2 text-[#9b72cb]" />
              <span className="a-large-title tabular">
                {focusHours > 0 ? `${focusHours}h ${focusMins}m` : `${focusMins}m`}
              </span>
              <span className="a-caption text-label-secondary">Tempo em Foco Profundo</span>
            </Card>
          </div>
        </section>
      </div>

      <section className="mb-8">
        <LifeAreasPanel state={state} />
      </section>

      <section className="mx-auto w-full max-w-xl">
        <h2 className="a-headline mb-4 text-label">Conta e Sincronização</h2>
        <Card className="p-5">
          {!configured ? (
            <p className="a-subheadline text-label-secondary text-center">
              A sincronização em nuvem não está configurada neste ambiente.
            </p>
          ) : user ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="a-subheadline text-label-secondary">
                Seus dados estão sincronizando com a nuvem em tempo real.
              </p>
              <Button variant="secondary" onClick={signOut} className="w-full">
                Sair da Conta
              </Button>
            </div>
          ) : (
            <InlineAuthForm signIn={signIn} signUp={signUp} />
          )}
        </Card>
      </section>
    </main>
  );
}

function InlineAuthForm({
  signIn,
  signUp,
}: {
  signIn: ReturnType<typeof useAuth>["signIn"];
  signUp: ReturnType<typeof useAuth>["signUp"];
}) {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email.trim() || password.length < 6) {
      setError("Informe e-mail e senha com no mínimo 6 caracteres.");
      return;
    }

    setLoading(true);
    setError(null);
    setNotice(null);
    const result =
      mode === "in"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
    setLoading(false);

    if (result.error) {
      setError(translateAuthError(result.error));
      return;
    }
    if (mode === "up" && "needsConfirmation" in result && result.needsConfirmation) {
      setNotice("Conta criada. Confirme seu e-mail para ativar a sincronização.");
      return;
    }
    setNotice("Conta conectada. Seus dados vão sincronizar automaticamente.");
  };

  return (
    <div className="space-y-4">
      <div>
        <p className="a-subheadline text-label">
          {mode === "in" ? "Entrar na sua conta" : "Criar conta"}
        </p>
        <p className="a-caption mt-1 text-label-secondary">
          Sincronize tarefas, hábitos, métricas e agenda em outros dispositivos.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-3">
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="seu@email.com"
          aria-label="E-mail"
          className="a-subheadline min-h-[44px] w-full rounded-xl border border-separator bg-fill-subtle px-4 text-label outline-none transition-colors focus:border-[var(--accent)]"
        />
        <input
          type="password"
          required
          minLength={6}
          autoComplete={mode === "in" ? "current-password" : "new-password"}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Senha (mín. 6)"
          aria-label="Senha"
          className="a-subheadline min-h-[44px] w-full rounded-xl border border-separator bg-fill-subtle px-4 text-label outline-none transition-colors focus:border-[var(--accent)]"
        />

        {error && (
          <p className="a-caption text-danger" role="alert">
            {error}
          </p>
        )}
        {notice && (
          <p className="a-caption rounded-xl border border-separator bg-fill-subtle p-3 text-label-secondary" role="status">
            {notice}
          </p>
        )}

        <Button type="submit" full disabled={loading}>
          {loading ? "Aguarde..." : mode === "in" ? "Entrar" : "Criar conta"}
        </Button>
      </form>

      <p className="a-caption text-center text-label-secondary">
        {mode === "in" ? "Ainda não tem conta?" : "Já tem conta?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "in" ? "up" : "in");
            setError(null);
            setNotice(null);
          }}
          className="a-hit-44 text-accent"
        >
          {mode === "in" ? "Criar conta" : "Entrar"}
        </button>
      </p>
    </div>
  );
}

function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes("invalid login")) return "E-mail ou senha incorretos.";
  if (normalized.includes("already registered") || normalized.includes("already been")) {
    return "Este e-mail já tem conta. Faça login.";
  }
  if (normalized.includes("password")) return "Senha inválida. Use no mínimo 6 caracteres.";
  return message;
}
