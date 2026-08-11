"use client";

import { ChangeEvent, useRef, useState } from "react";
import Link from "next/link";
import { usePlanner } from "@/lib/planner-store";
import { useAuth } from "@/lib/auth-context";
import { useUserProfile } from "@/lib/user-profile";
import { Card, Button } from "@/components/apple/ui";
import { getActiveGoals, quarterKey, getGoalDelivery } from "@/lib/planner-store";
import { Camera, Target, UserCircle2 } from "lucide-react";

export default function PerfilPage() {
  const { state } = usePlanner();
  const { user, signOut, configured, signIn, signUp } = useAuth();
  const profileState = useUserProfile(user);

  const now = new Date();
  const currentQuarter = quarterKey(
    now.getFullYear(),
    `Q${Math.floor(now.getMonth() / 3) + 1}` as "Q1" | "Q2" | "Q3" | "Q4"
  );
  const goals = getActiveGoals(state).filter((g) => g.quarter === currentQuarter);
  const delivery = goals.map((goal) => getGoalDelivery(state, goal.id));
  const delivered = delivery.reduce((sum, d) => sum + d.delivered, 0);
  const committed = delivery.reduce((sum, d) => sum + d.committed, 0);
  const deliveryRate = committed > 0 ? Math.round((delivered / committed) * 100) : null;

  return (
    <main className="page-shell page-with-dock mx-auto w-full max-w-5xl px-5">
      <div className="mx-auto w-full max-w-xl">
        <Link href="/mais" className="mb-8 inline-flex a-hit-44 items-center -ml-2 a-caption text-label-secondary hover-text-label">
        ← Voltar
        </Link>

        <div className="mb-8 flex flex-col items-center">
          <ProfileAvatar
            user={user}
            avatarUrl={profileState.profile?.avatarUrl ?? null}
            saving={profileState.saving}
            onUpload={profileState.uploadAvatar}
          />
          <h1 className="a-title-2 text-label">
            {profileState.profile?.displayName || "Seu Perfil"}
          </h1>
          {user ? (
            <p className="a-subheadline text-label-secondary">{user.email}</p>
          ) : (
            <p className="a-subheadline text-label-secondary">Visitante (Offline)</p>
          )}
        </div>

        <section className="mb-8">
          <h2 className="a-headline mb-4 text-label">Metas do trimestre</h2>
          {goals.length === 0 ? (
            <Card className="p-5">
              <p className="a-subheadline text-label-secondary">
                Nenhuma meta ativa neste trimestre. Defina suas metas em Objetivos.
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              <Card className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <Target size={22} className="text-accent" />
                  <div>
                    <p className="a-subheadline text-label">Taxa de entrega</p>
                    <p className="a-caption text-label-secondary">
                      Pedras da semana concluídas vs. comprometidas
                    </p>
                  </div>
                </div>
                <span className="a-large-title tabular text-accent">
                  {deliveryRate === null ? "—" : `${deliveryRate}%`}
                </span>
              </Card>
              {goals.map((goal) => (
                <Card key={goal.id} className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="a-subheadline text-label">{goal.title}</p>
                      <p className="a-caption mt-1 text-label-secondary">
                        {goal.outcome || "Sem resultado mensurável definido."}
                      </p>
                    </div>
                    <span className="a-caption rounded-full bg-fill-subtle px-3 py-1 text-label-secondary">
                      Ativa
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
        </div>

      <section className="mx-auto w-full max-w-xl">
        <h2 className="a-headline mb-4 text-label">Conta e Sincronização</h2>
        <Card className="p-5">
          {user ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <ProfileNameForm
                key={profileState.profile?.displayName ?? "empty-profile-name"}
                initialName={profileState.profile?.displayName ?? ""}
                loading={profileState.loading}
                saving={profileState.saving}
                onSave={profileState.updateDisplayName}
              />
              {profileState.error && !profileState.profile && (
                <p className="a-caption w-full rounded-xl border border-[rgba(244,63,94,.28)] bg-[rgba(244,63,94,.08)] p-3 text-danger" role="alert">
                  {profileState.error}
                </p>
              )}
              <p className="a-subheadline text-label-secondary">
                Seus dados estão sincronizando com a nuvem em tempo real.
              </p>
              <Button variant="secondary" onClick={signOut} className="w-full">
                Sair da Conta
              </Button>
            </div>
          ) : (
            <InlineAuthForm
              configured={configured}
              signIn={signIn}
              signUp={signUp}
            />
          )}
        </Card>
      </section>
    </main>
  );
}

function ProfileAvatar({
  user,
  avatarUrl,
  saving,
  onUpload,
}: {
  user: ReturnType<typeof useAuth>["user"];
  avatarUrl: string | null;
  saving: boolean;
  onUpload: (file: File) => Promise<{ error: string | null }>;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setError(null);
    const result = await onUpload(file);
    if (result.error) setError(result.error);
  };

  return (
    <div className="mb-4 flex flex-col items-center gap-3">
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-gemini text-white shadow-lg ring-1 ring-[var(--glass-border-strong)]">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatarUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <UserCircle2 size={48} />
          )}
        </div>
        {user && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={handleFile}
            />
            <button
              type="button"
              disabled={saving}
              onClick={() => inputRef.current?.click()}
              className="a-hit-44 absolute -bottom-1 -right-1 inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--glass-border-strong)] bg-[rgba(12,12,16,.86)] text-label shadow-lg transition-opacity disabled:opacity-50"
              aria-label="Alterar foto do perfil"
              title="Alterar foto"
            >
              <Camera size={18} />
            </button>
          </>
        )}
      </div>
      {error && (
        <p className="a-caption max-w-xs text-center text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function ProfileNameForm({
  initialName,
  loading,
  saving,
  onSave,
}: {
  initialName: string;
  loading: boolean;
  saving: boolean;
  onSave: (displayName: string) => Promise<{ error: string | null }>;
}) {
  const [name, setName] = useState(initialName);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setNotice(null);
    setError(null);
    const result = await onSave(name);
    if (result.error) {
      setError(result.error);
      return;
    }
    setNotice("Perfil atualizado.");
  };

  return (
    <form onSubmit={submit} className="w-full space-y-3 text-left">
      <div>
        <label htmlFor="displayName" className="a-caption text-label-secondary">
          Nome de perfil
        </label>
        <input
          id="displayName"
          type="text"
          maxLength={80}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder={loading ? "Carregando..." : "Como você quer aparecer"}
          className="a-subheadline mt-2 min-h-[44px] w-full rounded-xl border border-separator bg-fill-subtle px-4 text-label outline-none transition-colors focus:border-[var(--accent)]"
        />
      </div>
      {error && (
        <p className="a-caption text-danger" role="alert">
          {error}
        </p>
      )}
      {notice && (
        <p className="a-caption text-label-secondary" role="status">
          {notice}
        </p>
      )}
      <Button type="submit" variant="secondary" full disabled={saving || loading}>
        {saving ? "Salvando..." : "Salvar Perfil"}
      </Button>
    </form>
  );
}

function InlineAuthForm({
  configured,
  signIn,
  signUp,
}: {
  configured: boolean;
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
      {!configured && (
        <p className="a-caption rounded-xl border border-separator bg-fill-subtle p-3 text-label-secondary" role="status">
          A sincronização em nuvem ainda não está configurada neste ambiente.
        </p>
      )}
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
