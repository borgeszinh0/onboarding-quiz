"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  Compass,
  Inbox,
  LayoutList,
  Map,
  MoonStar,
  Timer,
  Trophy,
} from "lucide-react";
import { Card, PageTitle } from "@/components/apple/ui";
import { getFirstStepsProgress, type FirstStepId } from "@/lib/first-steps";
import { todayISO, usePlanner } from "@/lib/planner-store";

const STEP_ICONS: Record<FirstStepId, React.ComponentType<{ size?: number }>> = {
  "day-mode": Compass,
  inbox: Inbox,
  funnel: LayoutList,
  timeblocks: Timer,
  habits: Trophy,
  "life-areas": Map,
  shutdown: MoonStar,
  review: CheckCircle2,
};

export default function PrimeirosPassosPage() {
  const { state, hydrated } = usePlanner();
  const date = todayISO();
  const { steps, done, total } = getFirstStepsProgress(state, date);
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const firstOpenStep = steps.find((step) => !step.done)?.id ?? steps[0]?.id;

  return (
    <main className="page-shell page-with-dock mx-auto w-full max-w-3xl px-5">
      <Link
        href="/mais"
        className="mb-8 inline-flex a-hit-44 items-center -ml-2 a-caption text-label-secondary hover-text-label"
      >
        ← Voltar
      </Link>

      <PageTitle
        eyebrow="Guia"
        title="Primeiros passos"
        subtitle="Aprenda o fluxo do Planner em poucos minutos."
      />

      <Card className="mb-5 p-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="a-caption text-label-secondary">Progresso</p>
            <p className="a-title-2 mt-1 text-label">
              {hydrated ? `${done}/${total} concluídos` : "Carregando"}
            </p>
          </div>
          <p className="a-caption tabular text-label-secondary">{percent}%</p>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--metric-track)]">
          <div
            className="h-full rounded-full bg-[var(--accent-2)] transition-[width] duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
        {done === total ? (
          <p className="a-subheadline mt-4 text-label-secondary">
            Fluxo básico concluído. Você já sabe usar o ciclo principal do
            Planner. Volte aqui quando quiser revisar a metodologia.
          </p>
        ) : state.tasks.length === 0 && state.dayLogs.length === 0 ? (
          <p className="a-subheadline mt-4 text-label-secondary">
            Comece escolhendo seu modo do dia.
          </p>
        ) : (
          <p className="a-subheadline mt-4 text-label-secondary">
            O app recomenda, você decide. Use a lista como orientação para
            montar um dia sustentável.
          </p>
        )}
      </Card>

      <section className="grid gap-3">
        {steps.map((step, index) => {
          const Icon = STEP_ICONS[step.id];
          return (
            <Card key={step.id} allowOverflow className="p-0">
              <details
                className="group"
                open={step.id === firstOpenStep}
              >
                <summary className="flex min-h-[72px] cursor-pointer list-none items-center gap-3 px-5 py-4">
                  <span
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border ${
                      step.done
                        ? "border-[rgba(34,197,94,.36)] bg-[rgba(34,197,94,.12)] text-[var(--success)]"
                        : "border-separator bg-fill-subtle text-label-secondary"
                    }`}
                    aria-hidden
                  >
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="a-caption block text-label-secondary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="a-headline block text-label">
                      {step.title}
                    </span>
                  </span>
                  <span className="text-label-secondary" aria-label={step.done ? "Concluído" : "Pendente"}>
                    {step.done ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                  </span>
                </summary>

                <div className="space-y-4 border-t border-separator px-5 pb-5 pt-4">
                  <StepText label="O que é" text={step.what} />
                  <StepText label="Por que importa" text={step.why} />
                  <StepText label="Como fazer" text={step.how} />
                  {step.example && (
                    <div className="rounded-2xl border border-separator bg-fill-subtle px-4 py-3">
                      <p className="a-caption text-label-secondary">Exemplo</p>
                      <p className="a-subheadline mt-1 text-label">{step.example}</p>
                    </div>
                  )}
                  <Link href={step.href} className="a-btn a-btn-secondary w-full">
                    {step.actionLabel}
                  </Link>
                </div>
              </details>
            </Card>
          );
        })}
      </section>
    </main>
  );
}

function StepText({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="a-caption text-label-secondary">{label}</p>
      <p className="a-subheadline mt-1 text-label">{text}</p>
    </div>
  );
}
