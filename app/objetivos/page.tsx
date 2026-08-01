"use client";

import { useState } from "react";
import { usePlanner, Quarter } from "@/lib/planner-store";
import { PageTitle, Card, Button, SectionLabel } from "@/components/apple/ui";
import { LifeAreasPanel } from "@/components/planner/LifeAreasPanel";
import Link from "next/link";

const QUARTERS: { id: Quarter; label: string; months: string }[] = [
  { id: "Q1", label: "Trimestre 1", months: "Jan - Mar" },
  { id: "Q2", label: "Trimestre 2", months: "Abr - Jun" },
  { id: "Q3", label: "Trimestre 3", months: "Jul - Set" },
  { id: "Q4", label: "Trimestre 4", months: "Out - Dez" },
];

export default function ObjetivosPage() {
  const { state, dispatch } = usePlanner();
  const year = new Date().getFullYear();
  const yearFocus = state.yearFocus[year] || {};

  const [editing, setEditing] = useState<Quarter | null>(null);
  const [draft, setDraft] = useState("");

  const startEdit = (q: Quarter) => {
    setDraft(yearFocus[q] || "");
    setEditing(q);
  };

  const saveEdit = (q: Quarter) => {
    dispatch({ type: "SET_YEAR_FOCUS", year, quarter: q, text: draft.trim() });
    setEditing(null);
  };

  return (
    <main className="page-with-bottom-dock mx-auto w-full max-w-5xl px-5 pt-8">
      <Link href="/mais" className="mb-8 inline-flex a-hit-44 items-center -ml-2 a-caption text-label-secondary hover-text-label">
        ← Voltar
      </Link>
      
      <PageTitle 
        eyebrow="Visão Macro" 
        title={`Objetivos ${year}`} 
        subtitle="Defina sua única grande prioridade para cada trimestre. Saber para onde está indo facilita as decisões do dia a dia."
      />

      <div className="space-y-8">
        <section className="space-y-4">
          <SectionLabel>Norte do trimestre</SectionLabel>
          <div className="grid gap-4 lg:grid-cols-2">
            {QUARTERS.map((q) => (
              <Card key={q.id} className="p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="a-headline text-label">{q.label}</h3>
                <p className="a-caption text-label-secondary">{q.months}</p>
              </div>
              {editing !== q.id && (
                <button
                  type="button"
                  onClick={() => startEdit(q.id)}
                  className="a-hit-44 -mr-3 a-caption text-accent hover:opacity-80"
                >
                  Editar
                </button>
              )}
            </div>

            {editing === q.id ? (
              <div className="space-y-3">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Ex: Lançar meu app e conseguir os primeiros 100 usuários."
                  className="a-body w-full rounded-2xl bg-fill-subtle p-4 outline-none focus:ring-2 focus-ring-accent resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="secondary" onClick={() => setEditing(null)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => saveEdit(q.id)}>
                    Salvar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-fill-subtle p-4 min-h-[80px] flex items-center">
                {yearFocus[q.id] ? (
                  <p className="a-body text-label">{yearFocus[q.id]}</p>
                ) : (
                  <p className="a-body text-label-secondary opacity-60 italic">
                    Nenhum foco definido para este trimestre.
                  </p>
                )}
              </div>
            )}
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <SectionLabel>Áreas da vida</SectionLabel>
          <LifeAreasPanel state={state} />
        </section>
      </div>
    </main>
  );
}
