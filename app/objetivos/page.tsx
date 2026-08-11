"use client";

import { useState } from "react";
import { usePlanner, quarterKey, getActiveGoals } from "@/lib/planner-store";
import type { Goal, GoalStatus } from "@/lib/planner-types";
import { PageTitle, Card, Button, SectionLabel } from "@/components/apple/ui";
import { Link2, Plus, Check, X } from "lucide-react";

const STATUS_LABEL: Record<GoalStatus, string> = {
  active: "Ativa",
  paused: "Pausada",
  done: "Concluída",
  archived: "Arquivada",
};

function currentQuarterId(): string {
  const now = new Date();
  return quarterKey(
    now.getFullYear(),
    `Q${Math.floor(now.getMonth() / 3) + 1}` as "Q1" | "Q2" | "Q3" | "Q4"
  );
}

export default function ObjetivosPage() {
  const { state, dispatch } = usePlanner();
  const quarter = currentQuarterId();
  const goals = state.goals.filter((g) => g.quarter === quarter);
  const activeInQuarter = getActiveGoals(state).filter((g) => g.quarter === quarter);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  return (
    <main className="page-shell page-with-dock mx-auto w-full max-w-xl px-5">
      <PageTitle
        eyebrow="Objetivos"
        title={`Trimestre ${quarter}`}
        subtitle="No máximo 3 metas por trimestre. Uma meta só existe com um resultado mensurável — sem falar o que é 'ficar em dia', o app não tem como te cobrar."
      />

      <div className="space-y-6">
        {activeInQuarter.length === 0 && goals.length === 0 && (
          <Card className="p-5">
            <p className="a-subheadline text-label-secondary">
              Você ainda não definiu metas para este trimestre. Defina até 3 — é aqui
              que o Planner passa a ter um Norte.
            </p>
          </Card>
        )}

        {goals.length > 0 && (
          <section className="space-y-3">
            <SectionLabel>Metas deste trimestre</SectionLabel>
            {goals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                active={goal.status === "active"}
                editing={editingId === goal.id}
                onEdit={() => setEditingId(goal.id)}
                onCancelEdit={() => setEditingId(null)}
              />
            ))}
          </section>
        )}

        {creating ? (
          <GoalForm
            onDone={({ title, why, outcome }) => {
              dispatch({ type: "ADD_GOAL", title, why, outcome, quarter });
              setCreating(false);
            }}
            onCancel={() => setCreating(false)}
          />
        ) : (
          activeInQuarter.length < 3 && (
            <button
              type="button"
              onClick={() => setCreating(true)}
              className="a-btn a-btn-secondary w-full backdrop-blur-[18px] backdrop-brightness-[1.01] backdrop-saturate-[165%] backdrop-contrast-[1.08]"
            >
              <Plus size={18} />
              Nova meta
            </button>
          )
        )}
      </div>
    </main>
  );
}

function GoalCard({
  goal,
  active,
  editing,
  onEdit,
  onCancelEdit,
}: {
  goal: Goal;
  active: boolean;
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
}) {
  const { dispatch } = usePlanner();

  if (editing) {
    return (
      <GoalForm
        initial={{ title: goal.title, why: goal.why, outcome: goal.outcome }}
        submitLabel="Salvar"
        onDone={(next) => {
          dispatch({ type: "UPDATE_GOAL", id: goal.id, patch: next });
          onCancelEdit();
        }}
        onCancel={onCancelEdit}
      />
    );
  }

  return (
    <Card className="p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="a-headline text-label">{goal.title}</p>
          {goal.why && (
            <p className="a-caption mt-1 text-label-secondary">Por quê: {goal.why}</p>
          )}
        </div>
        <span
          className="a-caption shrink-0 rounded-full bg-fill-subtle px-3 py-1"
          style={{ color: active ? "var(--accent)" : "var(--label-secondary)" }}
        >
          {STATUS_LABEL[goal.status]}
        </span>
      </div>

      <div className="mb-4 rounded-xl bg-fill-subtle p-3">
        <p className="a-caption flex items-center gap-1.5 text-label-secondary">
          <Link2 size={14} />
          Resultado mensurável
        </p>
        <p className="a-subheadline mt-1 text-label">
          {goal.outcome || "Não definido."}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="a-caption min-h-[36px] rounded-lg bg-fill-subtle px-3 py-1.5 text-label"
        >
          Editar
        </button>
        {active ? (
          <>
            <button
              type="button"
              onClick={() =>
                dispatch({ type: "UPDATE_GOAL", id: goal.id, patch: { status: "done" } })
              }
              className="a-caption min-h-[36px] rounded-lg px-3 py-1.5 text-accent"
            >
              Concluir
            </button>
            <button
              type="button"
              onClick={() =>
                dispatch({ type: "UPDATE_GOAL", id: goal.id, patch: { status: "paused" } })
              }
              className="a-caption min-h-[36px] rounded-lg px-3 py-1.5 text-label-secondary"
            >
              Pausar
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() =>
              dispatch({ type: "UPDATE_GOAL", id: goal.id, patch: { status: "active" } })
            }
            className="a-caption min-h-[36px] rounded-lg px-3 py-1.5 text-accent"
          >
            Reativar
          </button>
        )}
      </div>
    </Card>
  );
}

function GoalForm({
  initial = { title: "", why: "", outcome: "" },
  submitLabel = "Criar meta",
  onDone,
  onCancel,
}: {
  initial?: { title: string; why: string; outcome: string };
  submitLabel?: string;
  onDone: (goal: { title: string; why: string; outcome: string }) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial.title);
  const [why, setWhy] = useState(initial.why);
  const [outcome, setOutcome] = useState(initial.outcome);
  const canSubmit = title.trim().length > 0;

  return (
    <Card className="p-5">
      <div className="space-y-4">
        <div>
          <label className="a-subheadline mb-1.5 block text-label-secondary">
            O que você quer conquistar?
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: Publicar a versão 1.0 do produto"
            className="a-subheadline w-full rounded-xl bg-fill-subtle px-4 py-3"
          />
        </div>
        <div>
          <label className="a-subheadline mb-1.5 block text-label-secondary">
            Por quê? (1 frase)
          </label>
          <input
            type="text"
            value={why}
            onChange={(e) => setWhy(e.target.value)}
            placeholder="Ex: Sair do projeto eterno e colocar algo no mundo"
            className="a-body w-full rounded-xl bg-fill-subtle px-4 py-3"
          />
        </div>
        <div>
          <label className="a-subheadline mb-1.5 block text-label-secondary">
            Resultado mensurável
          </label>
          <input
            type="text"
            value={outcome}
            onChange={(e) => setOutcome(e.target.value)}
            placeholder="Ex: 100 usuários cadastrados"
            className="a-body w-full rounded-xl bg-fill-subtle px-4 py-3"
          />
          <p className="a-caption mt-1 text-label-secondary">
            Como você sabe que conquistou? Números, datas, entregas — algo verificável.
          </p>
        </div>
        <div className="flex gap-2 pt-1">
          <Button onClick={() => canSubmit && onDone({ title: title.trim(), why: why.trim(), outcome: outcome.trim() })} disabled={!canSubmit}>
            <Check size={16} />
            {submitLabel}
          </Button>
          <Button variant="secondary" onClick={onCancel}>
            <X size={16} />
            Cancelar
          </Button>
        </div>
      </div>
    </Card>
  );
}