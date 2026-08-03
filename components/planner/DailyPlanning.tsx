"use client";

import { useState } from "react";
import { usePlanner } from "@/lib/planner-store";
import { Card } from "@/components/apple/ui";
import { DAY_MODE_RULES, type DayMode } from "@/lib/day-mode";
import { Check, Pencil, X } from "lucide-react";

const ENERGY_OPTIONS: Record<
  DayMode,
  {
    label: string;
    mode: string;
    description: string;
    className: string;
    consequence: string;
  }
> = {
  low: {
    label: DAY_MODE_RULES.low.label,
    mode: DAY_MODE_RULES.low.strategy,
    description: "Pendências leves, revisão e tarefas pequenas.",
    className: "energy-option-low",
    consequence: "Hoje o app vai favorecer tarefas pequenas e blocos curtos.",
  },
  medium: {
    label: DAY_MODE_RULES.medium.label,
    mode: DAY_MODE_RULES.medium.strategy,
    description: "Médias importantes e uma rotina bem protegida.",
    className: "energy-option-medium",
    consequence: "Hoje o app vai favorecer tarefas médias e rotina protegida.",
  },
  high: {
    label: DAY_MODE_RULES.high.label,
    mode: DAY_MODE_RULES.high.strategy,
    description: "Trabalho profundo, tarefa grande e decisões difíceis.",
    className: "energy-option-high",
    consequence: "Hoje o app vai favorecer uma tarefa grande com foco protegido.",
  },
};

export function DailyPlanning({ date }: { date: string }) {
  const { state, dispatch } = usePlanner();
  const [intention, setIntention] = useState("");
  const [energy, setEnergy] = useState<DayMode | undefined>();
  const [modeEditing, setModeEditing] = useState(false);

  const dayLog = state.dayLogs.find((l) => l.date === date);
  const isPlanned = !!dayLog?.plannedAt;
  const selectedEnergy = energy ?? dayLog?.mode ?? dayLog?.energy;
  const showModeSelector = modeEditing || !selectedEnergy;

  if (isPlanned) {
    return (
      <section className="mb-6">
        <Card className="p-5">
          <PlannedDayModeSummary
            selectedEnergy={selectedEnergy}
            editing={showModeSelector}
            onEdit={() => setModeEditing(true)}
          />
          {showModeSelector && (
            <div className="mb-5">
              <DayModeSelector
                selectedEnergy={selectedEnergy}
                onSelect={(level) => {
                  setEnergy(level);
                  setModeEditing(false);
                  dispatch({
                    type: "PLAN_DAY",
                    date,
                    payload: {
                      intention: dayLog.intention,
                      mode: level,
                      energy: level,
                    },
                  });
                }}
              />
            </div>
          )}
          <PlannedIntentionEditor
            key={`${date}:${dayLog.intention ?? ""}`}
            intention={dayLog.intention ?? ""}
            onSave={(nextIntention) => {
              dispatch({
                type: "PLAN_DAY",
                date,
                payload: {
                  intention: nextIntention.trim() || undefined,
                  mode: selectedEnergy,
                  energy: selectedEnergy,
                },
              });
            }}
          />
        </Card>
      </section>
    );
  }

  const handlePlan = () => {
    dispatch({ type: "PLAN_DAY", date, payload: { intention, mode: energy, energy } });
  };

  const handleSkip = () => {
    dispatch({ type: "PLAN_DAY", date, payload: {} });
  };

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
              placeholder="Ex: Focar apenas no lançamento"
              className="a-body w-full rounded-xl bg-fill-subtle px-4 py-3"
            />
          </div>
          <DayModeSelector
            selectedEnergy={selectedEnergy}
            onSelect={setEnergy}
          />
          <div className="mt-6 flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={handlePlan}
              className="a-btn a-btn-primary w-full min-h-[50px]"
            >
              Começar o dia
            </button>
            <button
              type="button"
              onClick={handleSkip}
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
            placeholder="Ex: Focar apenas no lançamento"
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

function PlannedDayModeSummary({
  selectedEnergy,
  editing,
  onEdit,
}: {
  selectedEnergy?: DayMode;
  editing: boolean;
  onEdit: () => void;
}) {
  const option = selectedEnergy ? ENERGY_OPTIONS[selectedEnergy] : undefined;

  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="a-subheadline text-label-secondary">Tipo do dia</p>
        {!editing && (
          <button
            type="button"
            onClick={onEdit}
            className="a-caption min-h-[44px] rounded-full px-3 text-accent transition-colors hover-bg-fill-subtle"
          >
            Alterar
          </button>
        )}
      </div>
      {option ? (
        <div
          className={`energy-option ${option.className} rounded-[18px] border p-3.5`}
          style={{
            backgroundColor: "var(--energy-selected-bg)",
            borderColor:
              "color-mix(in oklab, var(--energy-color) 42%, transparent)",
          }}
        >
          <span className="flex items-baseline justify-between gap-3">
            <span className="text-[15px] font-medium leading-5 text-label">
              Hoje é um dia de {option.label.toLowerCase()}
            </span>
            <span className="text-[13px] font-medium leading-[18px] text-energy">
              {option.mode}
            </span>
          </span>
          <span className="mt-1 block text-[13px] leading-[18px] text-label-secondary">
            {option.consequence}
          </span>
        </div>
      ) : (
        <p className="a-body text-label-secondary">
          Defina a energia de hoje para o app priorizar as tarefas certas.
        </p>
      )}
    </div>
  );
}

function DayModeSelector({
  selectedEnergy,
  onSelect,
}: {
  selectedEnergy?: DayMode;
  onSelect: (level: DayMode) => void;
}) {
  return (
    <div>
      <span className="a-subheadline mb-1 block text-label">
        Como está sua energia hoje?
      </span>
      <p className="mb-3 text-[13px] leading-[18px] text-label-secondary">
        Essa escolha define qual tipo de tarefa o app vai favorecer neste dia.
      </p>
      <div className="grid gap-2.5">
        {(["low", "medium", "high"] as const).map((level) => {
          const option = ENERGY_OPTIONS[level];
          const selected = selectedEnergy === level;

          return (
            <button
              key={level}
              type="button"
              onClick={() => onSelect(level)}
              aria-pressed={selected}
              className={`energy-option ${option.className} min-h-[88px] rounded-[18px] border p-3.5 text-left transition-colors duration-200`}
              style={
                selected
                  ? {
                      backgroundColor: "var(--energy-selected-bg)",
                      borderColor:
                        "color-mix(in oklab, var(--energy-color) 42%, transparent)",
                    }
                  : undefined
              }
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="text-[15px] font-medium leading-5 text-label">
                  {option.label}
                </span>
                <span className="text-[13px] font-medium leading-[18px] text-energy">
                  {option.mode}
                </span>
              </span>
              <span className="mt-1 block text-[13px] leading-[18px] text-label-secondary">
                {option.description}
              </span>
            </button>
          );
        })}
      </div>
      {selectedEnergy && (
        <p className="mt-2 text-[13px] leading-[18px] text-label-secondary">
          {ENERGY_OPTIONS[selectedEnergy].consequence}
        </p>
      )}
    </div>
  );
}
