"use client";

import Link from "next/link";
import { useState } from "react";
import { Button, Card, PageTitle } from "@/components/apple/ui";
import { buildDemoPlannerState } from "@/lib/demo-data";
import { PLANNER_STORAGE_KEY, usePlanner } from "@/lib/planner-store";

export default function DemoPage() {
  const { dispatch } = usePlanner();
  const [loaded, setLoaded] = useState(false);

  const loadDemo = () => {
    const state = buildDemoPlannerState();
    localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(state));
    dispatch({ type: "HYDRATE", state });
    setLoaded(true);
  };

  return (
    <main className="page-with-bottom-dock mx-auto w-full max-w-xl px-5 pt-8">
      <PageTitle
        eyebrow="Demo"
        title="Dados realistas"
        subtitle="Carrega 30 dias de uso consistente e imperfeito só neste navegador."
      />

      <Card className="p-5">
        <div className="space-y-3 text-label-secondary">
          <p className="a-subheadline">
            Inclui tarefas planejadas, pendências, blocos de foco, sessões incompletas,
            hábitos falhos, objetivos trimestrais e Inbox com ideias soltas.
          </p>
          <p className="a-caption">
            Importante: isso substitui os dados locais deste navegador. Exporte um backup
            antes se quiser preservar o estado atual.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button onClick={loadDemo} full>
            Carregar dados demo
          </Button>
          <Link href="/" className="w-full">
            <Button variant="secondary" full>
              Ver app
            </Button>
          </Link>
        </div>

        {loaded && (
          <p className="a-subheadline mt-4 rounded-2xl bg-fill-subtle px-4 py-3 text-label">
            Dados demo carregados. Abra Ritmo, Ano, Hábitos, Inbox e Hoje para testar o design.
          </p>
        )}
      </Card>
    </main>
  );
}
