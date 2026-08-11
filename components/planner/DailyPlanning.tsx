"use client";

import { useState } from "react";
import { usePlanner } from "@/lib/planner-store";
import { Card } from "@/components/apple/ui";
import { DAY_MODE_RULES, type DayMode } from "@/lib/day-mode";
import { Check, Pencil, X } from "lucide-react";

const DAY_OPTIONS: Array<{
  mode: DayMode;
  description: string;
  consequence: string;
}> = [
  {
    mode: "focus",
    description: "A tarefa grande vem primeiro, com foco protegido.",
    consequence: "Hoje o app sugere durações longas e protege o bloco principal.",
  },
  {
    mode: "maintenance",
    description: "Pendências, revisão e blocos curtos.",
    consequence: "Hoje o app sugere durações curtas e não trava o dia em uma tarefa grande.",
  },
];

export function DailyPlanning({ date }: { date: string }) {
  const { state, dispatch } = usePlanner();
  const [intention, setIntention] = useState("");
  const [mode, setMode] = useState<DayMode | undefined>(undefined);
  const [modeEditing, setModeEditing] = useState(false);

  const dayLog = state.dayLogs.find((l) => l.date === date);
  const isPlanned = !!dayLog?.plannedAt;
  const selectedMode = mode ?? (dayLog as { mode?: DayMode; energy?: DayMode } | undefined)?.mode ?? (dayLog as { energy?: DayMode } | undefined)?.energy;
  const showModeSelector = modeEditing || !selectedMode;

  const saveMode = (next: DayMode) => {
    setMode(next);
    setModeEditing(false);
    dispatch({
      type: "PLAN_DAY",
      date,
      payload: {
        intention: dayLog?.intention,
        mode: next,
        energy: next,
      },
    });
  };

  if (isPlanned) {
    return (
      <section className="mb-6">
        <Card className="p-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="a-subheadline text-label-secondary">Tipo do dia</p>
            {!showModeSelector && (
              <button
                type="button"
                onClick={() => setModeEditing(true)}
                className="a-caption min-h-[44px] rounded-full px-3 text-accent transition-colors hover-bg-fill-subtle"
              >
                Alterar
              </button>
            )}
          </div>
          {showModeSelector && (
            <DayModeSelector selectedMode={selectedMode} onSelect={saveMode} />
          )}
          <PlannedIntentionEditor
            key={`${date}:${dayLog?.intention ?? ""}`}
            intention={dayLog?.intention ?? ""}
            onSave={(nextIntention) => {
              dispatch({
                type: "PLAN_DAY",
                date,
                payload: {
                  intention: nextIntention.trim() || undefined,
                  mode: selectedMode,
                  energy: selectedMode,
                },
              });
            }}
          />
        </Card>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <Card className="p-5">
        <h2 className="a-headline mb-4 text-label">Planejar hoje</h2>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="intention"
              className="a-subheadline mb-1.5 block text-label-secondary"
            >
              Qual a intenção principal?
            </label>
            <input
              id="intention"
              type="text"
              value={intention}
              onChange={(e) => setIntention(e.target.value)}
              placeholder="Ex: Focar na v1.0"
              className="a-body w-full rounded-xl bg-fill-subtle px-4 py-3"
            />
          </div>
          <DayModeSelector selectedMode={mode} onSelect={setMode} />
          <div className="mt-6 flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() =>
                dispatch({ type: "PLAN_DAY", date, payload: { intention, mode, energy: mode } })
              }
              className="a-btn a-btn-primary w-full min-h-[50px]"
            >
              Começar o dia
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "PLAN_DAY", date, payload: {} })}
              className="a-btn a-btn-secondary w-full backdrop-blur-[18px] backdrop-brightness-[1.01] backdrop-saturate-[165%] backdrop-contrast-[1.08]"
            >
              Pular
            </button>
          </div>
        </div>
      </Card>
    </section>
  );
}

function PlannedIntentionEditor({
  intention,
  onSave,
}: {
  intention: string;
  onSave: (intention: string) => void;
}) {
  const [draft, setDraft] = useState(intention);
  const [editing, setEditing] = useState(false);

  const save = () => {
    onSave(draft);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(intention);
    setEditing(false);
  };

  return (
    <div className="mb-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="a-subheadline text-label-secondary">Intenção do dia</p>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            aria-label={intention ? "Editar intenção do dia" : "Adicionar intenção do dia"}
            className="a-hit-44 flex shrink-0 items-center justify-center rounded-full text-label-secondary transition-colors hover-bg-fill-subtle"
          >
            <Pencil size={18} />
          </button>
        )}
      </div>

      {editing ? (
        <div className="space-y-2">
          <input
            id="planned-intention"
            type="text"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") save();
              if (event.key === "Escape") cancel();
            }}
            placeholder="Ex: Focar na v1.0"
            className="a-body min-h-[44px] w-full rounded-xl bg-fill-subtle px-4 py-3"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={save}
              className="a-btn a-btn-primary min-h-[44px] flex-1"
            >
              <Check size={18} />
              Salvar
            </button>
            <button
              type="button"
              onClick={cancel}
              className="a-btn a-btn-secondary min-h-[44px] flex-1 backdrop-blur-[18px] backdrop-brightness-[1.01] backdrop-saturate-[165%] backdrop-contrast-[1.08]"
            >
              <X size={18} />
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <p className="a-body text-label">
          {intention ? `“${intention}”` : "Nenhuma intenção definida."}
        </p>
      )}
    </div>
  );
}

function DayModeSelector({
  selectedMode,
  onSelect,
}: {
  selectedMode?: DayMode;
  onSelect: (mode: DayMode) => void;
}) {
  return (
    <div className="mb-4">
      <span className="a-subheadline mb-1 block text-label">Tipo do dia</span>
      <div className="grid grid-cols-2 gap-2.5">
        {DAY_OPTIONS.map((option) => {
          const selected = selectedMode === option.mode;
          return (
            <button
              key={option.mode}
              type="button"
              onClick={() => onSelect(option.mode)}
              aria-pressed={selected}
              className="min-h-[88px] rounded-[18px] border p-3.5 text-left transition-colors duration-200"
              style={{
                borderColor: selected
                  ? "color-mix(in oklab, var(--accent) 42%, transparent)"
                  : "var(--separator)",
                background: selected ? "var(--fill-subtle)" : "transparent",
              }}
            >
              <p className="a-subheadline text-label">{DAY_MODE_RULES[option.mode].label}</p>
              <p className="a-caption mt-1 text-label-secondary">{option.description}</p>
            </button>
          );
        })}
      </div>
      {selectedMode && (
        <p className="mt-2 text-[13px] leading-[18px] text-label-secondary">
          {DAY_OPTIONS.find((o) => o.mode === selectedMode)?.consequence}
        </p>
      )}
    </div>
  );
}