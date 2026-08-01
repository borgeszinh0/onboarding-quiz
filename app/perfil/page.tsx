"use client";

import Link from "next/link";
import { usePlanner } from "@/lib/planner-store";
import { useAuth } from "@/lib/auth-context";
import { PageTitle, Card, Button } from "@/components/apple/ui";
import { Trophy, CheckCircle2, Timer, UserCircle2 } from "lucide-react";

export default function PerfilPage() {
  const { state } = usePlanner();
  const { user, signOut, configured } = useAuth();

  // Métricas
  const tasksDone = state.tasks.filter((t) => t.status === "done").length;
  const habitsDone = state.habitLogs.filter((l) => l.done).length;
  const focusMs = state.focusSessions.reduce((acc, s) => acc + s.elapsedMs, 0);
  const focusHours = Math.floor(focusMs / (1000 * 60 * 60));
  const focusMins = Math.floor((focusMs % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <main className="mx-auto w-full max-w-xl px-5 pb-32 pt-8">
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

      <section>
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
            <div className="flex flex-col items-center gap-4 text-center">
              <p className="a-subheadline text-label-secondary">
                Crie uma conta para salvar suas métricas na nuvem e sincronizar em outros dispositivos.
              </p>
              <Link href="/login" className="w-full">
                <Button className="w-full">Criar Conta ou Entrar</Button>
              </Link>
            </div>
          )}
        </Card>
      </section>
    </main>
  );
}
